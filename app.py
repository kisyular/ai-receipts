"""
FastAPI Receipt Analysis Application
Uses Azure AI Document Intelligence to extract receipt data and store in database
"""

import os
import uuid
from datetime import datetime
from typing import List, Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest

# Load environment variables
load_dotenv()

# FastAPI app initialization
app = FastAPI(
    title="Receipt Analysis API",
    description="API for analyzing receipts using Azure Document Intelligence",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./receipts.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    merchant_name = Column(String)
    transaction_date = Column(DateTime)
    subtotal = Column(Float)
    tax = Column(Float)
    tip = Column(Float)
    total = Column(Float)
    receipt_type = Column(String)
    confidence_score = Column(Float)
    raw_data = Column(Text)  # Store full Azure response as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(String, nullable=False)
    description = Column(String)
    quantity = Column(Float)
    unit_price = Column(Float)
    total_price = Column(Float)
    confidence = Column(Float)

# Create database tables
Base.metadata.create_all(bind=engine)

# Pydantic models for API
class ReceiptItemResponse(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    confidence: Optional[float] = None

class ReceiptResponse(BaseModel):
    id: str
    filename: str
    merchant_name: Optional[str] = None
    transaction_date: Optional[datetime] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    tip: Optional[float] = None
    total: Optional[float] = None
    receipt_type: Optional[str] = None
    confidence_score: Optional[float] = None
    items: List[ReceiptItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReceiptAnalysisRequest(BaseModel):
    url: Optional[str] = None

class ReceiptSaveRequest(BaseModel):
    merchant_name: Optional[str] = None
    transaction_date: Optional[datetime] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    tip: Optional[float] = None
    total: Optional[float] = None
    receipt_type: Optional[str] = None
    confidence_score: Optional[float] = None
    items: List[ReceiptItemResponse] = []

# Azure Document Intelligence setup
endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")

if not endpoint or not key:
    raise ValueError("Azure Document Intelligence credentials not found in environment variables")

document_intelligence_client = DocumentIntelligenceClient(
    endpoint=endpoint, credential=AzureKeyCredential(key)
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file and return file path"""
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    file_extension = Path(upload_file.filename).suffix
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / file_name
    
    with open(file_path, "wb") as buffer:
        content = upload_file.file.read()
        buffer.write(content)
    
    return str(file_path)

def analyze_receipt_from_file(file_path: str):
    """Analyze receipt from local file"""
    try:
        with open(file_path, "rb") as document:
            poller = document_intelligence_client.begin_analyze_document(
                "prebuilt-receipt", document
            )
        receipts = poller.result()
        return receipts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing receipt: {str(e)}"
        )

def analyze_receipt_from_url(url: str):
    """Analyze receipt from URL"""
    try:
        poller = document_intelligence_client.begin_analyze_document(
            "prebuilt-receipt", AnalyzeDocumentRequest(url_source=url)
        )
        receipts = poller.result()
        return receipts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing receipt: {str(e)}"
        )

def extract_receipt_data(receipt_doc):
    """Extract structured data from Azure response"""
    data = {
        "receipt_type": receipt_doc.doc_type,
        "merchant_name": None,
        "transaction_date": None,
        "subtotal": None,
        "tax": None,
        "tip": None,
        "total": None,
        "items": [],
        "confidence_scores": []
    }
    
    # Extract basic fields
    if receipt_doc.fields.get("MerchantName"):
        data["merchant_name"] = receipt_doc.fields["MerchantName"].value_string
        data["confidence_scores"].append(receipt_doc.fields["MerchantName"].confidence)
    
    if receipt_doc.fields.get("TransactionDate"):
        data["transaction_date"] = receipt_doc.fields["TransactionDate"].value_date
        data["confidence_scores"].append(receipt_doc.fields["TransactionDate"].confidence)
    
    if receipt_doc.fields.get("Subtotal"):
        data["subtotal"] = receipt_doc.fields["Subtotal"].value_currency.amount
        data["confidence_scores"].append(receipt_doc.fields["Subtotal"].confidence)
    
    if receipt_doc.fields.get("TotalTax"):
        data["tax"] = receipt_doc.fields["TotalTax"].value_currency.amount
        data["confidence_scores"].append(receipt_doc.fields["TotalTax"].confidence)
    
    if receipt_doc.fields.get("Tip"):
        data["tip"] = receipt_doc.fields["Tip"].value_currency.amount
        data["confidence_scores"].append(receipt_doc.fields["Tip"].confidence)
    
    if receipt_doc.fields.get("Total"):
        data["total"] = receipt_doc.fields["Total"].value_currency.amount
        data["confidence_scores"].append(receipt_doc.fields["Total"].confidence)
    
    # Extract items
    if receipt_doc.fields.get("Items"):
        for item in receipt_doc.fields["Items"].value_array:
            item_data = {}
            if item.value_object.get("Description"):
                item_data["description"] = item.value_object["Description"].value_string
            if item.value_object.get("Quantity"):
                item_data["quantity"] = item.value_object["Quantity"].value_number
            if item.value_object.get("Price"):
                item_data["unit_price"] = item.value_object["Price"].value_currency.amount
            if item.value_object.get("TotalPrice"):
                item_data["total_price"] = item.value_object["TotalPrice"].value_currency.amount
            data["items"].append(item_data)
    
    # Calculate average confidence
    data["confidence_score"] = sum(data["confidence_scores"]) / len(data["confidence_scores"]) if data["confidence_scores"] else 0
    
    return data

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Receipt Analysis API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/analyze/upload", response_model=ReceiptResponse)
async def analyze_receipt_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Analyze receipt from uploaded file"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Save uploaded file
    file_path = save_upload_file(file)
    
    try:
        # Analyze receipt
        receipts = analyze_receipt_from_file(file_path)
        
        if not receipts.documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No receipt found in the image"
            )
        
        # Extract data from first receipt
        receipt_data = extract_receipt_data(receipts.documents[0])
        
        # Save to database
        receipt = Receipt(
            filename=file.filename,
            merchant_name=receipt_data["merchant_name"],
            transaction_date=receipt_data["transaction_date"],
            subtotal=receipt_data["subtotal"],
            tax=receipt_data["tax"],
            tip=receipt_data["tip"],
            total=receipt_data["total"],
            receipt_type=receipt_data["receipt_type"],
            confidence_score=receipt_data["confidence_score"],
            raw_data=str(receipts.documents[0].__dict__)
        )
        
        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        
        # Save items
        for item_data in receipt_data["items"]:
            item = ReceiptItem(
                receipt_id=receipt.id,
                description=item_data.get("description"),
                quantity=item_data.get("quantity"),
                unit_price=item_data.get("unit_price"),
                total_price=item_data.get("total_price")
            )
            db.add(item)
        
        db.commit()
        
        # Return response
        return ReceiptResponse(
            id=receipt.id,
            filename=receipt.filename,
            merchant_name=receipt.merchant_name,
            transaction_date=receipt.transaction_date,
            subtotal=receipt.subtotal,
            tax=receipt.tax,
            tip=receipt.tip,
            total=receipt.total,
            receipt_type=receipt.receipt_type,
            confidence_score=receipt.confidence_score,
            items=[ReceiptItemResponse(**item_data) for item_data in receipt_data["items"]],
            created_at=receipt.created_at,
            updated_at=receipt.updated_at
        )
        
    except Exception as e:
        # Clean up uploaded file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e

@app.post("/analyze/url", response_model=ReceiptResponse)
async def analyze_receipt_url(
    request: ReceiptAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze receipt from URL"""
    if not request.url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required"
        )
    
    # Analyze receipt
    receipts = analyze_receipt_from_url(request.url)
    
    if not receipts.documents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No receipt found in the image"
        )
    
    # Extract data from first receipt
    receipt_data = extract_receipt_data(receipts.documents[0])
    
    # Save to database
    receipt = Receipt(
        filename=f"receipt_from_url_{uuid.uuid4()}",
        merchant_name=receipt_data["merchant_name"],
        transaction_date=receipt_data["transaction_date"],
        subtotal=receipt_data["subtotal"],
        tax=receipt_data["tax"],
        tip=receipt_data["tip"],
        total=receipt_data["total"],
        receipt_type=receipt_data["receipt_type"],
        confidence_score=receipt_data["confidence_score"],
        raw_data=str(receipts.documents[0].__dict__)
    )
    
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    # Save items
    for item_data in receipt_data["items"]:
        item = ReceiptItem(
            receipt_id=receipt.id,
            description=item_data.get("description"),
            quantity=item_data.get("quantity"),
            unit_price=item_data.get("unit_price"),
            total_price=item_data.get("total_price")
        )
        db.add(item)
    
    db.commit()
    
    return ReceiptResponse(
        id=receipt.id,
        filename=receipt.filename,
        merchant_name=receipt.merchant_name,
        transaction_date=receipt.transaction_date,
        subtotal=receipt.subtotal,
        tax=receipt.tax,
        tip=receipt.tip,
        total=receipt.total,
        receipt_type=receipt.receipt_type,
        confidence_score=receipt.confidence_score,
        items=[ReceiptItemResponse(**item_data) for item_data in receipt_data["items"]],
        created_at=receipt.created_at,
        updated_at=receipt.updated_at
    )

@app.get("/receipts", response_model=List[ReceiptResponse])
async def get_receipts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all receipts with pagination"""
    receipts = db.query(Receipt).offset(skip).limit(limit).all()
    
    result = []
    for receipt in receipts:
        items = db.query(ReceiptItem).filter(ReceiptItem.receipt_id == receipt.id).all()
        receipt_response = ReceiptResponse(
            id=receipt.id,
            filename=receipt.filename,
            merchant_name=receipt.merchant_name,
            transaction_date=receipt.transaction_date,
            subtotal=receipt.subtotal,
            tax=receipt.tax,
            tip=receipt.tip,
            total=receipt.total,
            receipt_type=receipt.receipt_type,
            confidence_score=receipt.confidence_score,
            items=[ReceiptItemResponse(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
                confidence=item.confidence
            ) for item in items],
            created_at=receipt.created_at,
            updated_at=receipt.updated_at
        )
        result.append(receipt_response)
    
    return result

@app.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    db: Session = Depends(get_db)
):
    """Get specific receipt by ID"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    items = db.query(ReceiptItem).filter(ReceiptItem.receipt_id == receipt.id).all()
    
    return ReceiptResponse(
        id=receipt.id,
        filename=receipt.filename,
        merchant_name=receipt.merchant_name,
        transaction_date=receipt.transaction_date,
        subtotal=receipt.subtotal,
        tax=receipt.tax,
        tip=receipt.tip,
        total=receipt.total,
        receipt_type=receipt.receipt_type,
        confidence_score=receipt.confidence_score,
        items=[ReceiptItemResponse(
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            confidence=item.confidence
        ) for item in items],
        created_at=receipt.created_at,
        updated_at=receipt.updated_at
    )

@app.delete("/receipts/{receipt_id}")
async def delete_receipt(
    receipt_id: str,
    db: Session = Depends(get_db)
):
    """Delete receipt by ID"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Delete associated items first
    db.query(ReceiptItem).filter(ReceiptItem.receipt_id == receipt_id).delete()
    db.delete(receipt)
    db.commit()
    
    return {"message": "Receipt deleted successfully"}

@app.post("/receipts/save", response_model=ReceiptResponse)
async def save_receipt(
    request: ReceiptSaveRequest,
    db: Session = Depends(get_db)
):
    """Save receipt data to database"""
    try:
        # Create new receipt
        receipt = Receipt(
            filename=f"manual_save_{uuid.uuid4()}",
            merchant_name=request.merchant_name,
            transaction_date=request.transaction_date,
            subtotal=request.subtotal,
            tax=request.tax,
            tip=request.tip,
            total=request.total,
            receipt_type=request.receipt_type,
            confidence_score=request.confidence_score,
            raw_data="{}"  # Empty JSON for manual saves
        )
        
        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        
        # Save items
        for item_data in request.items:
            item = ReceiptItem(
                receipt_id=receipt.id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price,
                confidence=item_data.confidence
            )
            db.add(item)
        
        db.commit()
        
        return ReceiptResponse(
            id=receipt.id,
            filename=receipt.filename,
            merchant_name=receipt.merchant_name,
            transaction_date=receipt.transaction_date,
            subtotal=receipt.subtotal,
            tax=receipt.tax,
            tip=receipt.tip,
            total=receipt.total,
            receipt_type=receipt.receipt_type,
            confidence_score=receipt.confidence_score,
            items=request.items,
            created_at=receipt.created_at,
            updated_at=receipt.updated_at
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving receipt: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
