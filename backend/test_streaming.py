#!/usr/bin/env python3
"""
Test script for Stella API streaming endpoint with SSE
"""

import json
import requests
import time
from datetime import datetime

def test_streaming_chat():
    """Test the streaming chat endpoint with Server-Sent Events"""
    
    base_url = "http://localhost:8000"
    
    # Test message
    test_message = "Qui sont les créateurs du projet ?"
    
    data = {
        "message": test_message,
        "session_id": f"test_session_{int(time.time())}"
    }
    
    print(f"🚀 Testing streaming chat endpoint...")
    print(f"📝 Message: {test_message}")
    print(f"📍 URL: {base_url}/chat/stream")
    print(f"⏰ Started at: {datetime.now().isoformat()}")
    print("=" * 60)
    
    try:
        # Make streaming request
        with requests.post(
            f"{base_url}/chat/stream",
            json=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            stream=True,
            timeout=60
        ) as response:
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📋 Response Headers: {dict(response.headers)}")
            print("-" * 60)
            
            if response.status_code != 200:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return
            
            # Process streaming response
            buffer = ""
            full_content = ""
            
            for chunk in response.iter_content(chunk_size=1):
                if chunk:
                    buffer += chunk.decode('utf-8')
                    
                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        
                        # Handle SSE format
                        if line.startswith('data: '):
                            data_json = line[6:]  # Remove 'data: ' prefix
                            
                            if data_json.strip():
                                try:
                                    event_data = json.loads(data_json)
                                    event_type = event_data.get('type', 'unknown')
                                    
                                    if event_type == 'session_id':
                                        print(f"🔗 Session ID: {event_data.get('session_id')}")
                                        
                                    elif event_type == 'content_delta':
                                        content = event_data.get('content', '')
                                        print(content, end='', flush=True)
                                        full_content += content
                                        
                                    elif event_type == 'content_replace':
                                        content = event_data.get('content', '')
                                        print(f"\n🔄 Content replaced: {content}")
                                        full_content = content
                                        
                                    elif event_type == 'final_message':
                                        print(f"\n\n✅ Final message received!")
                                        print(f"📄 Full content: {event_data.get('content', '')}")
                                        
                                        # Check for additional data
                                        if event_data.get('has_chart'):
                                            print("📊 Chart data available")
                                        if event_data.get('has_dataframe'):
                                            print("📋 DataFrame data available")
                                        if event_data.get('has_news'):
                                            print("📰 News data available")
                                        if event_data.get('has_profile'):
                                            print("👤 Profile data available")
                                            
                                    elif event_type == 'error':
                                        print(f"\n❌ Error: {event_data.get('error')}")
                                        print(f"Error code: {event_data.get('error_code')}")
                                        
                                    elif event_type == 'done':
                                        print(f"\n\n🎉 Streaming completed!")
                                        break
                                        
                                except json.JSONDecodeError as e:
                                    print(f"\n⚠️  JSON decode error: {e}")
                                    print(f"Raw data: {data_json}")
            
            print("\n" + "=" * 60)
            print(f"⏰ Completed at: {datetime.now().isoformat()}")
            print(f"📊 Total content length: {len(full_content)} characters")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_health_check():
    """Test the health endpoint first"""
    
    base_url = "http://localhost:8000"
    
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Stella API Streaming Test")
    print("=" * 60)
    
    # Test health first
    if test_health_check():
        print()
        test_streaming_chat()
    else:
        print("❌ Server is not running. Please start the API server first.")
        print("Run: cd backend && ./start_server.sh")
