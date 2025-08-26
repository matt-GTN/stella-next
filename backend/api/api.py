#!/usr/bin/env python3
"""
API FastAPI simple pour l'Assistant Financier Stella
Expose simplement l'agent LangGraph existant avec gestion d'erreurs de base
"""

import os
import sys
import uuid
import json
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Ajouter le répertoire agent au chemin Python
agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
sys.path.insert(0, agent_dir)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn
from src.fetch_data import APILimitError


# Changer vers le répertoire contenant l'agent et importer
original_dir = os.getcwd()
agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
os.chdir(agent_dir)

# Importer l'agent existant depuis le répertoire agent actuel
import agent as agent_module
from langchain_core.messages import HumanMessage
from agent import generate_trace_animation_frames, get_langsmith_trace_data
import base64

# Obtenir l'application depuis le module agent
stella_agent = agent_module.app

# Revenir au répertoire original
os.chdir(original_dir)

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Application FastAPI
app = FastAPI(
    title="Stella API",
    description="API simple pour l'Assistant Financier Stella",
    version="1.0.0"
)

# CORS pour le frontend
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

# Modèles de requête/réponse
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

class LangSmithTraceResponse(BaseModel):
    thread_id: str
    tool_calls: list[dict]
    execution_path: list[str]
    graph_structure: dict
    total_execution_time: float
    status: str
    timestamp: str

# Vérification de santé
@app.get("/health")
async def health_check():
    """Point de terminaison simple de vérification de santé"""
    return {"status": "healthy", "service": "stella-api"}

@app.get("/")
async def root():
    """Point de terminaison racine"""
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

