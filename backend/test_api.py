#!/usr/bin/env python3
"""
Simple test script for the Stella API
"""

import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_chat(message: str, session_id: str = None):
    """Test chat endpoint"""
    print(f"Testing chat with message: '{message}'")
    
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    
    start_time = time.time()
    response = requests.post(
        f"{API_BASE}/chat",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    end_time = time.time()
    
    print(f"Status: {response.status_code}")
    print(f"Response time: {end_time - start_time:.2f} seconds")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Session ID: {data['session_id']}")
        print(f"Response: {data['response'][:200]}...")
        print(f"Has chart: {data['has_chart']}")
        print(f"Has dataframe: {data['has_dataframe']}")
        print(f"Has news: {data['has_news']}")
        print(f"Has profile: {data['has_profile']}")
        return data['session_id']
    else:
        print(f"Error: {response.text}")
        return None
    
    print()

if __name__ == "__main__":
    # Test health
    test_health()
    
    # Test basic chat
    session_id = test_chat("Bonjour Stella!")
    
    # Test analysis (if session works)
    if session_id:
        print("\n" + "="*50)
        test_chat("Analyse l'action AAPL", session_id)
        
        print("\n" + "="*50)
        test_chat("Qui sont les créateurs du projet ?", session_id)
    
    print("\n" + "="*50)
    print("Tests completed!")
