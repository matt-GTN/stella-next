#!/bin/bash

# Stella API Startup Script

echo "🚀 Starting Stella Financial Assistant API..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating a template..."
    cat > .env << EOF
# Stella API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=stella
EOF
    echo "📝 Please edit .env with your API keys before running again."
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
pip install -r requirements.txt

# Start the API server
echo "🌟 Starting Stella API server on http://localhost:8000"
echo "📚 API Documentation will be available at http://localhost:8000/docs"
echo "🏥 Health check available at http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"

python api.py
