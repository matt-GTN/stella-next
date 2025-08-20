#!/usr/bin/env python3
"""
Direct LLM streaming endpoint that bypasses LangGraph for true token-by-token streaming
"""

import os
import sys
import asyncio
import json
from typing import AsyncGenerator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add agent directory to Python path
agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent')
sys.path.insert(0, agent_dir)

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Setup LLM with streaming
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "moonshotai/kimi-k2:free"

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")

# Initialize streaming LLM
streaming_llm = ChatOpenAI(
    model=OPENROUTER_MODEL,
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    temperature=0,
    streaming=True,
    default_headers={
        "HTTP-Referer": "https://github.com/DataScientest-Studio/nov24_cds_opa",
        "X-Title": "Stella Financial Assistant"
    }
)

# System prompt for direct streaming
system_prompt = """Tu es Stella, une assistante experte financière créée dans le cadre du Projet OPA. 

Ton rôle principal est d'aider les utilisateurs avec des questions financières et l'analyse d'actions.

Tu réponds toujours en français de manière claire et structurée.

Pour cette version de streaming, tu ne peux pas utiliser d'outils, mais tu peux donner des conseils généraux et expliquer des concepts financiers."""

async def stream_direct_llm_response(message: str) -> AsyncGenerator[str, None]:
    """
    Stream response directly from LLM with true token-by-token streaming
    """
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=message)
    ]
    
    try:
        # Use async streaming from LangChain
        async for chunk in streaming_llm.astream(messages):
            if chunk.content:
                yield chunk.content
    except Exception as e:
        yield f"\n\n❌ Erreur lors du streaming: {str(e)}"

# Test function
async def test_direct_streaming():
    """Test the direct streaming functionality"""
    print("🧪 Testing direct LLM streaming...")
    print("📝 Message: Bonjour Stella!")
    print("=" * 60)
    
    full_response = ""
    async for token in stream_direct_llm_response("Bonjour Stella!"):
        print(token, end='', flush=True)
        full_response += token
    
    print("\n" + "=" * 60)
    print(f"📊 Total response length: {len(full_response)} characters")

if __name__ == "__main__":
    asyncio.run(test_direct_streaming())
