# Receipt Analysis FastAPI Application

A comprehensive FastAPI application that uses Azure AI Document Intelligence to extract and analyze receipt data, with database storage, REST API endpoints, and a Progressive Web App (PWA) frontend.

## 🏗️ Project Structure

```
Report Fast API/
├── 📁 app.py                          # Main FastAPI backend application
├── 📁 requirements.txt                 # Python dependencies
├── 📁 receipts.db                      # SQLite database (auto-generated)
├── 📁 .env                            # Environment variables (create this)
├── 📁 app.log                         # Application logs (auto-generated)
├── 📁 uploads/                        # Temporary file storage (auto-generated)
│
├── 📁 pwa_app/                        # Progressive Web App Frontend
│   ├── 📄 index.html                  # Main HTML file
│   ├── 📄 app.js                      # JavaScript application logic
│   ├── 📄 styles.css                  # CSS styles
│   ├── 📄 manifest.json               # PWA manifest
│   ├── 📄 sw.js                       # Service Worker
│   └── 📄 README.md                   # PWA documentation
│
├── 📁 images/                         # Sample receipt images
│   ├── 📄 2bd8bb1978cbae4aad67c374ce683852.jpg
│   ├── 📄 57113791e6c1fbff85bd584951e06883.jpg
│   └── 📄 7cdf084052285086106a709ed1ca3926.jpg
│
└── 📄 README.md                       # This file
```

## ✨ Features

### Backend (FastAPI)

- 📸 **Image Upload**: Upload receipt images for analysis
- 🔗 **URL Analysis**: Analyze receipts from URLs
- 💾 **Database Storage**: Store extracted data in SQLite/PostgreSQL
- 🔍 **Receipt Retrieval**: Get all receipts or specific receipt by ID
- 🗑️ **Receipt Management**: Delete receipts
- 📊 **Structured Data**: Extract merchant name, date, items, totals, etc.
- 🎯 **Confidence Scores**: Track AI confidence for each extracted field
- 🔒 **Security**: CORS protection, input validation, error handling
- 📝 **Logging**: Comprehensive logging system

### Frontend (PWA)

- 📱 **Mobile-First Design**: Optimized for mobile devices
- 📷 **Camera Integration**: Take photos directly from the app
- 🖼️ **Gallery Selection**: Choose images from your device
- 🔄 **Drag & Drop**: Upload images by dragging and dropping
- 📋 **Receipt History**: View all saved receipts in a dedicated tab
- 👁️ **Receipt Details**: View detailed information for each saved receipt
- 🗑️ **Delete Receipts**: Remove receipts from the database
- ⚡ **Offline Support**: Works offline with cached content
- 🎨 **Modern UI**: Clean, responsive design with Bootstrap
- 📊 **Real-time Analysis**: Instant receipt analysis results
- 🔔 **Push Notifications**: Framework for notifications

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Azure subscription
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Report Fast API"
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

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

### 4. Azure Cognitive Services Setup

1. **Create Azure Cognitive Services Resource:**

   - Go to Azure Portal → Create Resource
   - Search for "Cognitive Services"
   - Select "Cognitive Services" and click Create
   - Fill in the required details:
     - Subscription: Your subscription
     - Resource group: Create new or use existing
     - Region: Choose closest to your users
     - Name: `receipt-analyzer-cognitive`
     - Pricing tier: Standard S0 (or higher for production)
   - Click "Review + create" then "Create"

2. **Enable Document Intelligence:**

   - Go to your Cognitive Services resource
   - Navigate to "Document Intelligence" in the left menu
   - Click "Get started" to enable the service

3. **Get Credentials:**
   - Go to "Keys and Endpoint" in the left menu
   - Copy Key 1 and Endpoint URL
   - Add them to your `.env` file

### 5. Run the Application

#### Development Mode

```bash
python app.py
```

#### Production Mode

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Test the Application

1. **Backend API:** Visit `http://localhost:8000/docs` for interactive API documentation
2. **Frontend PWA:**
   ```bash
   cd pwa_app
   python -m http.server 8080
   ```
   Then visit `http://localhost:8080`

## 🌐 Azure Deployment Guide

### Option 1: Azure App Service (Recommended)

#### Prerequisites

- Azure subscription
- Azure CLI installed
- Git repository with your code

#### Step 1: Prepare Your Application

