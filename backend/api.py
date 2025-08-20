#!/usr/bin/env python3
"""
Simple FastAPI API for Stella Financial Assistant
Just exposes the existing LangGraph agent with basic error handling
"""

import os
import sys
import uuid
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Add agent directory to Python path
agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent')
sys.path.insert(0, agent_dir)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn
from src.fetch_data import APILimitError

# Import direct streaming capability
from direct_streaming import stream_direct_llm_response
from streaming_agent import stream_agent_with_tools


# Change to the directory containing the agent and import
original_dir = os.getcwd()
agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent')
os.chdir(agent_dir)

# Import your existing agent from the current agent directory
import agent as agent_module
from langchain_core.messages import HumanMessage

# Get the app from the agent module
stella_agent = agent_module.app

# Change back to original directory
os.chdir(original_dir)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Stella API",
    description="Simple API for Stella Financial Assistant",
    version="1.0.0"
)

# CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    has_chart: bool = False
    chart_data: Optional[str] = None
    has_dataframe: bool = False
    dataframe_data: Optional[str] = None
    has_news: bool = False
    news_data: Optional[str] = None
    has_profile: bool = False
    profile_data: Optional[str] = None
    explanation_text: Optional[str] = None
    timestamp: str

class ErrorResponse(BaseModel):
    error: str
    error_type: str
    timestamp: str

# Health check
@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "stella-api"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Stella Financial Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat",
            "chat_stream": "/chat/stream",
            "chat_stream_direct": "/chat/stream/direct",
            "chat_stream_tools": "/chat/stream/tools",
            "health": "/health",
            "docs": "/docs"
        }
    }

