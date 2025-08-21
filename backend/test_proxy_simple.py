#!/usr/bin/env python3
"""
Simple test for webshare proxy implementation - no API calls needed.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to path
sys.path.append(os.path.dirname(__file__))

def test_proxy_module_import():
    """Test that we can import the proxy module."""
    print("🧪 Testing proxy module import...")
    
    try:
        from agent.src.proxy_config import (
            WebshareProxyManager,
            get_proxy_manager, 
            create_groq_compatible_client,
            create_requests_session_with_proxy
        )
        print("✅ Successfully imported proxy configuration module")
        return True
    except ImportError as e:
        print(f"❌ Failed to import proxy module: {e}")
        return False

def test_proxy_manager_creation():
    """Test proxy manager creation and configuration."""
    print("🔧 Testing proxy manager creation...")
    
    from agent.src.proxy_config import get_proxy_manager
    
    # Test without credentials (disabled)
    proxy_manager = get_proxy_manager()
    
    print(f"   Proxy enabled: {proxy_manager.proxy_enabled}")
    print(f"   Webshare endpoint: {proxy_manager.webshare_endpoint}")
    print(f"   Username configured: {'✅' if proxy_manager.webshare_username else '❌'}")
    print(f"   Password configured: {'✅' if proxy_manager.webshare_password else '❌'}")
    
    return True

def test_http_client_creation():
    """Test HTTP client creation with and without proxy."""
    print("🌐 Testing HTTP client creation...")
    
    from agent.src.proxy_config import create_groq_compatible_client, get_proxy_manager
    
    proxy_manager = get_proxy_manager()
    
    try:
        # This should work regardless of proxy settings
        http_client = create_groq_compatible_client()
        print(f"   ✅ HTTP client created successfully")
        print(f"   ✅ Client type: {type(http_client)}")
        
        # Check if proxy configuration is applied
        if proxy_manager.proxy_enabled:
            print(f"   🌐 Proxy configuration applied")
        else:
            print(f"   🚫 No proxy configuration (disabled)")
        
        return True
    except Exception as e:
        print(f"   ❌ Failed to create HTTP client: {e}")
        return False

def test_environment_variable_handling():
    """Test different environment variable configurations."""
    print("🔬 Testing environment variable configurations...")
    
    # Save original values
    original_proxy_enabled = os.environ.get("USE_WEBSHARE_PROXY")
    original_username = os.environ.get("WEBSHARE_USERNAME")
    original_password = os.environ.get("WEBSHARE_PASSWORD")
    
    test_cases = [
        ("false", None, None, "Proxy disabled"),
        ("true", None, None, "Proxy enabled but no credentials"),
        ("true", "testuser", None, "Proxy enabled with username only"),
        ("true", "testuser", "testpass", "Proxy enabled with full credentials"),
    ]
    
    for use_proxy, username, password, description in test_cases:
        print(f"   🧪 Testing: {description}")
        
        # Set test environment
        os.environ["USE_WEBSHARE_PROXY"] = use_proxy
        if username:
            os.environ["WEBSHARE_USERNAME"] = username
        elif "WEBSHARE_USERNAME" in os.environ:
            del os.environ["WEBSHARE_USERNAME"]
            
        if password:
            os.environ["WEBSHARE_PASSWORD"] = password
        elif "WEBSHARE_PASSWORD" in os.environ:
            del os.environ["WEBSHARE_PASSWORD"]
        
        # Reload the module to pick up new environment
        import importlib
        import agent.src.proxy_config
        importlib.reload(agent.src.proxy_config)
        
        proxy_manager = agent.src.proxy_config.get_proxy_manager()
        
        print(f"      - Enabled: {proxy_manager.proxy_enabled}")
        if proxy_manager.proxy_enabled:
            print(f"      - Has credentials: {bool(proxy_manager.webshare_username and proxy_manager.webshare_password)}")
    
    # Restore original values
    if original_proxy_enabled:
        os.environ["USE_WEBSHARE_PROXY"] = original_proxy_enabled
    elif "USE_WEBSHARE_PROXY" in os.environ:
        del os.environ["USE_WEBSHARE_PROXY"]
        
    if original_username:
        os.environ["WEBSHARE_USERNAME"] = original_username
    elif "WEBSHARE_USERNAME" in os.environ:
        del os.environ["WEBSHARE_USERNAME"]
        
    if original_password:
        os.environ["WEBSHARE_PASSWORD"] = original_password
    elif "WEBSHARE_PASSWORD" in os.environ:
        del os.environ["WEBSHARE_PASSWORD"]
    
    return True

def test_chatgroq_integration():
    """Test ChatGroq integration with proxy configuration."""
    print("🤖 Testing ChatGroq integration...")
    
    try:
        from agent.src.proxy_config import create_groq_compatible_client, get_proxy_manager
        from langchain_groq import ChatGroq
        
        proxy_manager = get_proxy_manager()
        
        # Test creating ChatGroq without proxy
        llm_no_proxy = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key="fake_key_for_testing",  # We're not making real API calls
            temperature=0,
        )
        print("   ✅ ChatGroq created without proxy")
        
        # Test creating ChatGroq with proxy client
        if proxy_manager.proxy_enabled:
            http_client = create_groq_compatible_client()
            llm_with_proxy = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key="fake_key_for_testing",
                temperature=0,
                http_client=http_client,
            )
            print("   ✅ ChatGroq created with proxy client")
        else:
            print("   ℹ️  Skipping proxy client test (proxy disabled)")
        
        return True
    except Exception as e:
        print(f"   ❌ ChatGroq integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("🚀 Webshare Proxy Implementation - Simple Test Suite")
    print("=" * 60)
    
    tests = [
        ("Module Import", test_proxy_module_import),
        ("Proxy Manager", test_proxy_manager_creation),
        ("HTTP Client", test_http_client_creation),
        ("Environment Variables", test_environment_variable_handling),
        ("ChatGroq Integration", test_chatgroq_integration),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 40)
        
        if test_func():
            print(f"✅ {test_name} passed")
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Webshare proxy integration is ready to use.")
        print("\n📝 Next Steps:")
        print("1. Add your Webshare credentials to your .env file:")
        print("   USE_WEBSHARE_PROXY=true")
        print("   WEBSHARE_USERNAME=your_username")
        print("   WEBSHARE_PASSWORD=your_password")
        print("2. The ChatGroq initialization will automatically use the proxy")
        print("3. Monitor your Groq API requests to ensure they're routed through the proxy")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    exit(main())