1. **Create a `startup.txt` file in the root directory:**

   ```txt
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

2. **Create a `.deployment` file in the root directory:**

   ```ini
   [config]
   command = pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8000
   ```

3. **Update `requirements.txt` to include production dependencies:**
   ```txt
   fastapi==0.104.1
   uvicorn[standard]==0.24.0
   python-multipart==0.0.6
   sqlalchemy==2.0.23
   python-dotenv
   azure-ai-documentintelligence
   azure-core
   pydantic==2.5.0
   python-jose[cryptography]==3.3.0
   passlib[bcrypt]==1.7.4
   psycopg2-binary==2.9.9  # For PostgreSQL
   ```

#### Step 2: Create Azure Resources

1. **Create Resource Group:**

   ```bash
   az group create --name receipt-analyzer-rg --location eastus
   ```

2. **Create App Service Plan:**

   ```bash
   az appservice plan create --name receipt-analyzer-plan --resource-group receipt-analyzer-rg --sku B1 --is-linux
   ```

3. **Create Web App:**

   ```bash
   az webapp create --name receipt-analyzer-api --resource-group receipt-analyzer-rg --plan receipt-analyzer-plan --runtime "PYTHON:3.11"
   ```

4. **Create Azure Database for PostgreSQL (Optional):**
   ```bash
   az postgres flexible-server create --name receipt-analyzer-db --resource-group receipt-analyzer-rg --location eastus --admin-user dbadmin --admin-password "YourStrongPassword123!" --sku-name Standard_B1ms
   ```

#### Step 3: Configure Environment Variables

1. **Set Azure Document Intelligence credentials:**

   ```bash
   az webapp config appsettings set --name receipt-analyzer-api --resource-group receipt-analyzer-rg --settings AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
   az webapp config appsettings set --name receipt-analyzer-api --resource-group receipt-analyzer-rg --settings AZURE_DOCUMENT_INTELLIGENCE_KEY="your_azure_key_here"
   ```

2. **Set database URL (if using PostgreSQL):**

   ```bash
   az webapp config appsettings set --name receipt-analyzer-api --resource-group receipt-analyzer-rg --settings DATABASE_URL="postgresql://dbadmin:YourStrongPassword123!@receipt-analyzer-db.postgres.database.azure.com:5432/receipts"
   ```

3. **Set security settings:**
   ```bash
   az webapp config appsettings set --name receipt-analyzer-api --resource-group receipt-analyzer-rg --settings SECRET_KEY="your-super-secret-key-here"
   ```

#### Step 4: Deploy Your Application

1. **Deploy using Azure CLI:**

   ```bash
   az webapp deployment source config-local-git --name receipt-analyzer-api --resource-group receipt-analyzer-rg
   az webapp deployment source config --name receipt-analyzer-api --resource-group receipt-analyzer-rg --repo-url https://github.com/yourusername/your-repo.git --branch main --manual-integration
   ```

2. **Or deploy using GitHub Actions (Recommended):**

   Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to Azure

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2

         - name: Deploy to Azure Web App
           uses: azure/webapps-deploy@v2
           with:
             app-name: "receipt-analyzer-api"
             publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
             package: .
   ```

#### Step 5: Configure CORS for Production

Update the CORS settings in `app.py` to include your production domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "https://your-pwa-domain.com",
        # Add other allowed origins
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### Option 2: Azure Container Instances

#### Step 1: Create Dockerfile

Create a `Dockerfile` in the root directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Step 2: Build and Deploy

```bash
# Build the image
docker build -t receipt-analyzer .

# Tag for Azure Container Registry
docker tag receipt-analyzer yourregistry.azurecr.io/receipt-analyzer:latest

# Push to Azure Container Registry
docker push yourregistry.azurecr.io/receipt-analyzer:latest

# Deploy to Azure Container Instances
az container create \
  --resource-group receipt-analyzer-rg \
  --name receipt-analyzer-container \
  --image yourregistry.azurecr.io/receipt-analyzer:latest \
  --dns-name-label receipt-analyzer \
  --ports 8000 \
  --environment-variables \
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://your-resource.cognitiveservices.azure.com/" \
    AZURE_DOCUMENT_INTELLIGENCE_KEY="your_azure_key_here"
```

### Option 3: Azure Functions (Serverless)

#### Step 1: Create Function App

```bash
az functionapp create --name receipt-analyzer-func --resource-group receipt-analyzer-rg --consumption-plan-location eastus --runtime python --functions-version 4
```

#### Step 2: Deploy Function

Create `function_app.py`:

```python
import azure.functions as func
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import nest_asyncio

nest_asyncio.apply()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import your existing app routes
from app import *

@app.get("/")
async def root():
    return {"message": "Receipt Analysis API", "version": "1.0.0"}

# Azure Functions handler
async def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
    return await func.AsgiMiddleware(app).handle_async(req, context)
```

## 🎨 Frontend Deployment

### Deploy PWA to Azure Static Web Apps

#### Step 1: Create Static Web App

```bash
az staticwebapp create --name receipt-analyzer-pwa --resource-group receipt-analyzer-rg --source https://github.com/yourusername/your-repo --location eastus --branch main --app-location pwa_app
```

#### Step 2: Configure API URL

Update `pwa_app/app.js` to use your production API URL:

```javascript
this.apiUrl = "https://receipt-analyzer-api.azurewebsites.net";
```

#### Step 3: Deploy Frontend

```bash
cd pwa_app
npm install -g @azure/static-web-apps-cli
swa deploy
```

### Alternative: Deploy to Azure Blob Storage