# Streaming chat endpoint with SSE
@app.post("/chat/stream")
async def chat_with_stella_stream(request: ChatRequest):
    """
    Chat with Stella financial assistant - streaming response with SSE
    """
    async def generate_sse_stream():
        try:
            # Generate session ID if not provided
            session_id = request.session_id or f"session_{uuid.uuid4()}"
            
            logger.info(f"Processing streaming message for session {session_id}: {request.message[:100]}...")
            
            # Send session ID first
            yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id})}\n\n"
            
            # Prepare the message for the agent
            config = {"configurable": {"thread_id": session_id}}
            inputs = {"messages": [HumanMessage(content=request.message)]}
            
            # Run the agent with streaming
            try:
                loop = asyncio.get_event_loop()
                async for chunk in _run_stella_agent_stream(inputs, config, loop):
                    if chunk:
                        yield f"data: {json.dumps(chunk)}\n\n"
                        
            except APILimitError as e:
                logger.warning(f"API limit reached for session {session_id}: {str(e)}")
                error_data = {
                    'type': 'error',
                    'error': f"Limite d'API atteinte: {str(e)}. Réessayez plus tard.",
                    'error_code': 429
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                return
                
            except Exception as e:
                logger.error(f"Agent error for session {session_id}: {str(e)}", exc_info=True)
                error_data = {
                    'type': 'error',
                    'error': f"Erreur de traitement de l'agent: {str(e)}",
                    'error_code': 500
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}", exc_info=True)
            error_data = {
                'type': 'error',
                'error': f"Internal server error: {str(e)}",
                'error_code': 500
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Direct LLM streaming endpoint for true token-by-token streaming
@app.post("/chat/stream/direct")
async def chat_with_stella_stream_direct(request: ChatRequest):
    """
    Chat directly with Stella LLM - true token-by-token streaming
    Note: This bypasses tools and agent workflow but provides real streaming
    """
    async def generate_direct_sse_stream():
        try:
            # Generate session ID if not provided
            session_id = request.session_id or f"session_{uuid.uuid4()}"
            
            logger.info(f"Processing direct streaming message for session {session_id}: {request.message[:100]}...")
            
            # Send session ID first
            yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id})}\n\n"
            
            # Stream directly from LLM
            try:
                async for token in stream_direct_llm_response(request.message):
                    if token:
                        chunk_data = {
                            'type': 'content_delta',
                            'content': token
                        }
                        yield f"data: {json.dumps(chunk_data)}\n\n"
                        
            except Exception as e:
                logger.error(f"Direct streaming error for session {session_id}: {str(e)}", exc_info=True)
                error_data = {
                    'type': 'error',
                    'error': f"Erreur de streaming direct: {str(e)}",
                    'error_code': 500
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Direct streaming error: {str(e)}", exc_info=True)
            error_data = {
                'type': 'error',
                'error': f"Internal server error: {str(e)}",
                'error_code': 500
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_direct_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Hybrid streaming endpoint: token-by-token streaming WITH tools
@app.post("/chat/stream/tools")
async def chat_with_stella_stream_tools(request: ChatRequest):
    """
    Chat with Stella agent with full tools - hybrid streaming approach
    Combines token-by-token streaming with complete agent workflow
    """
    async def generate_hybrid_sse_stream():
        try:
            # Generate session ID if not provided
            session_id = request.session_id or f"session_{uuid.uuid4()}"
            
            logger.info(f"Processing hybrid streaming message for session {session_id}: {request.message[:100]}...")
            
            # Send session ID first
            yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id})}\n\n"
            
            # Stream using our hybrid agent
            try:
                async for chunk in stream_agent_with_tools(request.message, session_id):
                    if chunk:
                        yield f"data: {json.dumps(chunk)}\n\n"
                        
            except APILimitError as e:
                logger.warning(f"API limit reached for session {session_id}: {str(e)}")
                error_data = {
                    'type': 'error',
                    'error': f"Limite d'API atteinte: {str(e)}. Réessayez plus tard.",
                    'error_code': 429
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                return
                
            except Exception as e:
                logger.error(f"Hybrid streaming error for session {session_id}: {str(e)}", exc_info=True)
                error_data = {
                    'type': 'error',
                    'error': f"Erreur de streaming hybride: {str(e)}",
                    'error_code': 500
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Hybrid streaming error: {str(e)}", exc_info=True)
            error_data = {
                'type': 'error',
                'error': f"Internal server error: {str(e)}",
                'error_code': 500
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_hybrid_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Main chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_with_stella(request: ChatRequest):
    """
    Chat with Stella financial assistant
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or f"session_{uuid.uuid4()}"
        
        logger.info(f"Processing message for session {session_id}: {request.message[:100]}...")
        
        # Prepare the message for the agent
        config = {"configurable": {"thread_id": session_id}}
        inputs = {"messages": [HumanMessage(content=request.message)]}
        
        # Run the agent (convert to async)
        final_message = None
        try:
            # Since your agent is synchronous, we'll run it in a thread
            loop = asyncio.get_event_loop()
            final_message = await loop.run_in_executor(
                None, 
                _run_stella_agent, 
                inputs, 
                config
            )
        except APILimitError as e:
            logger.warning(f"API limit reached for session {session_id}: {str(e)}")
            raise HTTPException(
                status_code=429, 
                detail=f"Limite d'API atteinte: {str(e)}. Réessayez plus tard."
            )
        except Exception as e:
            logger.error(f"Agent error for session {session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Erreur de traitement de l'agent: {str(e)}"
            )
        
        if not final_message:
            raise HTTPException(
                status_code=500,
                detail="No response from Stella agent"
            )
        
        # Extract response data
        response_text = final_message.content
        
        # Check for additional data attachments
        chart_data = None
        dataframe_data = None
        news_data = None
        profile_data = None
        explanation_text = None
        
        # Extract chart data if present
        if hasattr(final_message, 'plotly_json'):
            chart_data = final_message.plotly_json
        
        # Extract dataframe data if present
        if hasattr(final_message, 'dataframe_json'):
            dataframe_data = final_message.dataframe_json
        
        # Extract news data if present
        if hasattr(final_message, 'news_json'):
            news_data = final_message.news_json
            
        # Extract profile data if present
        if hasattr(final_message, 'profile_json'):
            profile_data = final_message.profile_json
            
        # Extract explanation text if present
        if hasattr(final_message, 'explanation_text'):
            explanation_text = final_message.explanation_text
        
        # Build response
        response = ChatResponse(
            response=response_text,
            session_id=session_id,
            has_chart=chart_data is not None,
            chart_data=chart_data,
            has_dataframe=dataframe_data is not None,
            dataframe_data=dataframe_data,
            has_news=news_data is not None,
            news_data=news_data,
            has_profile=profile_data is not None,
            profile_data=profile_data,
            explanation_text=explanation_text,
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Successfully processed message for session {session_id}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

async def _run_stella_agent_stream(inputs: Dict[str, Any], config: Dict[str, Any], loop):
    """
    Helper function to run the Stella agent with real token-by-token streaming for SSE
    """
    # Change to agent directory for execution
    current_dir = os.getcwd()
    agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent')
    os.chdir(agent_dir)
    
    try:
        accumulated_content = ""
        final_message = None
        
        # Use LangGraph's streaming capability with "updates" mode to get token-level chunks
        async for event in stella_agent.astream(inputs, config=config, stream_mode="updates"):
            # Process each update from the agent
            for node_name, node_output in event.items():
                if "messages" in node_output:
                    messages = node_output["messages"]
                    if messages:
                        current_message = messages[-1]
                        
                        # Check if this is an AI message with content
                        if hasattr(current_message, 'content') and current_message.content:
                            new_content = current_message.content
                            
                            # If content is longer than what we've seen, yield the delta
                            if len(new_content) > len(accumulated_content):
                                delta = new_content[len(accumulated_content):]
                                accumulated_content = new_content
                                
                                yield {
                                    'type': 'content_delta',
                                    'content': delta
                                }
                            
                            # Update our reference to the current message
                            final_message = current_message
        
        # Send final data if available
        if final_message:
            final_data = {
                'type': 'final_message',
                'content': final_message.content,
                'has_chart': False,
                'has_dataframe': False,
                'has_news': False,
                'has_profile': False,
            }
            
            # Vérifier et ajouter les données de graphique Plotly
            if hasattr(final_message, 'plotly_json') and final_message.plotly_json:
                final_data['has_chart'] = True
                final_data['chart_data'] = final_message.plotly_json
                print("📊 [API] Graphique Plotly détecté et ajouté à la réponse")
                
            # Vérifier et ajouter les données DataFrame
            if hasattr(final_message, 'dataframe_json') and final_message.dataframe_json:
                final_data['has_dataframe'] = True
                final_data['dataframe_data'] = final_message.dataframe_json
                print("📋 [API] DataFrame détecté et ajouté à la réponse")
                
            # Vérifier et ajouter les actualités
            if hasattr(final_message, 'news_json') and final_message.news_json:
                final_data['has_news'] = True
                final_data['news_data'] = final_message.news_json
                print("📰 [API] Actualités détectées et ajoutées à la réponse")
                
            # Vérifier et ajouter le profil d'entreprise
            if hasattr(final_message, 'profile_json') and final_message.profile_json:
                final_data['has_profile'] = True
                final_data['profile_data'] = final_message.profile_json
                print("🏢 [API] Profil d'entreprise détecté et ajouté à la réponse")
                
            # Vérifier et ajouter le texte explicatif
            if hasattr(final_message, 'explanation_text') and final_message.explanation_text:
                final_data['explanation_text'] = final_message.explanation_text
                print("📝 [API] Texte explicatif détecté et ajouté à la réponse")
            
            yield final_data
            
    finally:
        # Always change back to original directory
        os.chdir(current_dir)

def _run_stella_agent(inputs: Dict[str, Any], config: Dict[str, Any]):
    """
    Helper function to run the Stella agent synchronously
    """
    # Change to agent directory for execution
    current_dir = os.getcwd()
    agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent')
    os.chdir(agent_dir)
    
    try:
        final_message = None
        for event in stella_agent.stream(inputs, config=config, stream_mode="values"):
            final_message = event["messages"][-1]
        return final_message
    finally:
        # Always change back to original directory
        os.chdir(current_dir)

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "error_type": "HTTPException",
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "error_type": "InternalError", 
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
