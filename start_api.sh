#!/bin/bash

# Stella API Startup Script

echo "🚀 Starting Stella Financial Assistant API..."

# Check if .env file exists in backend directory
if [ ! -f backend/.env ]; then
    echo "⚠️  Warning: backend/.env file not found. Creating a template..."
    cat > backend/.env << EOF
# API - LLM Provider (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# API - Data Providers
FMP_API_KEY=your_fmp_api_key_here
NEWS_API_KEY=your_news_api_key_here

# LangChain
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=stella-next
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
EOF
    echo "📝 Please edit backend/.env with your API keys before running again."
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📥 Installing dependencies..."
pip install -r backend/requirements.txt

# Change to API directory and start the server
echo "🌟 Starting Stella API server on http://localhost:8000"
echo "📚 API Documentation will be available at http://localhost:8000/docs"
echo "🏥 Health check available at http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"

cd backend/api && python api.py