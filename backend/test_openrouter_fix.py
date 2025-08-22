#!/usr/bin/env python3
"""
Script de test pour valider la correction du problème OpenRouter après inactivité
"""

import time
import requests
import json
import asyncio
from datetime import datetime
import threading
import signal
import sys

# Configuration
API_BASE = "http://localhost:8000"
TEST_TIMEOUT = 30  # Timeout pour chaque test individuel

def signal_handler(sig, frame):
    print('\n\n❌ Test interrompu par l\'utilisateur')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def test_server_health():
    """Test de santé du serveur"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_basic_chat():
    """Test de chat simple qui ne déclenche pas d'outils"""
    try:
        payload = {
            "message": "Bonjour Stella, que peux-tu faire ?",
            "session_id": "test_openrouter_fix"
        }
        response = requests.post(f"{API_BASE}/chat", json=payload, timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Response received: {len(data.get('response', ''))} chars")
            return True
        else:
            print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Chat test failed: {e}")
        return False

def test_agent_with_tools():
    """Test avec appel d'outils (plus susceptible de déclencher le bug OpenRouter)"""
    try:
        payload = {
            "message": "Montre-moi le profil de Tesla",
            "session_id": "test_openrouter_fix"
        }
        response = requests.post(f"{API_BASE}/chat", json=payload, timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Agent with tools: {len(data.get('response', ''))} chars")
            return True
        else:
            print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        return False

def test_streaming():
    """Test du streaming SSE"""
    try:
        payload = {
            "message": "Salut Stella",
            "session_id": "test_openrouter_fix"
        }
        
        response = requests.post(
            f"{API_BASE}/chat/stream", 
            json=payload, 
            timeout=TEST_TIMEOUT,
            stream=True
        )
        
        if response.status_code != 200:
            print(f"❌ Streaming HTTP {response.status_code}")
            return False
            
        chunks_received = 0
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data: "):
                try:
                    data = json.loads(line[6:])  # Remove "data: " prefix
                    chunks_received += 1
                    if data.get('type') == 'done':
                        break
                except json.JSONDecodeError:
                    continue
                    
        print(f"✅ Streaming: {chunks_received} chunks received")
        return chunks_received > 0
        
    except Exception as e:
        print(f"❌ Streaming test failed: {e}")
        return False

def simulate_inactivity_scenario():
    """Simule le scénario d'inactivité qui causait le problème"""
    print("🔄 Testing OpenRouter fix for post-inactivity hangs...")
    print("="*60)
    
    # 1. Test initial
    print("\n1️⃣ Test initial (server should be fresh)")
    if not test_server_health():
        print("❌ Server not accessible")
        return False
    
    if not test_basic_chat():
        print("❌ Initial basic chat failed")
        return False
        
    # 2. Test avec tools initial
    print("\n2️⃣ Test with tools (initial)")
    if not test_agent_with_tools():
        print("❌ Initial agent test failed")
        return False
    
    # 3. Simulation période d'inactivité (plus courte pour les tests)
    print("\n3️⃣ Simulating 3 minutes of inactivity...")
    for i in range(3):
        print(f"   ⏳ {i+1}/3 minutes elapsed...")
        time.sleep(60)  # 1 minute
        
        # Test de santé pendant l'inactivité
        health_ok = test_server_health()
        if not health_ok:
            print(f"❌ Server became unhealthy during minute {i+1}")
            return False
    
    print("   ✅ Inactivity period completed")
    
    # 4. Tests critiques après inactivité
    print("\n4️⃣ Critical tests after inactivity (where bug would occur)")
    
    print("   🧪 Test 1: Basic chat after inactivity")
    if not test_basic_chat():
        print("❌ FAILED: Basic chat blocked after inactivity")
        print("🚨 This suggests the OpenRouter timeout fix didn't work")
        return False
        
    print("   🧪 Test 2: Agent with tools after inactivity") 
    if not test_agent_with_tools():
        print("❌ FAILED: Agent with tools blocked after inactivity")
        print("🚨 This suggests the OpenRouter timeout fix didn't work")
        return False
    
    print("   🧪 Test 3: Streaming after inactivity")
    if not test_streaming():
        print("❌ FAILED: Streaming blocked after inactivity")
        print("🚨 This suggests the OpenRouter timeout fix didn't work")
        return False
    
    # 5. Tests de résistance
    print("\n5️⃣ Stress tests after inactivity")
    for i in range(3):
        print(f"   🧪 Stress test {i+1}/3")
        if not test_basic_chat():
            print(f"❌ Stress test {i+1} failed")
            return False
        time.sleep(2)
    
    print("\n🎉 ALL TESTS PASSED!")
    print("✅ OpenRouter timeout fix appears to be working correctly")
    print("✅ No hangs detected after inactivity period")
    return True

def quick_verification():
    """Test rapide pour vérifier que la correction fonctionne"""
    print("🚀 Quick verification of OpenRouter timeout fix...")
    print("="*50)
    
    if not test_server_health():
        print("❌ Server not accessible")
        return False
        
    print("✅ Server is healthy")
    
    # Test de base
    if not test_basic_chat():
        print("❌ Basic chat failed")
        return False
    print("✅ Basic chat works")
    
    # Test avec timeout potentiel
    if not test_agent_with_tools():
        print("❌ Agent with tools failed") 
        return False
    print("✅ Agent with tools works")
    
    # Test streaming
    if not test_streaming():
        print("❌ Streaming failed")
        return False
    print("✅ Streaming works")
    
    print("\n🎉 Quick verification PASSED!")
    print("✅ OpenRouter timeout configuration appears to be working")
    return True

def monitor_response_times():
    """Monitore les temps de réponse pour détecter des anomalies"""
    print("📊 Monitoring response times...")
    print("="*40)
    
    response_times = []
    
    for i in range(5):
        start_time = time.time()
        success = test_basic_chat()
        end_time = time.time()
        
        if success:
            response_time = end_time - start_time
            response_times.append(response_time)
            print(f"   Test {i+1}: {response_time:.2f}s")
        else:
            print(f"   Test {i+1}: FAILED")
            return False
        
        time.sleep(5)  # 5s entre chaque test
    
    avg_time = sum(response_times) / len(response_times)
    max_time = max(response_times)
    min_time = min(response_times)
    
    print(f"\n📈 Response Time Statistics:")
    print(f"   Average: {avg_time:.2f}s")
    print(f"   Min: {min_time:.2f}s") 
    print(f"   Max: {max_time:.2f}s")
    
    if max_time > 30:
        print("⚠️ Some requests took longer than 30s - may indicate timeout issues")
        return False
    elif avg_time > 10:
        print("⚠️ Average response time > 10s - performance may be degraded")
        return False
    else:
        print("✅ Response times look healthy")
        return True

if __name__ == "__main__":
    print("🔧 OpenRouter Timeout Fix Validation")
    print("🎯 Testing the fix for post-inactivity hangs")
    print("🕐 Started at:", datetime.now().strftime('%H:%M:%S'))
    print("\nMake sure the backend server is running on localhost:8000")
    
    choice = input("""\nSelect test type:
1. Quick verification (2 minutes)
2. Full inactivity simulation (5 minutes) 
3. Response time monitoring (2 minutes)
4. All tests (10 minutes)

Your choice [1-4]: """)
    
    success = False
    
    if choice == "1":
        success = quick_verification()
    elif choice == "2": 
        success = simulate_inactivity_scenario()
    elif choice == "3":
        success = monitor_response_times()
    elif choice == "4":
        print("\n" + "="*60)
        print("🔄 Running all tests...")
        success = (quick_verification() and 
                  monitor_response_times() and 
                  simulate_inactivity_scenario())
    else:
        print("❌ Invalid choice")
        sys.exit(1)
    
    print("\n" + "="*60)
    if success:
        print("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        print("✅ The OpenRouter timeout fix is working correctly")
        print("✅ No post-inactivity hangs detected")
    else:
        print("❌ TESTS FAILED!")
        print("🚨 The OpenRouter timeout fix may not be working properly")
        print("💡 Check the server logs for timeout errors")
        
    print(f"🕐 Finished at: {datetime.now().strftime('%H:%M:%S')}")
