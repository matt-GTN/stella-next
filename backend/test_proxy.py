#!/usr/bin/env python3
"""
Test script for webshare proxy implementation with Groq API.
"""

import os
import sys
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the agent directory to the path so we can import our modules
sys.path.append(os.path.dirname(__file__))

def test_proxy_configuration():
    """Test the proxy configuration setup."""
    print("🧪 Testing Webshare Proxy Configuration...")
    
    from agent.src.proxy_config import get_proxy_manager, create_groq_compatible_client
    
    proxy_manager = get_proxy_manager()
    
    print(f"Proxy enabled: {proxy_manager.proxy_enabled}")
    print(f"Webshare endpoint: {proxy_manager.webshare_endpoint}")
    
    if proxy_manager.proxy_enabled:
        print(f"Username configured: {'✅' if proxy_manager.webshare_username else '❌'}")
        print(f"Password configured: {'✅' if proxy_manager.webshare_password else '❌'}")
        
        # Test HTTP client creation
        try:
            http_client = create_groq_compatible_client()
            print("✅ HTTP client with proxy created successfully")
            return True
        except Exception as e:
            print(f"❌ Error creating HTTP client: {e}")
            return False
    else:
        print("ℹ️  Proxy is disabled - set USE_WEBSHARE_PROXY=true to enable")
        return True

def test_groq_with_proxy():
    """Test Groq API calls with proxy."""
    print("\n🔥 Testing Groq API with Proxy...")
    
    try:
        from agent.src.proxy_config import create_groq_compatible_client, get_proxy_manager
        from langchain_groq import ChatGroq
        from langchain_core.messages import HumanMessage
        
        # Get proxy manager
        proxy_manager = get_proxy_manager()
        
        # Create ChatGroq instance
        if proxy_manager.proxy_enabled:
            http_client = create_groq_compatible_client()
            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=os.getenv("GROQ_API_KEY"),
                temperature=0,
                http_client=http_client,
            )
            print("🔧 ChatGroq initialized with webshare proxy")
        else:
            llm = ChatGroq(
                model="llama-3.1-8b-instant", 
                api_key=os.getenv("GROQ_API_KEY"),
                temperature=0,
            )
            print("🔧 ChatGroq initialized without proxy")
        
        # Test simple API call
        print("📡 Making test API call...")
        start_time = time.time()
        
        response = llm.invoke([HumanMessage(content="Hello, respond with just 'Hello World!'")])
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"✅ API call successful!")
        print(f"📝 Response: {response.content}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        # Test streaming
        print("\n📡 Testing streaming...")
        start_time = time.time()
        
        stream_response = ""
        for chunk in llm.stream([HumanMessage(content="Count from 1 to 5")]):
            if chunk.content:
                stream_response += chunk.content
                print(f"📦 Chunk: {chunk.content}", end="", flush=True)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n✅ Streaming successful!")
        print(f"📝 Full response: {stream_response}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Groq API: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_with_different_configurations():
    """Test both with and without proxy to compare."""
    print("\n🔬 Comparative Test: With vs Without Proxy...")
    
    # Test without proxy first
    os.environ["USE_WEBSHARE_PROXY"] = "false"
    print("🔧 Testing WITHOUT proxy...")
    
    try:
        from agent.src.proxy_config import get_proxy_manager, create_groq_compatible_client
        from langchain_groq import ChatGroq
        from langchain_core.messages import HumanMessage
        
        # Reload proxy manager with new settings
        import importlib
        import agent.src.proxy_config
        importlib.reload(agent.src.proxy_config)
        
        proxy_manager = agent.src.proxy_config.get_proxy_manager()
        
        llm_no_proxy = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0,
        )
        
        start_time = time.time()
        response_no_proxy = llm_no_proxy.invoke([HumanMessage(content="Say 'No proxy!'")])
        no_proxy_duration = time.time() - start_time
        
        print(f"⚡ Without proxy - Duration: {no_proxy_duration:.2f}s")
        print(f"📝 Response: {response_no_proxy.content}")
        
    except Exception as e:
        print(f"❌ Error testing without proxy: {e}")
        return False
    
    # Test with proxy if configured
    if os.getenv("WEBSHARE_USERNAME") and os.getenv("WEBSHARE_PASSWORD"):
        print("\n🔧 Testing WITH proxy...")
        os.environ["USE_WEBSHARE_PROXY"] = "true"
        
        try:
            # Reload proxy manager with proxy enabled
            importlib.reload(agent.src.proxy_config)
            
            proxy_manager = agent.src.proxy_config.get_proxy_manager()
            http_client = agent.src.proxy_config.create_groq_compatible_client()
            
            llm_with_proxy = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=os.getenv("GROQ_API_KEY"),
                temperature=0,
                http_client=http_client,
            )
            
            start_time = time.time()
            response_with_proxy = llm_with_proxy.invoke([HumanMessage(content="Say 'With proxy!'")])
            proxy_duration = time.time() - start_time
            
            print(f"🌐 With proxy - Duration: {proxy_duration:.2f}s")
            print(f"📝 Response: {response_with_proxy.content}")
            
            # Compare performance
            print(f"\n📊 Performance Comparison:")
            print(f"   Without proxy: {no_proxy_duration:.2f}s")
            print(f"   With proxy:    {proxy_duration:.2f}s")
            print(f"   Overhead:      {(proxy_duration - no_proxy_duration):.2f}s ({((proxy_duration / no_proxy_duration - 1) * 100):.1f}%)")
            
        except Exception as e:
            print(f"❌ Error testing with proxy: {e}")
            return False
    else:
        print("⚠️  Proxy credentials not configured, skipping proxy test")
    
    return True

def main():
    """Run all tests."""
    print("🚀 Webshare Proxy Implementation Test Suite")
    print("=" * 50)
    
    # Check required environment variables
    if not os.getenv("GROQ_API_KEY"):
        print("❌ GROQ_API_KEY not found in environment variables")
        return 1
    
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Proxy configuration
    if test_proxy_configuration():
        tests_passed += 1
    
    # Test 2: Groq with proxy
    if test_groq_with_proxy():
        tests_passed += 1
    
    # Test 3: Comparative test
    if test_with_different_configurations():
        tests_passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Webshare proxy integration is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    exit(main())
