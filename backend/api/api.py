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
agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
sys.path.insert(0, agent_dir)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn
from src.fetch_data import APILimitError


# Change to the directory containing the agent and import
original_dir = os.getcwd()
agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
os.chdir(agent_dir)

# Import your existing agent from the current agent directory
import agent as agent_module
from langchain_core.messages import HumanMessage
from agent import generate_trace_animation_frames
import base64

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

class AnimationFrame(BaseModel):
    description: str
    image_base64: str

class AnimationFramesResponse(BaseModel):
    frames: list[AnimationFrame]
    session_id: str
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

# Animation frames endpoint
@app.get("/animation-frames/{session_id}", response_model=AnimationFramesResponse)
async def get_animation_frames(session_id: str):
    """
    Get animation frames for a specific session ID
    """
    try:
        logger.info(f"Generating animation frames for session {session_id}")
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Generate the frames using the existing function
            frames_data = generate_trace_animation_frames(session_id)
            
            if not frames_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"No animation frames found for session {session_id}. Make sure you've had a recent conversation with Stella."
                )
            
            # Convert frames to the response format
            animation_frames = []
            for description, png_bytes in frames_data:
                # Convert PNG bytes to base64 for JSON transport
                image_base64 = base64.b64encode(png_bytes).decode('utf-8')
                animation_frames.append(AnimationFrame(
                    description=description,
                    image_base64=f"data:image/png;base64,{image_base64}"
                ))
            
            response = AnimationFramesResponse(
                frames=animation_frames,
                session_id=session_id,
                timestamp=datetime.now().isoformat()
            )
            
            logger.info(f"Successfully generated {len(animation_frames)} animation frames for session {session_id}")
            return response
            
        finally:
            # Always change back to original directory
            os.chdir(current_dir)
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error generating animation frames for session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate animation frames: {str(e)}"
        )

