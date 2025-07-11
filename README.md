# Receipt Analysis FastAPI Application

A FastAPI application that uses Azure AI Document Intelligence to extract and analyze receipt data, with database storage and REST API endpoints.

## Features

- 📸 **Image Upload**: Upload receipt images for analysis
- 🔗 **URL Analysis**: Analyze receipts from URLs
- 💾 **Database Storage**: Store extracted data in SQLite database
- 🔍 **Receipt Retrieval**: Get all receipts or specific receipt by ID
- 🗑️ **Receipt Management**: Delete receipts
- 📊 **Structured Data**: Extract merchant name, date, items, totals, etc.
- 🎯 **Confidence Scores**: Track AI confidence for each extracted field

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Azure Document Intelligence Configuration
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your_azure_key_here

# Database Configuration (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./receipts.db

# Security (for production)
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Azure Setup

1. Create an Azure Cognitive Services resource
2. Enable Document Intelligence (formerly Form Recognizer)
3. Get your endpoint URL and API key
4. Add them to your `.env` file

### 4. Run the Application

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## API Endpoints

### Base URL

```
http://localhost:8000
```

### Endpoints

#### 1. Health Check

```
GET /
```

Returns API status and version.

#### 2. Analyze Receipt from Upload

```
POST /analyze/upload
```

Upload a receipt image for analysis.

**Request**: Multipart form data with image file
**Response**: Receipt data with extracted information

#### 3. Analyze Receipt from URL

```
POST /analyze/url
```

Analyze a receipt from a URL.

**Request Body**:

```json
{
  "url": "https://example.com/receipt.jpg"
}
```

#### 4. Get All Receipts

```
GET /receipts?skip=0&limit=100
```

Retrieve all receipts with pagination.

**Query Parameters**:

- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100)

#### 5. Get Specific Receipt

```
GET /receipts/{receipt_id}
```

Get a specific receipt by ID.

#### 6. Delete Receipt

```
DELETE /receipts/{receipt_id}
```

Delete a receipt and its associated items.

## Response Format

### Receipt Response

```json
{
  "id": "uuid-string",
  "filename": "receipt.jpg",
  "merchant_name": "Walmart",
  "transaction_date": "2023-12-01T10:30:00",
  "subtotal": 45.67,
  "tax": 3.65,
  "tip": 5.0,
  "total": 54.32,
  "receipt_type": "receipt",
  "confidence_score": 0.95,
  "items": [
    {
      "description": "Milk",
      "quantity": 2,
      "unit_price": 3.99,
      "total_price": 7.98,
      "confidence": 0.92
    }
  ],
  "created_at": "2023-12-01T10:30:00",
  "updated_at": "2023-12-01T10:30:00"
}
```

## Database Schema

### Receipts Table

- `id`: Primary key (UUID)
- `filename`: Original filename
- `merchant_name`: Extracted merchant name
- `transaction_date`: Transaction date
- `subtotal`: Subtotal amount
- `tax`: Tax amount
- `tip`: Tip amount
- `total`: Total amount
- `receipt_type`: Type of receipt
- `confidence_score`: Average confidence score
- `raw_data`: Raw Azure response (JSON)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Receipt Items Table

- `id`: Primary key
- `receipt_id`: Foreign key to receipts
- `description`: Item description
- `quantity`: Item quantity
- `unit_price`: Unit price
- `total_price`: Total price for item
- `confidence`: Confidence score for item

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid file, missing URL, etc.)
- `404`: Not Found (receipt not found)
- `500`: Internal Server Error (Azure API errors, etc.)

## Development

### Project Structure

```
├── app.py              # Main FastAPI application
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── .env               # Environment variables (create this)
├── receipts.db        # SQLite database (auto-created)
└── uploads/           # Uploaded files directory (auto-created)
```

### Adding New Features

1. **Authentication**: Add JWT token authentication
2. **User Management**: Support multiple users
3. **Receipt Categories**: Add categorization and tags
4. **Export Features**: CSV, PDF export
5. **Search**: Full-text search across receipts
6. **Analytics**: Spending patterns, merchant analysis

## Production Deployment

### Security Considerations

1. Use environment variables for all secrets
2. Implement proper authentication
3. Use HTTPS in production
4. Configure CORS appropriately
5. Use a production database (PostgreSQL, MySQL)
6. Implement rate limiting
7. Add logging and monitoring

### Deployment Options

1. **Docker**: Containerize the application
2. **Cloud Platforms**: Deploy to Azure, AWS, or GCP
3. **Serverless**: Use Azure Functions or AWS Lambda
4. **Traditional**: Deploy to VPS or dedicated server

## Next Steps

1. **Kivy Mobile App**: Create a mobile application for taking photos
2. **Real-time Processing**: Add WebSocket support for real-time updates
3. **Batch Processing**: Process multiple receipts at once
4. **Machine Learning**: Add receipt categorization and fraud detection
5. **Integration**: Connect with accounting software and expense management tools

## License

MIT License - feel free to use this project for your own applications.
