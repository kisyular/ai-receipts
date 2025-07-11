# Azure Deployment Script for Receipt Analyzer
# Run this script from PowerShell with Azure CLI installed

param(
    [string]$ResourceGroupName = "receipt-analyzer-rg",
    [string]$Location = "eastus",
    [string]$AppName = "receipt-analyzer-api",
    [string]$PlanName = "receipt-analyzer-plan",
    [string]$CognitiveServiceName = "receipt-analyzer-cognitive"
)

Write-Host "🚀 Starting Azure Deployment..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --query "user.name" -o tsv
    if ($account) {
        Write-Host "✅ Logged in as: $account" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Create Resource Group
Write-Host "📦 Creating Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Create App Service Plan
Write-Host "📋 Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create --name $PlanName --resource-group $ResourceGroupName --sku B1 --is-linux

# Create Web App
Write-Host "🌐 Creating Web App..." -ForegroundColor Yellow
az webapp create --name $AppName --resource-group $ResourceGroupName --plan $PlanName --runtime "PYTHON:3.11"

# Create Cognitive Services (if not exists)
Write-Host "🧠 Creating Cognitive Services..." -ForegroundColor Yellow
az cognitiveservices account create --name $CognitiveServiceName --resource-group $ResourceGroupName --kind CognitiveServices --sku S0 --location $Location

# Get Cognitive Services credentials
Write-Host "🔑 Getting Cognitive Services credentials..." -ForegroundColor Yellow
$cognitiveEndpoint = az cognitiveservices account show --name $CognitiveServiceName --resource-group $ResourceGroupName --query "properties.endpoint" -o tsv
$cognitiveKey = az cognitiveservices account keys list --name $CognitiveServiceName --resource-group $ResourceGroupName --query "key1" -o tsv

# Configure environment variables
Write-Host "⚙️ Configuring environment variables..." -ForegroundColor Yellow
az webapp config appsettings set --name $AppName --resource-group $ResourceGroupName --settings AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="$cognitiveEndpoint"
az webapp config appsettings set --name $AppName --resource-group $ResourceGroupName --settings AZURE_DOCUMENT_INTELLIGENCE_KEY="$cognitiveKey"
az webapp config appsettings set --name $AppName --resource-group $ResourceGroupName --settings SECRET_KEY="$(New-Guid)"

# Configure Python version
Write-Host "🐍 Configuring Python version..." -ForegroundColor Yellow
az webapp config set --name $AppName --resource-group $ResourceGroupName --linux-fx-version "PYTHON|3.11"

# Enable logging
Write-Host "📝 Enabling application logging..." -ForegroundColor Yellow
az webapp log config --name $AppName --resource-group $ResourceGroupName --web-server-logging filesystem

# Get the web app URL
$webAppUrl = az webapp show --name $AppName --resource-group $ResourceGroupName --query "defaultHostName" -o tsv

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your API is available at: https://$webAppUrl" -ForegroundColor Cyan
Write-Host "📚 API Documentation: https://$webAppUrl/docs" -ForegroundColor Cyan
Write-Host "💚 Health Check: https://$webAppUrl/health" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy your frontend to Azure Static Web Apps" -ForegroundColor White
Write-Host "2. Update CORS settings in app.py with your frontend domain" -ForegroundColor White
Write-Host "3. Set up monitoring with Application Insights" -ForegroundColor White
Write-Host "4. Configure custom domain if needed" -ForegroundColor White

Write-Host "`n🔧 To deploy your code:" -ForegroundColor Yellow
Write-Host "az webapp deployment source config-local-git --name $AppName --resource-group $ResourceGroupName" -ForegroundColor White
Write-Host "git remote add azure <git-url-from-above-command>" -ForegroundColor White
Write-Host "git push azure main" -ForegroundColor White 