# Legacy endpoints removed - only /chat/stream is needed now with full agent support

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
    Run the TRUE Stella agent with its native workflow and stream the responses
    """
    # Change to agent directory for execution
    current_dir = os.getcwd()
    agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
    os.chdir(agent_dir)
    
    try:
        final_message = None
        current_step = ""
        
        # Track variables to store the correct final message with attachments
        chart_message = None
        dataframe_message = None
        news_message = None
        profile_message = None
        
        # Track pending tool calls from agent decisions
        pending_tool_calls = []
        
        # Track the agent workflow in real time
        async for event in stella_agent.astream(inputs, config=config, stream_mode="updates"):
            for node_name, node_output in event.items():
                print(f"[STREAMING] Node: {node_name}, Output keys: {list(node_output.keys()) if isinstance(node_output, dict) else 'not a dict'}")
                
                # Provide status updates for different workflow steps
                if node_name == "agent" and current_step != "agent":
                    current_step = "agent"
                    yield {
                        'type': 'status',
                        'step': 'analyzing'
                    }
                    
                elif node_name == "execute_tool" and current_step != "execute_tool":
                    current_step = "execute_tool" 
                    yield {
                        'type': 'status', 
                        'step': 'processing'
                    }
                    
                elif node_name in ["generate_final_response", "prepare_chart_display", "prepare_data_display", "prepare_news_display", "prepare_profile_display"] and current_step != "final_processing":
                    current_step = "final_processing"
                    yield {
                        'type': 'status',
                        'step': 'finalizing'
                    }
                
                # Check if this node has messages with AI response
                if "messages" in node_output and node_output["messages"]:
                    for message in node_output["messages"]:
                        print(f"[STREAMING] Message type: {type(message).__name__}, has content: {hasattr(message, 'content') and bool(message.content)}, has tool_calls: {hasattr(message, 'tool_calls') and bool(message.tool_calls)}")
                        
                        # IMPORTANT: Capture tool calls from agent node decisions
                        if node_name == "agent" and hasattr(message, 'tool_calls') and message.tool_calls:
                            print(f"[STREAMING] Agent decided to call {len(message.tool_calls)} tool(s)")
                            
                            # Store pending tool calls
                            pending_tool_calls = message.tool_calls.copy()
                            
                            # Stream the reasoning content first if present
                            if hasattr(message, 'content') and message.content:
                                print(f"[STREAMING] Streaming agent reasoning: {message.content[:100]}...")
                                content = message.content
                                words = content.split(' ')
                                
                                for i, word in enumerate(words):
                                    yield {
                                        'type': 'initial_content',
                                        'chunk': " " + word if i > 0 else word
                                    }
                                    await asyncio.sleep(0.03)
                            
                            # Then immediately stream the tool call information
                            for tool_call in pending_tool_calls:
                                tool_name = tool_call.get('name', 'unknown_tool')
                                tool_args = tool_call.get('args', {})
                                yield {
                                    'type': 'tool_call',
                                    'tool_name': tool_name,
                                    'args': tool_args
                                }
                                print(f"[STREAMING] Streamed tool call: {tool_name} with args: {tool_args}")
                        
                        # Stream AI messages with content (including initial reasoning)
                        elif hasattr(message, 'content') and message.content and type(message).__name__ == 'AIMessage':
                            # Check if this message has tool calls (initial reasoning message) - fallback for non-agent nodes
                            if hasattr(message, 'tool_calls') and message.tool_calls and node_name != "agent":
                                print(f"[STREAMING] Found AI message with tool calls from {node_name}: {message.content[:100]}...")
                                
                                # First, stream the reasoning content as INITIAL content
                                content = message.content
                                words = content.split(' ')
                                
                                for i, word in enumerate(words):
                                    yield {
                                        'type': 'initial_content',
                                        'chunk': " " + word if i > 0 else word
                                    }
                                    await asyncio.sleep(0.03)
                                
                                # Then, stream the tool calls
                                for tool_call in message.tool_calls:
                                    tool_name = tool_call.get('name', 'unknown_tool')
                                    yield {
                                        'type': 'tool_call',
                                        'tool_name': tool_name,
                                        'args': tool_call.get('args', {})
                                    }
                                    print(f"[STREAMING] Tool call: {tool_name}")
                            
                            # Handle final AI messages without tool calls
                            elif not hasattr(message, 'tool_calls') or not message.tool_calls:
                                print(f"[STREAMING] Found final AI response: {message.content[:100]}...")
                                
                                # Don't stream again if this is the same final message
                                if not final_message or final_message.content != message.content:
                                    content = message.content
                                    words = content.split(' ')
                                    
                                    for i, word in enumerate(words):
                                        yield {
                                            'type': 'final_content',
                                            'chunk': " " + word if i > 0 else word
                                        }
                                        await asyncio.sleep(0.03)
                                    
                                    final_message = message
                        
                        # Also check for messages that might be final responses without tool_calls attribute
                        elif (hasattr(message, 'content') and message.content and 
                              not hasattr(message, 'tool_calls') and 
                              node_name in ["generate_final_response", "prepare_chart_display", "prepare_data_display", "prepare_news_display", "prepare_profile_display"]):
                            print(f"[STREAMING] Found final response from {node_name}: {message.content[:100]}...")
                            
                            # Stream this response if it's different from what we already streamed
                            if not final_message or final_message.content != message.content:
                                content = message.content
                                words = content.split(' ')
                                
                                for i, word in enumerate(words):
                                    yield {
                                        'type': 'content',
                                        'chunk': " " + word if i > 0 else word
                                    }
                                    await asyncio.sleep(0.03)
                                
                                final_message = message
        
        # If we didn't get a streamed final message, get the final state (without re-streaming content)
        if not final_message:
            print("[STREAMING] No streamed final message found, getting final state...")
            # Get the final state to extract the final message for attachments only
            final_state = None
            async for event in stella_agent.astream(inputs, config=config, stream_mode="values"):
                final_state = event
            
            if final_state and "messages" in final_state and final_state["messages"]:
                # Get the last AI message for attachments only (don't re-stream content)
                for msg in reversed(final_state["messages"]):
                    if hasattr(msg, 'content') and msg.content and type(msg).__name__ == 'AIMessage':
                        print(f"[STREAMING] Found final message in state for attachments: {msg.content[:100]}...")
                        final_message = msg
                        # Don't re-stream the content since it was already processed
                        break
        
        # Send final data with all attachments if available (no content to avoid duplication)
        if final_message:
            final_data = {
                'type': 'final_message',
                # Don't include content here as it was already streamed above
                'has_chart': False,
                'has_dataframe': False,
                'has_news': False,
                'has_profile': False,
            }
            
            # Check and add all attachments from the agent's result
            if hasattr(final_message, 'plotly_json') and final_message.plotly_json:
                final_data['has_chart'] = True
                final_data['chart_data'] = final_message.plotly_json
                print("📊 [API] Graphique Plotly détecté et ajouté à la réponse")
                
            if hasattr(final_message, 'dataframe_json') and final_message.dataframe_json:
                final_data['has_dataframe'] = True
                final_data['dataframe_data'] = final_message.dataframe_json
                print("📋 [API] DataFrame détecté et ajouté à la réponse")
                
            if hasattr(final_message, 'news_json') and final_message.news_json:
                final_data['has_news'] = True
                final_data['news_data'] = final_message.news_json
                print("📰 [API] Actualités détectées et ajoutées à la réponse")
                
            if hasattr(final_message, 'profile_json') and final_message.profile_json:
                final_data['has_profile'] = True
                final_data['profile_data'] = final_message.profile_json
                print("🏢 [API] Profil d'entreprise détecté et ajouté à la réponse")
                
            if hasattr(final_message, 'explanation_text') and final_message.explanation_text:
                final_data['explanation_text'] = final_message.explanation_text
                print("📝 [API] Texte explicatif détecté et ajouté à la réponse")
            
            yield final_data
        else:
            print("[STREAMING] Warning: No final message found to stream")
            yield {
                'type': 'error',
                'content': 'Aucune réponse générée par l\'agent'
            }
        
        print("📋 [API] Exécution native de l'agent Stella avec streaming terminée")
            
    finally:
        # Always change back to original directory
        os.chdir(current_dir)

def _run_stella_agent(inputs: Dict[str, Any], config: Dict[str, Any]):
    """
    Helper function to run the Stella agent synchronously
    """
    # Change to agent directory for execution
    current_dir = os.getcwd()
    agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
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
