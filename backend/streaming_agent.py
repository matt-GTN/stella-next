#!/usr/bin/env python3
"""
Streaming variant of the Stella agent that combines token-by-token streaming with tool usage
"""

import os
import sys
import asyncio
import json
from typing import AsyncGenerator, Dict, Any
from datetime import datetime

# Add agent directory to Python path
agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent')
sys.path.insert(0, agent_dir)

# Change to agent directory
current_dir = os.getcwd()
os.chdir(agent_dir)

# Import the existing agent components
from agent import (
    llm, app as stella_agent, system_prompt, available_tools, 
    execute_tool_node, AgentState, cleanup_state_node,
    generate_final_response_node, prepare_chart_display_node,
    prepare_data_display_node, prepare_news_display_node,
    prepare_profile_display_node, handle_error_node
)
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import pandas as pd
from io import StringIO

# Change back
os.chdir(current_dir)

async def stream_agent_with_tools(
    message: str, 
    session_id: str
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream agent response with full tool support, token by token
    """
    
    # Prepare initial state
    config = {"configurable": {"thread_id": session_id}}
    inputs = {"messages": [HumanMessage(content=message)]}
    
    # Initialize agent state
    initial_state = AgentState(
        input=message,
        ticker="",
        tickers=[],
        company_name="",
        fetched_df_json="",
        processed_df_json="",
        analysis="",
        plotly_json="",
        messages=inputs["messages"],
        error=""
    )
    
    try:
        # Run through the agent workflow with streaming
        current_state = initial_state.copy()
        
        while True:
            # Determine next step
            next_step = determine_next_step(current_state)
            
            if next_step == "agent":
                # Stream the agent decision
                async for chunk in stream_agent_node(current_state):
                    yield chunk
                    
                # Update state with agent response
                current_state = await update_state_with_agent_response(current_state)
                
            elif next_step == "execute_tool":
                # Execute tools (non-streaming, but inform user)
                yield {
                    'type': 'tool_execution',
                    'message': 'Exécution des outils...'
                }
                
                # Execute tools synchronously
                tool_updates = execute_tool_node(current_state)
                current_state.update(tool_updates)
                
                yield {
                    'type': 'tool_completed',
                    'message': 'Outils exécutés avec succès.'
                }
                
            elif next_step in ["generate_final_response", "prepare_chart_display", 
                              "prepare_data_display", "prepare_news_display", 
                              "prepare_profile_display"]:
                # Handle final response generation
                if next_step == "generate_final_response":
                    final_updates = generate_final_response_node(current_state)
                elif next_step == "prepare_chart_display":
                    final_updates = prepare_chart_display_node(current_state)
                elif next_step == "prepare_data_display":
                    final_updates = prepare_data_display_node(current_state)
                elif next_step == "prepare_news_display":
                    final_updates = prepare_news_display_node(current_state)
                elif next_step == "prepare_profile_display":
                    final_updates = prepare_profile_display_node(current_state)
                
                current_state.update(final_updates)
                
                # Stream the final response
                final_message = final_updates["messages"][-1]
                yield {
                    'type': 'final_response',
                    'content': final_message.content,
                    'has_chart': hasattr(final_message, 'plotly_json'),
                    'has_dataframe': hasattr(final_message, 'dataframe_json'),
                    'has_news': hasattr(final_message, 'news_json'),
                    'has_profile': hasattr(final_message, 'profile_json'),
                    'chart_data': getattr(final_message, 'plotly_json', None),
                    'dataframe_data': getattr(final_message, 'dataframe_json', None),
                    'news_data': getattr(final_message, 'news_json', None),
                    'profile_data': getattr(final_message, 'profile_json', None),
                    'explanation_text': getattr(final_message, 'explanation_text', None)
                }
                break
                
            elif next_step == "cleanup_state":
                # Clean up and end
                cleanup_state_node(current_state)
                break
                
            elif next_step == "end":
                break
                
            else:
                # Handle error case
                if current_state.get("error"):
                    error_updates = handle_error_node(current_state)
                    current_state.update(error_updates)
                    
                    error_message = error_updates["messages"][-1]
                    yield {
                        'type': 'error',
                        'content': error_message.content
                    }
                break
    
    except Exception as e:
        yield {
            'type': 'error',
            'content': f"Erreur dans l'agent streaming: {str(e)}"
        }

async def stream_agent_node(state: AgentState) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Streaming version of agent_node that yields tokens as they arrive
    """
    
    # Prepare messages like in original agent_node
    current_messages = [SystemMessage(content=system_prompt)]
    
    # Add context injection (same as original)
    data_to_inspect_json = state.get("processed_df_json") or state.get("fetched_df_json")
    
    if data_to_inspect_json:
        try:
            df = pd.read_json(StringIO(data_to_inspect_json), orient='split')
            available_columns = df.columns.tolist()
            
            context_message = SystemMessage(
                content=(
                    f"\n\n--- CONTEXTE ACTUEL DES DONNÉES ---\n"
                    f"Des données sont disponibles.\n"
                    f"Si tu utilises `create_dynamic_chart`, tu DOIS choisir les colonnes EXACTEMENT dans cette liste :\n"
                    f"{available_columns}\n"
                    f"---------------------------------\n"
                )
            )
            current_messages.append(context_message)
        except Exception as e:
            print(f"Avertissement: Impossible d'injecter le contexte des colonnes. Erreur: {e}")

    # Add conversation history
    current_messages.extend(state['messages'])
    
    # Stream the LLM response with tools
    bound_llm = llm.bind_tools(available_tools)
    
    yield {
        'type': 'agent_thinking',
        'message': 'Réflexion en cours...'
    }
    
    # Stream the response
    async for chunk in bound_llm.astream(current_messages):
        if chunk.content:
            yield {
                'type': 'content_delta',
                'content': chunk.content
            }
    
    yield {
        'type': 'agent_decision_complete',
        'message': 'Décision prise.'
    }

async def update_state_with_agent_response(state: AgentState) -> AgentState:
    """
    Update state with the complete agent response (needed for tool calling logic)
    """
    # We need to get the complete response to handle tool calls
    # This is a simplified version - in practice, we'd need to accumulate the streamed response
    
    current_messages = [SystemMessage(content=system_prompt)]
    current_messages.extend(state['messages'])
    
    # Get complete response for tool extraction
    bound_llm = llm.bind_tools(available_tools)
    complete_response = await bound_llm.ainvoke(current_messages)
    
    # Update state
    new_state = state.copy()
    new_state['messages'].append(complete_response)
    
    return new_state

def determine_next_step(state: AgentState) -> str:
    """
    Determine next step based on current state (simplified version of router)
    """
    
    if state.get("error"):
        return "handle_error"
    
    messages = state.get('messages', [])
    if not messages:
        return "agent"
    
    last_message = messages[-1]
    
    # If last message is human, go to agent
    if isinstance(last_message, HumanMessage):
        return "agent"
    
    # If last message is AI with tool calls, execute tools
    if isinstance(last_message, AIMessage) and hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "execute_tool"
    
    # If last message is AI without tool calls, we're done
    if isinstance(last_message, AIMessage) and not hasattr(last_message, 'tool_calls'):
        return "end"
    
    # Check for specific tool completions to determine final step
    # (This would need more sophisticated logic based on the actual router)
    return "end"

# Test function
async def test_streaming_agent():
    """Test the streaming agent with tools"""
    print("🧪 Testing streaming agent with tools...")
    
    session_id = "test_streaming_session"
    message = "Bonjour Stella! Peux-tu m'expliquer ce que tu peux faire?"
    
    print(f"📝 Message: {message}")
    print("=" * 60)
    
    async for chunk in stream_agent_with_tools(message, session_id):
        chunk_type = chunk.get('type')
        
        if chunk_type == 'content_delta':
            print(chunk.get('content', ''), end='', flush=True)
        elif chunk_type in ['agent_thinking', 'tool_execution', 'tool_completed']:
            print(f"\n[{chunk.get('message')}]")
        elif chunk_type == 'final_response':
            print(f"\n\n✅ Final response received!")
            if chunk.get('has_chart'):
                print("📊 Chart data available")
        elif chunk_type == 'error':
            print(f"\n❌ Error: {chunk.get('content')}")
    
    print("\n" + "=" * 60)
    print("🎉 Streaming test completed!")

if __name__ == "__main__":
    asyncio.run(test_streaming_agent())
