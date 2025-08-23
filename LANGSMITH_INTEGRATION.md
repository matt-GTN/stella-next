# Intégration LangSmith pour la Visualisation du Graphique

Cette branche implémente l'intégration des traces LangSmith avec le système de visualisation existant, permettant d'utiliser les données de trace réelles tout en conservant l'apparence visuelle actuelle.

## Changements Apportés

### Backend

#### 1. Nouvelle fonction `get_langsmith_trace_data()` dans `backend/agent/agent.py`
- Remplace la génération d'images par l'extraction de données structurées
- Récupère les tool calls depuis les traces LangSmith
- Retourne un format JSON compatible avec le frontend

#### 2. Nouvel endpoint API `/langsmith-trace/{session_id}` dans `backend/api/api.py`
- Expose les données de trace LangSmith au frontend
- Modèle de réponse `LangSmithTraceResponse`
- Gestion d'erreurs appropriée

### Frontend

#### 1. Nouveau transformateur `langsmithTransformer.js`
- Convertit les données LangSmith au format attendu par le graphique existant
- Fonctions utilitaires pour récupérer et valider les traces
- Compatible avec l'API existante

#### 2. Composant wrapper `GraphVisualizationWrapper.js`
- Gère automatiquement les deux sources de données (LangSmith et legacy)
- Fallback intelligent vers les données du message si LangSmith n'est pas disponible
- Indicateur visuel de la source de données en mode développement

#### 3. Mise à jour de `ChatMessage.js`
- Utilise le nouveau wrapper au lieu du composant direct
- Passe l'ID de session pour la récupération des traces LangSmith

#### 4. Configuration Next.js
- Proxy API pour rediriger `/api/*` vers le backend FastAPI
- Configuration optimisée pour le développement

## Utilisation

### Automatique
Le système détecte automatiquement si des traces LangSmith sont disponibles pour une session et les utilise en priorité. Si aucune trace n'est trouvée, il utilise les données legacy du message.

### Développement
En mode développement, un petit badge indique la source des données utilisées :
- 🟢 "LangSmith" : Données provenant des traces LangSmith
- 🟡 "Legacy" : Données provenant du message (fallback)

## Structure des Données

### Format LangSmith (Backend → Frontend)
```json
{
  "thread_id": "session_123",
  "tool_calls": [
    {
      "name": "search_ticker",
      "arguments": {"symbol": "AAPL"},
      "status": "completed",
      "execution_time": 1250,
      "timestamp": "2024-01-01T12:00:00Z",
      "run_id": "run_456",
      "result": {...},
      "error": null
    }
  ],
  "execution_path": ["agent", "execute_tool", "generate_final_response"],
  "graph_structure": {...},
  "total_execution_time": 2500,
  "status": "completed"
}
```

### Format Legacy (Message)
```json
{
  "toolCalls": [
    {
      "name": "search_ticker",
      "args": {"symbol": "AAPL"},
      "status": "completed"
    }
  ]
}
```

## Avantages

1. **Données Réelles** : Utilise les traces d'exécution réelles de LangSmith
2. **Compatibilité** : Maintient la compatibilité avec l'ancien système
3. **Visuel Conservé** : Garde l'apparence et les fonctionnalités existantes
4. **Fallback Intelligent** : Dégradation gracieuse si LangSmith n'est pas disponible
5. **Performance** : Optimisations pour éviter les re-rendus inutiles

## Tests

Pour tester l'intégration :

1. Démarrer le backend avec LangSmith configuré
2. Avoir une conversation avec Stella
3. Observer le graphique dans l'interface - il devrait utiliser les données LangSmith
4. Vérifier le badge de source en mode développement

## Dépannage

### Pas de données LangSmith
- Vérifier que `LANGSMITH_API_KEY` est configuré
- Vérifier que `LANGCHAIN_PROJECT` correspond au projet LangSmith
- S'assurer que la session a bien généré des traces

### Erreurs de proxy API
- Vérifier que le backend FastAPI fonctionne sur le port 8000
- Vérifier la configuration `next.config.js`

### Problèmes de visualisation
- Le système utilise automatiquement les données legacy en cas d'erreur
- Vérifier la console pour les messages d'erreur détaillés