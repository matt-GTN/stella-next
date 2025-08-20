# Stella API

A simple FastAPI wrapper for the Stella Financial Assistant agent.

## 🚀 Quick Start

1. **Setup environment:**
   ```bash
   ./start_api.sh
   ```
   This will create a virtual environment, install dependencies, and start the server.

2. **Configure API keys:**
   Edit the `.env` file with your API keys:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   LANGSMITH_API_KEY=your_langsmith_api_key_here
   LANGSMITH_PROJECT=stella
   ```

3. **Start the API:**
   ```bash
   python api.py
   ```
   The API will be available at `http://localhost:8000`

## 📖 API Endpoints

### Health Check
```
GET /health
```
Simple health check to verify the API is running.

### Chat with Stella
```
POST /chat
```

**Request:**
```json
{
  "message": "Analyse l'action AAPL",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "response": "Stella's response text",
  "session_id": "session_12345",
  "has_chart": true,
  "chart_data": "plotly_json_data",
  "has_dataframe": false,
  "dataframe_data": null,
  "has_news": false,
  "news_data": null,
  "has_profile": false,
  "profile_data": null,
  "explanation_text": "Additional explanation if available",
  "timestamp": "2025-01-20T14:30:00"
}
```

### Documentation
- **Interactive docs:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## 🧪 Testing

Run the test script:
```bash
python test_api.py
```

## 💡 Features

- ✅ Simple REST API wrapper around your existing Stella agent
- ✅ Session management for conversation continuity
- ✅ Error handling with proper HTTP status codes
- ✅ CORS support for frontend integration
- ✅ Automatic API documentation
- ✅ Support for all Stella features:
  - Financial analysis
  - Charts (Plotly JSON)
  - Data tables
  - News articles
  - Company profiles
  - Explanations

## 🔧 Integration with Frontend

The API is designed to work seamlessly with your Next.js frontend. Example usage:

```javascript
// Chat with Stella
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Analyse Apple',
    session_id: sessionId
  })
});

const data = await response.json();

// Handle different response types
if (data.has_chart) {
  // Render Plotly chart with data.chart_data
}
if (data.has_dataframe) {
  // Display table with data.dataframe_data
}
if (data.has_news) {
  // Show news with data.news_data
}
```

## 🏗️ Architecture

```
api.py                 # Main FastAPI application
├── POST /chat         # Chat endpoint 
├── GET /health        # Health check
└── Error handlers     # API limit & general errors

agent/                 # Your existing Stella agent
├── agent.py          # LangGraph agent
├── tools.py          # Agent tools
└── src/              # Source modules
```

## 🔒 Error Handling

The API handles various error scenarios:

- **429 Too Many Requests:** API limits exceeded
- **500 Internal Server Error:** Agent processing failures
- **422 Validation Error:** Invalid request format

All errors return structured JSON responses with error details and timestamps.

## 📝 Notes

- Session IDs are automatically generated if not provided
- The API runs the existing synchronous agent in a thread pool
- All existing Stella features are preserved
- CORS is configured for localhost development
- Logging is set up for monitoring and debugging
