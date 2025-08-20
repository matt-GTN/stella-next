#!/usr/bin/env python3
"""
Script de test complet pour tous les outils de Stella
"""

import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_endpoint(message: str, description: str, session_id: str = None):
    """Test un endpoint spécifique"""
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"Message: '{message}'")
    print(f"{'='*60}")
    
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    
    start_time = time.time()
    try:
        response = requests.post(
            f"{API_BASE}/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # 60 secondes de timeout
        )
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Response time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Session ID: {data['session_id']}")
            print(f"Response: {data['response'][:300]}...")
            print(f"Has chart: {data['has_chart']}")
            print(f"Has dataframe: {data['has_dataframe']}")
            print(f"Has news: {data['has_news']}")
            print(f"Has profile: {data['has_profile']}")
            
            # Retourner les informations utiles
            return {
                'success': True,
                'session_id': data['session_id'],
                'has_chart': data['has_chart'],
                'has_dataframe': data['has_dataframe'],
                'has_news': data['has_news'],
                'has_profile': data['has_profile'],
                'response_time': end_time - start_time
            }
        else:
            print(f"Error: {response.text}")
            return {'success': False, 'error': response.text}
            
    except Exception as e:
        print(f"Exception: {e}")
        return {'success': False, 'exception': str(e)}

def main():
    print("🚀 DÉBUT DES TESTS COMPLETS DE STELLA")
    print("=" * 80)
    
    # Test de santé
    print("Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    print(f"Health Status: {response.status_code}")
    if response.status_code != 200:
        print("❌ API non disponible!")
        return
    print("✅ API disponible")
    
    session_id = None
    results = []
    
    # Liste des tests à effectuer
    tests = [
        ("Bonjour Stella!", "Test de base - Salutation"),
        ("Analyse l'action AAPL", "Test d'analyse complète (fetch_data + preprocess_data + analyze_risks)"),
        ("Montre-moi les données brutes d'Apple", "Test d'affichage de données brutes"),
        ("Affiche les données traitées d'AAPL", "Test d'affichage de données traitées"),
        ("Montre-moi l'évolution du ROE d'Apple", "Test de création de graphique dynamique"),
        ("Quel est le cours d'Apple sur 6 mois?", "Test d'affichage du prix de l'action"),
        ("Compare le prix d'Apple et Microsoft", "Test de comparaison de prix"),
        ("Compare le ROE d'Apple et Microsoft", "Test de comparaison de métriques fondamentales"),
        ("Quelles sont les dernières news sur Apple?", "Test de récupération des actualités"),
        ("Parle-moi de l'entreprise Tesla", "Test du profil d'entreprise"),
        ("Quelle est la stack technique du projet?", "Test du système RAG/query_research"),
    ]
    
    # Exécuter tous les tests
    for i, (message, description) in enumerate(tests, 1):
        result = test_endpoint(message, f"{i}/{len(tests)} - {description}", session_id)
        results.append({
            'test': description,
            'message': message,
            'result': result
        })
        
        if result.get('success') and session_id is None:
            session_id = result.get('session_id')
            
        # Petite pause entre les tests
        time.sleep(1)
    
    # Résumé des résultats
    print("\n" + "="*80)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*80)
    
    successful_tests = 0
    failed_tests = 0
    
    for test in results:
        status = "✅ SUCCÈS" if test['result'].get('success') else "❌ ÉCHEC"
        print(f"{status} - {test['test']}")
        if test['result'].get('success'):
            successful_tests += 1
            # Affichage des fonctionnalités utilisées
            features = []
            if test['result'].get('has_chart'):
                features.append("Graphique")
            if test['result'].get('has_dataframe'):
                features.append("DataFrame")
            if test['result'].get('has_news'):
                features.append("Actualités")
            if test['result'].get('has_profile'):
                features.append("Profil")
            if features:
                print(f"    └── Fonctionnalités: {', '.join(features)}")
        else:
            failed_tests += 1
            error = test['result'].get('error', test['result'].get('exception', 'Erreur inconnue'))
            print(f"    └── Erreur: {error[:100]}...")
    
    print(f"\n🎯 RÉSULTAT FINAL:")
    print(f"   ✅ Tests réussis: {successful_tests}/{len(tests)}")
    print(f"   ❌ Tests échoués: {failed_tests}/{len(tests)}")
    print(f"   📊 Taux de réussite: {successful_tests/len(tests)*100:.1f}%")
    
    if failed_tests == 0:
        print("\n🎉 TOUS LES TESTS SONT PASSÉS! Stella fonctionne parfaitement!")
    elif failed_tests <= 2:
        print("\n⚠️  Quelques problèmes mineurs, mais Stella fonctionne globalement bien.")
    else:
        print("\n🚨 Plusieurs problèmes détectés. Vérification nécessaire.")

if __name__ == "__main__":
    main()
