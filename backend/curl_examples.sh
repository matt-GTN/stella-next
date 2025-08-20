#!/bin/bash

# Stella API - curl examples for testing

echo "🧪 Stella API Test Examples"
echo "=========================="

# Health check
echo "1. Health Check:"
echo "curl http://localhost:8000/health"
curl -s http://localhost:8000/health | jq .
echo ""

# Basic chat
echo "2. Basic Chat:"
echo "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"message\": \"Bonjour Stella!\"}'"
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour Stella!"}' | jq .
echo ""

# Stock analysis
echo "3. Stock Analysis:"
echo "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"message\": \"Analyse Apple\"}'"
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyse Apple"}' | jq .
echo ""

# Question about creators
echo "4. Qui sont les créateurs du projet ?"
echo "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"message\": \"Qui sont les créateurs du projet ?\"}'"
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Qui sont les créateurs du projet ?"}' | jq .
echo ""

# With session ID
echo "5. With Session ID:"
SESSION_ID="test-session-$(date +%s)"
echo "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"message\": \"Que fais-tu?\", \"session_id\": \"$SESSION_ID\"}'"
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Que fais-tu?\", \"session_id\": \"$SESSION_ID\"}" | jq .
echo ""

# Test streaming chat endpoint
echo "6. Streaming Chat (SSE):"
echo "curl -X POST http://localhost:8000/chat/stream -H 'Content-Type: application/json' -H 'Accept: text/event-stream' -d '{\"message\": \"Qui sont les créateurs du projet ?\"}'"
curl -X POST "http://localhost:8000/chat/stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "Qui sont les créateurs du projet ?",
    "session_id": "curl_test_session"
  }' \
  --no-buffer
echo ""

echo "✅ Test examples completed!"