# Point de terminaison de chat en streaming avec SSE
@app.post("/chat/stream")
async def chat_with_stella_stream(request: ChatRequest):
    """
    Chat avec l'assistant financier Stella - réponse en streaming avec SSE
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

# List available LangSmith sessions with detailed debugging
@app.get("/langsmith-sessions")
async def list_langsmith_sessions():
    """
    Liste les sessions LangSmith disponibles
    """
    try:
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            from langsmith import Client
            client = Client()
            
            # Récupérer les dernières exécutions
            project_name = os.environ.get("LANGCHAIN_PROJECT", "stella")
            logger.info(f"Retrieving LangSmith sessions from project: {project_name}")
            
            recent_runs = list(client.list_runs(
                project_name=project_name,
                limit=20
            ))
            
            # Extraire les thread_ids uniques avec plus de détails
            thread_data = []
            for run in recent_runs:
                # Try multiple ways to get thread_id
                thread_id = None
                
                # Method 1: Direct attribute
                if hasattr(run, 'thread_id') and run.thread_id:
                    thread_id = run.thread_id
                # Method 2: Extra field
                elif hasattr(run, 'extra') and run.extra and 'thread_id' in run.extra:
                    thread_id = run.extra['thread_id']
                # Method 3: Session ID as fallback
                elif hasattr(run, 'session_id') and run.session_id:
                    thread_id = run.session_id
                
                if thread_id:
                    thread_data.append({
                        "thread_id": thread_id,
                        "run_id": str(run.id),
                        "name": run.name,
                        "start_time": run.start_time.isoformat() if run.start_time else None,
                        "has_parent": bool(getattr(run, 'parent_run_id', None))
                    })
            
            # Group by thread_id
            threads_by_id = {}
            for data in thread_data:
                tid = data["thread_id"]
                if tid not in threads_by_id:
                    threads_by_id[tid] = []
                threads_by_id[tid].append(data)
            
            thread_ids = list(threads_by_id.keys())
            
            logger.info(f"Found {len(recent_runs)} runs, {len(thread_ids)} unique threads")
            
            return {
                "available_sessions": thread_ids[:10],  # Limiter à 10
                "total_runs": len(recent_runs),
                "project": project_name,
                "detailed_sessions": {tid: runs for tid, runs in list(threads_by_id.items())[:5]},  # Show details for first 5
                "debug_info": {
                    "langchain_tracing_v2": os.environ.get("LANGCHAIN_TRACING_V2", "not_set"),
                    "langsmith_api_key_set": bool(os.environ.get("LANGSMITH_API_KEY")),
                    "langchain_endpoint": os.environ.get("LANGCHAIN_ENDPOINT", "not_set")
                }
            }
            
        finally:
            os.chdir(current_dir)
            
    except Exception as e:
        logger.error(f"Error listing LangSmith sessions: {type(e).__name__}: {str(e)}", exc_info=True)
        return {
            "available_sessions": [],
            "error": str(e),
            "error_type": type(e).__name__,
            "debug_info": {
                "project": os.environ.get("LANGCHAIN_PROJECT", "stella"),
                "langchain_tracing_v2": os.environ.get("LANGCHAIN_TRACING_V2", "not_set"),
                "langsmith_api_key_set": bool(os.environ.get("LANGSMITH_API_KEY")),
                "langchain_endpoint": os.environ.get("LANGCHAIN_ENDPOINT", "not_set")
            }
        }

# Search for sessions by partial ID or pattern
@app.get("/langsmith-sessions/search/{partial_id}")
async def search_langsmith_sessions(partial_id: str):
    """
    Search for LangSmith sessions by partial ID match
    """
    try:
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            from langsmith import Client
            client = Client()
            project_name = os.environ.get("LANGCHAIN_PROJECT", "stella")
            
            logger.info(f"Searching LangSmith sessions for: {partial_id}")
            
            # Get more recent runs for better search
            recent_runs = list(client.list_runs(
                project_name=project_name,
                limit=50
            ))
            
            # Find matching thread IDs
            matching_sessions = []
            all_thread_ids = set(run.thread_id for run in recent_runs if run.thread_id)
            
            for thread_id in all_thread_ids:
                if partial_id.lower() in thread_id.lower():
                    # Get runs for this thread
                    thread_runs = [run for run in recent_runs if run.thread_id == thread_id]
                    matching_sessions.append({
                        "thread_id": thread_id,
                        "run_count": len(thread_runs),
                        "latest_run": max(thread_runs, key=lambda r: r.start_time or r.end_time or 0).start_time.isoformat() if thread_runs else None,
                        "match_type": "exact" if partial_id == thread_id else "partial"
                    })
            
            logger.info(f"Found {len(matching_sessions)} matching sessions")
            
            return {
                "search_term": partial_id,
                "matching_sessions": matching_sessions,
                "total_searched": len(all_thread_ids),
                "project": project_name
            }
            
        finally:
            os.chdir(current_dir)
            
    except Exception as e:
        logger.error(f"Error searching LangSmith sessions: {str(e)}")
        return {
            "search_term": partial_id,
            "matching_sessions": [],
            "error": str(e)
        }

# Test endpoint with mock LangSmith data
@app.get("/langsmith-trace/test-mock")
async def get_mock_langsmith_trace():
    """
    Endpoint de test avec des données LangSmith simulées
    """
    return {
        "thread_id": "test-mock",
        "tool_calls": [
            {
                "name": "search_ticker",
                "arguments": {"symbol": "AAPL"},
                "status": "completed",
                "execution_time": 1250,
                "timestamp": "2024-01-01T12:00:00Z",
                "run_id": "run_123",
                "result": {"ticker": "AAPL"},
                "error": None
            },
            {
                "name": "fetch_data",
                "arguments": {"ticker": "AAPL"},
                "status": "completed", 
                "execution_time": 2100,
                "timestamp": "2024-01-01T12:00:01Z",
                "run_id": "run_124",
                "result": {"data": "..."},
                "error": None
            }
        ],
        "execution_path": ["agent", "execute_tool", "execute_tool", "generate_final_response"],
        "graph_structure": {"nodes": [], "edges": []},
        "total_execution_time": 3350,
        "status": "completed",
        "timestamp": datetime.now().isoformat()
    }

# LangSmith trace data endpoint
@app.get("/langsmith-trace/{session_id}", response_model=LangSmithTraceResponse)
async def get_langsmith_trace(session_id: str):
    """
    Get LangSmith trace data for graph visualization
    """
    try:
        logger.info(f"Retrieving LangSmith trace for session: {session_id}")
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Get the trace data using the new function with timeout
            import asyncio
            
            async def get_trace_with_timeout():
                loop = asyncio.get_event_loop()
                return await loop.run_in_executor(None, get_langsmith_trace_data, session_id)
            
            # Timeout après 15 secondes
            trace_data = await asyncio.wait_for(get_trace_with_timeout(), timeout=15.0)
            
            if not trace_data:
                logger.warning(f"No trace data found for session {session_id}")
                
                raise HTTPException(
                    status_code=404,
                    detail=f"No LangSmith trace data found for session {session_id}. Check the backend logs for detailed debugging information. Make sure you've had a recent conversation with Stella and that LangSmith tracing is properly configured."
                )
            
            logger.info(f"Trace data retrieved for session {session_id}: {len(trace_data['tool_calls'])} tool calls, status: {trace_data['status']}")
            
            response = LangSmithTraceResponse(
                thread_id=trace_data['thread_id'],
                tool_calls=trace_data['tool_calls'],
                execution_path=trace_data['execution_path'],
                graph_structure=trace_data['graph_structure'],
                total_execution_time=trace_data['total_execution_time'],
                status=trace_data['status'],
                timestamp=datetime.now().isoformat()
            )
            
            return response
            
        except asyncio.TimeoutError:
            logger.error(f"Timeout retrieving LangSmith trace for session {session_id}")
            
            raise HTTPException(
                status_code=408,
                detail=f"Timeout while fetching LangSmith trace data for session {session_id}. The LangSmith API took too long to respond. Check your network connection and try again."
            )
        except Exception as inner_error:
            logger.error(f"Error during trace retrieval: {type(inner_error).__name__}: {inner_error}", exc_info=True)
            raise inner_error
        finally:
            # Always change back to original directory
            os.chdir(current_dir)
            
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper error messages)
        raise
    except Exception as e:
        logger.error(f"Error fetching LangSmith trace for session {session_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        
        # Provide a detailed error message to the frontend
        error_detail = f"Failed to fetch LangSmith trace data: {type(e).__name__}: {str(e)}. Check the backend logs for detailed debugging information."
        
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )

# Animation frames endpoint (deprecated but maintained for compatibility)
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

# Modeling endpoints for advanced modeling page
class ModelingRequest(BaseModel):
    hyperparameters: Dict[str, Any]
    action: str = "train"

class ConfidenceAnalysisRequest(BaseModel):
    model_results: Dict[str, Any]
    threshold: float

class ShapAnalysisRequest(BaseModel):
    model_results: Dict[str, Any]
    error_indices: List[int]

@app.post("/modeling/train")
async def train_model(request: ModelingRequest):
    """
    Train RandomForestClassifier with specified hyperparameters
    """
    try:
        logger.info(f"Training model with hyperparameters: {request.hyperparameters}")
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Import modeling utilities
            from src.modeling_utils import train_random_forest_model
            
            # Train the model
            result = train_random_forest_model(request.hyperparameters)
            
            if 'error' in result:
                raise HTTPException(
                    status_code=500,
                    detail=f"Model training failed: {result['error']}"
                )
            
            logger.info("Model training completed successfully")
            return result
            
        finally:
            os.chdir(current_dir)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in model training endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/modeling/confidence-analysis")
async def analyze_confidence(request: ConfidenceAnalysisRequest):
    """
    Analyze model predictions with confidence threshold filtering
    """
    try:
        logger.info(f"Analyzing confidence with threshold: {request.threshold}")
        
        # Validate threshold
        if not 0.5 <= request.threshold <= 1.0:
            raise HTTPException(
                status_code=400,
                detail="Confidence threshold must be between 0.5 and 1.0"
            )
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Import modeling utilities
            from src.modeling_utils import analyze_confidence_threshold
            
            # Perform confidence analysis
            result = analyze_confidence_threshold(request.model_results, request.threshold)
            
            if 'error' in result:
                raise HTTPException(
                    status_code=500,
                    detail=f"Confidence analysis failed: {result['error']}"
                )
            
            logger.info(f"Confidence analysis completed. High-confidence predictions: {result['high_confidence_count']}")
            return result
            
        finally:
            os.chdir(current_dir)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in confidence analysis endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/modeling/shap-analysis")
async def analyze_shap(request: Dict[str, Any]):
    """
    Perform SHAP analysis on model predictions for explainability
    """
    try:
        # Extract data from request
        model_results = request.get('model_results')
        error_indices = request.get('error_indices', [])
        
        if not model_results:
            raise HTTPException(status_code=400, detail="Model results required for SHAP analysis")
        
        if not error_indices:
            raise HTTPException(status_code=400, detail="Error indices required for SHAP analysis")
        
        logger.info(f"Performing SHAP analysis for {len(error_indices)} error cases")
        
        # Validate error indices
        if len(error_indices) > 20:
            raise HTTPException(
                status_code=400,
                detail="Maximum 20 error cases allowed for SHAP analysis"
            )
        
        # Generate session ID for caching
        session_id = f"shap_{uuid.uuid4().hex[:8]}"
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Import modeling utilities
            from src.modeling_utils import perform_shap_analysis
            
            # Perform SHAP analysis with session-based caching
            result = perform_shap_analysis(model_results, error_indices, session_id)
            
            if 'error' in result:
                raise HTTPException(
                    status_code=500,
                    detail=f"SHAP analysis failed: {result['error']}"
                )
            
            logger.info(f"SHAP analysis completed for {len(result['error_cases'])} cases")
            return result
            
        finally:
            os.chdir(current_dir)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in SHAP analysis endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/modeling/clear-cache")
async def clear_model_cache():
    """
    Clear all cached models to force retraining with updated logic
    """
    try:
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Import modeling utilities
            from src.modeling_utils import clear_model_cache
            
            # Clear the cache
            clear_model_cache()
            
            return {
                "success": True,
                "message": "Model cache cleared successfully. Next training will use updated logic.",
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            os.chdir(current_dir)
            
    except Exception as e:
        logger.error(f"Error clearing model cache: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )

@app.get("/modeling/cache-stats")
async def get_cache_statistics():
    """
    Get cache statistics for monitoring and debugging
    """
    try:
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Import modeling utilities
            from src.modeling_utils import get_cache_statistics
            
            # Get cache statistics
            stats = get_cache_statistics()
            
            if 'error' in stats:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to get cache statistics: {stats['error']}"
                )
            
            return stats
            
        finally:
            os.chdir(current_dir)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in cache statistics endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/modeling/clear-cache")
async def clear_modeling_cache(cache_type: str = "all"):
    """
    Clear modeling cache entries
    """
    try:
        valid_types = ['all', 'models', 'datasets', 'test_data', 'shap']
        if cache_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid cache_type. Must be one of: {valid_types}"
            )
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            # Import modeling utilities
            from src.modeling_utils import clear_cache
            
            # Clear cache
            result = clear_cache(cache_type)
            
            if 'error' in result:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to clear cache: {result['error']}"
                )
            
            logger.info(f"Cache cleared: {result}")
            return result
            
        finally:
            os.chdir(current_dir)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in clear cache endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
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
                logger.debug(f"Processing node: {node_name}")
                
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
                        
                        # IMPORTANT: Capture tool calls from agent node decisions
                        if node_name == "agent" and hasattr(message, 'tool_calls') and message.tool_calls:
                            logger.debug(f"Agent calling {len(message.tool_calls)} tools")
                            
                            # Store pending tool calls
                            pending_tool_calls = message.tool_calls.copy()
                            
                            # Stream the reasoning content first if present
                            if hasattr(message, 'content') and message.content:
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
                        
                        # Stream AI messages with content (including initial reasoning)
                        elif hasattr(message, 'content') and message.content and type(message).__name__ == 'AIMessage':
                            # Check if this message has tool calls (initial reasoning message) - fallback for non-agent nodes
                            if hasattr(message, 'tool_calls') and message.tool_calls and node_name != "agent":
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
                            
                            # Handle final AI messages without tool calls
                            elif not hasattr(message, 'tool_calls') or not message.tool_calls:
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
            # Get the final state to extract the final message for attachments only
            final_state = None
            async for event in stella_agent.astream(inputs, config=config, stream_mode="values"):
                final_state = event
            
            if final_state and "messages" in final_state and final_state["messages"]:
                # Get the last AI message for attachments only (don't re-stream content)
                for msg in reversed(final_state["messages"]):
                    if hasattr(msg, 'content') and msg.content and type(msg).__name__ == 'AIMessage':
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
                logger.debug("Chart data attached to response")
                
            if hasattr(final_message, 'dataframe_json') and final_message.dataframe_json:
                final_data['has_dataframe'] = True
                final_data['dataframe_data'] = final_message.dataframe_json
                logger.debug("DataFrame attached to response")
                
            if hasattr(final_message, 'news_json') and final_message.news_json:
                final_data['has_news'] = True
                final_data['news_data'] = final_message.news_json
                logger.debug("News data attached to response")
                
            if hasattr(final_message, 'profile_json') and final_message.profile_json:
                final_data['has_profile'] = True
                final_data['profile_data'] = final_message.profile_json
                logger.debug("Company profile attached to response")
                
            if hasattr(final_message, 'explanation_text') and final_message.explanation_text:
                final_data['explanation_text'] = final_message.explanation_text
                logger.debug("Explanation text attached to response")
            
            yield final_data
        else:
            logger.warning("No final message found in agent stream")
            yield {
                'type': 'error',
                'content': 'Aucune réponse générée par l\'agent'
            }
            
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

# Modeling endpoints for machine learning functionality
class ModelingRequest(BaseModel):
    hyperparameters: Dict[str, Any]
    action: str = "train"

class ModelingResponse(BaseModel):
    success: bool
    accuracy: Optional[float] = None
    classification_report: Optional[Dict[str, Any]] = None
    confusion_matrix: Optional[list] = None
    feature_importances: Optional[list] = None
    predictions: Optional[list] = None
    probabilities: Optional[list] = None
    test_indices: Optional[list] = None
    error: Optional[str] = None
    timestamp: str



@app.post("/modeling/confidence_analysis")
async def analyze_confidence(request: Dict[str, Any]):
    """
    Analyze model predictions with confidence threshold filtering
    """
    try:
        threshold = request.get('threshold', 0.7)
        model_results = request.get('model_results')
        
        if not model_results:
            raise HTTPException(status_code=400, detail="Model results required for confidence analysis")
        
        logger.info(f"Analyzing confidence with threshold: {threshold}")
        
        # Change to agent directory for execution
        current_dir = os.getcwd()
        agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'agent')
        os.chdir(agent_dir)
        
        try:
            from src.modeling_utils import analyze_confidence_threshold
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                analyze_confidence_threshold,
                model_results,
                threshold
            )
            
            return result
            
        finally:
            os.chdir(current_dir)
            
    except Exception as e:
        logger.error(f"Error in confidence analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Confidence analysis failed: {str(e)}")

# Removed duplicate SHAP analysis endpoint - using the new one with proper request models

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