1. **Create Storage Account:**

   ```bash
   az storage account create --name receiptanalyzerpwa --resource-group receipt-analyzer-rg --location eastus --sku Standard_LRS --kind StorageV2
   ```

2. **Enable Static Website:**

   ```bash
   az storage blob service-properties update --account-name receiptanalyzerpwa --static-website --index-document index.html --404-document index.html
   ```

3. **Upload Files:**
   ```bash
   az storage blob upload-batch --account-name receiptanalyzerpwa --source pwa_app --destination '$web'
   ```

## 🔧 Configuration

### Environment Variables

| Variable                               | Description                       | Required | Default                   |
| -------------------------------------- | --------------------------------- | -------- | ------------------------- |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | Azure Cognitive Services endpoint | Yes      | -                         |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY`      | Azure Cognitive Services API key  | Yes      | -                         |
| `DATABASE_URL`                         | Database connection string        | No       | `sqlite:///./receipts.db` |
| `SECRET_KEY`                           | JWT secret key                    | No       | `your-secret-key-here`    |
| `ALGORITHM`                            | JWT algorithm                     | No       | `HS256`                   |
| `ACCESS_TOKEN_EXPIRE_MINUTES`          | Token expiration time             | No       | `30`                      |

### Production Checklist

- [ ] ✅ Azure Cognitive Services configured
- [ ] ✅ Environment variables set
- [ ] ✅ CORS configured for production domains
- [ ] ✅ Database configured (PostgreSQL recommended)
- [ ] ✅ SSL/HTTPS enabled
- [ ] ✅ Monitoring and logging configured
- [ ] ✅ Backup strategy implemented
- [ ] ✅ Security headers configured
- [ ] ✅ Rate limiting implemented
- [ ] ✅ Error handling tested

## 📊 Monitoring and Logging

### Azure Application Insights

1. **Create Application Insights:**

   ```bash
   az monitor app-insights component create --app receipt-analyzer-insights --location eastus --resource-group receipt-analyzer-rg --application-type web
   ```

2. **Add to your application:**

   ```python
   from opencensus.ext.azure.log_exporter import AzureLogHandler

   logger = logging.getLogger(__name__)
   logger.addHandler(AzureLogHandler(
       connection_string='InstrumentationKey=your-key-here')
   )
   ```

### Health Checks

The application includes health check endpoints:

- `GET /health` - Basic health check
- `GET /` - API status and version

## 🔒 Security Considerations

### Production Security

1. **HTTPS Only:** Always use HTTPS in production
2. **CORS Configuration:** Restrict CORS to specific domains
3. **API Keys:** Store Azure keys in Azure Key Vault
4. **Database Security:** Use managed identity for database access
5. **Input Validation:** All inputs are validated
6. **Error Handling:** Sensitive information is not exposed in errors

### Azure Security Features

- **Azure Key Vault:** Store secrets securely
- **Managed Identity:** Secure database connections
- **Network Security Groups:** Control network access
- **Azure Security Center:** Monitor security threats

## 🚀 Performance Optimization

### Backend Optimization

1. **Database Indexing:** Add indexes for frequently queried fields
2. **Caching:** Implement Redis caching for frequently accessed data
3. **Connection Pooling:** Use connection pooling for database connections
4. **Async Operations:** All I/O operations are async

### Frontend Optimization

1. **Service Worker:** Offline caching and background sync
2. **Image Compression:** Optimize images before upload
3. **Lazy Loading:** Load components on demand
4. **CDN:** Use Azure CDN for static assets

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors:**

   - Check CORS configuration in `app.py`
   - Verify frontend URL is in allowed origins

2. **Azure Cognitive Services Errors:**

   - Verify endpoint and key are correct
   - Check service quota and limits
   - Ensure Document Intelligence is enabled

3. **Database Connection Issues:**

   - Verify connection string format
   - Check firewall rules for Azure Database
   - Ensure database exists and is accessible

4. **File Upload Issues:**
   - Check file size limits
   - Verify file format (images only)
   - Check disk space on server

### Debug Mode

Enable debug logging by setting the log level:

```python
logging.basicConfig(level=logging.DEBUG)
```

### Log Files

- Application logs: `app.log`
- Azure App Service logs: Available in Azure Portal
- Container logs: `docker logs <container-name>`

## 📈 Scaling

### Horizontal Scaling

1. **App Service:** Configure auto-scaling rules
2. **Container Instances:** Use Azure Container Apps
3. **Functions:** Automatically scales based on demand

### Vertical Scaling

1. **App Service Plan:** Upgrade to higher tier
2. **Database:** Scale up database resources
3. **Cognitive Services:** Upgrade to higher tier

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          python -m pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: "receipt-analyzer-api"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review Azure Monitor logs
3. Check Application Insights
4. Contact Azure Support if needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note:** This application requires Azure Cognitive Services Document Intelligence to function. Ensure you have proper Azure subscription and billing configured.

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
