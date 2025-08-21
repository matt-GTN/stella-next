# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Stella-Next is a full-stack financial assistant application combining a modern Next.js frontend with an intelligent AI agent backend. The project features **Stella**, an agentic financial assistant built with LangGraph that can analyze stocks, assess risks, and provide market insights through a conversational interface.

### Architecture

```
stella-next/
├── frontend/           # Next.js 15 portfolio/chat interface
├── backend/           # FastAPI server + LangGraph agent
│   ├── agent/        # Core Stella agent implementation
│   ├── api.py        # FastAPI REST and streaming endpoints
│   └── src/          # Supporting modules and tools
```

## Common Development Commands

### Backend (FastAPI + LangGraph Agent)

```bash
# Quick setup and start
cd backend
./start_api.sh          # Automatic setup: venv, deps, server start

# Manual setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start development server
python api.py           # API available at http://localhost:8000

# Test the API
python test_api.py
./curl_examples.sh      # Comprehensive API testing

# Test agent components
cd agent
python agent.py         # Test core agent
cd ..
python test_streaming.py   # Test streaming functionality
python direct_streaming.py # Test direct LLM streaming
```

### Frontend (Next.js 15 Portfolio)

```bash
cd frontend

# Install dependencies
npm install

# Development
npm run dev             # Start dev server at http://localhost:3000
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Docker Deployment

```bash
# Backend
cd backend
docker build -t stella-api .
docker run -p 8000:8000 stella-api

# Frontend  
cd frontend
docker build -t stella-frontend .
docker run -p 3000:3000 stella-frontend
```

## Core Architecture Patterns

### LangGraph Agent Workflow

The Stella agent (`backend/agent/`) implements a sophisticated multi-step workflow:

1. **Agent Node**: LLM makes decisions about tool usage based on user input
2. **Tool Execution**: Specialized financial tools (12 available) execute based on agent decisions
3. **Data Processing**: Results are processed and formatted
4. **Response Generation**: Final responses with charts, tables, news, or company profiles

**Key files:**
- `agent/agent.py`: Core LangGraph workflow definition and state management
- `agent/tools.py`: 12 specialized financial analysis tools
- `agent/src/`: Data fetching, preprocessing, and analysis modules

### API Layer Architecture

The backend provides multiple interaction patterns:

- **`/chat`**: Synchronous chat with full agent capabilities
- **`/chat/stream`**: Server-Sent Events with agent workflow streaming
- **`/chat/stream/direct`**: Direct LLM streaming (bypasses tools for speed)
- **`/chat/stream/tools`**: Hybrid approach with tools + token streaming

**Response structure includes:**
- Text response
- Plotly chart data (JSON)
- DataFrame data (JSON)
- News articles
- Company profiles
- Explanatory text

### Frontend Architecture

Modern React/Next.js 15 application with:

- **App Router**: Server and client components
- **Multilingual Support**: Complete French/English translations
- **Interactive Components**: 3D backgrounds (Vanta.js), glassmorphic UI
- **Context Management**: Language and search state
- **Smart Search**: Interactive pills with Google/ChatGPT integration

**Key patterns:**
- Component composition in `components/`
- Centralized translations in `translations/index.js`
- Context providers for global state
- Motion library for animations

## Environment Configuration

### Required Environment Variables

**Backend (.env):**
```env
GROQ_API_KEY=your_groq_api_key_here
LANGSMITH_API_KEY=your_langsmith_api_key_here  
LANGSMITH_PROJECT=stella
```

**Frontend:**
- No environment variables required for basic functionality
- Uses browser language detection and localStorage for preferences

### API Configuration

- **LLM Model**: `moonshotai/kimi-k2-instruct` via Groq
- **Session Management**: Thread-based conversation memory
- **CORS**: Configured for localhost:3000, 3001

## Key Development Patterns

### Agent Tool Development

When adding new financial analysis tools:

1. Implement tool function in `agent/tools.py`
2. Add to `available_tools` list
3. Import and register in `agent/agent.py`
4. Update tool execution logic in `execute_tool_node`

### Streaming Implementation

The project implements three streaming approaches:

1. **LangGraph Streaming**: Natural workflow streaming with tool execution
2. **Direct LLM Streaming**: Bypass agent for immediate token response
3. **Hybrid Streaming**: Combine tool execution with responsive streaming

### Frontend Component Patterns

- **Client Components**: Mark interactive components with `"use client"`
- **Dynamic Imports**: Heavy libraries loaded with `ssr: false`
- **Responsive Design**: Mobile-first with Tailwind breakpoints
- **Animation Consistency**: Standardized hover transitions (0.2s, ease-out)

## Testing and Debugging

### Backend Testing

```bash
# API endpoint testing
./curl_examples.sh

# Agent functionality
python test_api.py
python test_streaming.py
python test_all_tools.py

# Individual tool testing
cd agent
python -c "from tools import _search_ticker_logic; print(_search_ticker_logic('AAPL'))"
```

### Frontend Testing

```bash
# Development with hot reload
npm run dev

# Build verification
npm run build && npm run start

# Lint checking
npm run lint
```

### Common Debugging

- **Agent Issues**: Check LangSmith tracing (if configured)
- **API Limits**: Monitor OpenRouter usage and rate limits
- **CORS Issues**: Verify frontend origin in FastAPI CORS configuration
- **Streaming Problems**: Check SSE headers and browser developer tools

## Integration Points

### Backend-Frontend Communication

The API returns structured responses that the frontend handles:

```javascript
// Frontend consumption pattern
const response = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, session_id })
});

const data = await response.json();

// Handle different response types
if (data.has_chart) {
  // Render Plotly chart with data.chart_data
}
if (data.has_dataframe) {
  // Display table with data.dataframe_data  
}
```

### Session Management

- **Backend**: Thread-based sessions via LangGraph memory
- **Frontend**: Session IDs maintained across interactions
- **Persistence**: Conversation history maintained per session

### Financial Data Pipeline

1. **Data Fetching**: yfinance, news APIs, company profile APIs
2. **Processing**: pandas, scikit-learn for analysis
3. **Visualization**: Plotly charts with custom Stella theme
4. **Delivery**: JSON serialization for frontend consumption

This architecture enables rapid development of financial analysis features while maintaining a responsive, modern user interface.

<citations>
<document>
<document_type>WARP_DOCUMENTATION</document_type>
<document_id>SUMMARY</document_id>
</document>
</citations>
