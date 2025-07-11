#!/bin/bash

# Azure Deployment Script for Receipt Analyzer
# Run this script from bash with Azure CLI installed

# Default values
RESOURCE_GROUP_NAME="receipt-analyzer-rg"
LOCATION="eastus"
APP_NAME="receipt-analyzer-api"
PLAN_NAME="receipt-analyzer-plan"
COGNITIVE_SERVICE_NAME="receipt-analyzer-cognitive"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Azure Deployment...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo -e "${YELLOW}Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI is installed${NC}"

# Check if logged in to Azure
ACCOUNT=$(az account show --query "user.name" -o tsv 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    echo -e "${RED}❌ Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in as: $ACCOUNT${NC}"

# Create Resource Group
echo -e "${YELLOW}📦 Creating Resource Group...${NC}"
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

# Create App Service Plan
echo -e "${YELLOW}📋 Creating App Service Plan...${NC}"
az appservice plan create --name $PLAN_NAME --resource-group $RESOURCE_GROUP_NAME --sku B1 --is-linux

# Create Web App
echo -e "${YELLOW}🌐 Creating Web App...${NC}"
az webapp create --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --plan $PLAN_NAME --runtime "PYTHON:3.11"

# Create Cognitive Services (if not exists)
echo -e "${YELLOW}🧠 Creating Cognitive Services...${NC}"
az cognitiveservices account create --name $COGNITIVE_SERVICE_NAME --resource-group $RESOURCE_GROUP_NAME --kind CognitiveServices --sku S0 --location $LOCATION

# Get Cognitive Services credentials
echo -e "${YELLOW}🔑 Getting Cognitive Services credentials...${NC}"
COGNITIVE_ENDPOINT=$(az cognitiveservices account show --name $COGNITIVE_SERVICE_NAME --resource-group $RESOURCE_GROUP_NAME --query "properties.endpoint" -o tsv)
COGNITIVE_KEY=$(az cognitiveservices account keys list --name $COGNITIVE_SERVICE_NAME --resource-group $RESOURCE_GROUP_NAME --query "key1" -o tsv)

# Configure environment variables
echo -e "${YELLOW}⚙️ Configuring environment variables...${NC}"
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --settings AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="$COGNITIVE_ENDPOINT"
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --settings AZURE_DOCUMENT_INTELLIGENCE_KEY="$COGNITIVE_KEY"
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --settings SECRET_KEY="$(uuidgen)"

# Configure Python version
echo -e "${YELLOW}🐍 Configuring Python version...${NC}"
az webapp config set --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --linux-fx-version "PYTHON|3.11"

# Enable logging
echo -e "${YELLOW}📝 Enabling application logging...${NC}"
az webapp log config --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --web-server-logging filesystem

# Get the web app URL
WEB_APP_URL=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --query "defaultHostName" -o tsv)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${CYAN}🌐 Your API is available at: https://$WEB_APP_URL${NC}"
echo -e "${CYAN}📚 API Documentation: https://$WEB_APP_URL/docs${NC}"
echo -e "${CYAN}💚 Health Check: https://$WEB_APP_URL/health${NC}"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Deploy your frontend to Azure Static Web Apps"
echo -e "2. Update CORS settings in app.py with your frontend domain"
echo -e "3. Set up monitoring with Application Insights"
echo -e "4. Configure custom domain if needed"

echo -e "\n${YELLOW}🔧 To deploy your code:${NC}"
echo -e "az webapp deployment source config-local-git --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME"
echo -e "git remote add azure <git-url-from-above-command>"
echo -e "git push azure main"

echo -e "\n${YELLOW}🔍 To view logs:${NC}"
echo -e "az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME"

echo -e "\n${YELLOW}🗑️ To clean up resources:${NC}"
echo -e "az group delete --name $RESOURCE_GROUP_NAME --yes" 