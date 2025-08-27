
---

# Stella – Assistant Financier IA

Projet de fin d’étude réalisé dans le cadre du cursus **Data Scientist chez Mines Paris – PSL**
par **Mathis GENTHON** pour la partie analyse fondamentale, développement applicatif et rédaction de la recherche fondamentale.

Stella est une plateforme d’analyse financière, alimentée par l’IA, qui combine raisonnement agentique et visualisation interactive des workflows.
  
Elle propose une analyse complète des risques liés à des actions américaines en utilisant un algorithme de Machine Learning, un accès aux données en temps réel, et une transparence totale dans la prise de décision de l’IA, le tout via une interface web moderne.

---

## ✨ Fonctionnalités principales

### 🤖 Analyse Financière IA

1. **Agent Intelligent** : Agent basé sur LangGraph pour un raisonnement financier complexe.
2. **Multi-outils intégrés** : Analyse boursière, agrégation de news, profils d’entreprise, évaluation des risques.
3. **Données en temps réel** : Marchés financiers (Financial Modeling Prep) et actualités (NewsAPI).
4. **Interface Chat** : Posez vos questions financières en langage naturel.

### 📊 Visualisations avancées

* **Transparence du Workflow** : Graphiques interactifs montrant les étapes de raisonnement de l’agent.
* **Graphiques financiers** : Visualisations dynamiques avec Plotly.
* **Tableaux de données** : Affichage enrichi avec pandas DataFrames.
* **Design Glassmorphique** : Interfaces modernes avec fonds transparents et flous esthétiques.

### 🌐 Stack technologique moderne

* **Backend** : FastAPI (Python 3.10), orchestration IA avec LangChain/LangGraph.
* **Frontend** : Next.js 15 (React 19), Tailwind CSS, animations Motion.
* **IA / ML** : OpenRouter API, SHAP pour l’explicabilité des modèles.
* **Données** : ChromaDB (vecteurs), pandas (traitement).

### 🚀 Production & Déploiement

* **Conteneurisé** : Docker pour frontend et backend.
* **Scalable** : Build standalone Next.js pour déploiement optimisé.
* **Monitoring** : Intégration LangSmith pour suivi et debug des agents.
* **Multi-langue** : Interface complète en français et en anglais.

---

## 📂 Organisation du projet

```
stella-next/
├── backend/                  <- API et agent (FastAPI + LangGraph)
│   ├── agent/                <- Logique de l’agent
│   ├── api/                  <- Endpoints FastAPI
│   ├── models/               <- Modèles de données
│   ├── reports/              <- Rapports générés
│   ├── chroma_research_db/   <- Base vectorielle
│   ├── requirements.txt      <- Dépendances Python
│   ├── Dockerfile            <- Config Docker backend
│   └── .env                  <- Variables d’environnement backend
│
├── frontend/                 <- Interface utilisateur (Next.js + React)
│   ├── app/                  <- Pages principales
│   ├── components/           <- Composants React
│   ├── contexts/             <- Contextes React
│   ├── translations/         <- Internationalisation
│   ├── utils/                <- Fonctions utilitaires
│   ├── package.json          <- Dépendances Node.js
│   ├── Dockerfile            <- Config Docker frontend
│   └── .env.local            <- Variables d’environnement frontend
│
├── .env.example              <- Exemple de configuration
├── start_api.sh              <- Script de démarrage backend
└── README.md                 <- Ce fichier
```

---

## 🔑 Clés API nécessaires

Il est nécessaire d’obtenir plusieurs clés API :

* **[OpenRouter](https://openrouter.ai/)** → Fournisseur LLM (gratuit, quota disponible)
* **[Financial Modeling Prep](https://financialmodelingprep.com/)** → Données financières (250 requêtes/jour gratuites)
* **[NewsAPI](https://newsapi.org/)** → Actualités entreprises (1000 requêtes/jour gratuites)
* **[LangSmith](https://smith.langchain.com/)** *(optionnel)* → Tracing et debug de l’agent

Ajoutez ces clés dans le fichier `.env` (backend) et `.env.local` (frontend).

---

## ⚡ Installation & Lancement

### Prérequis

* Python **3.10+**
* Node.js **18+**
* Docker *(optionnel, recommandé en prod)*

### Étapes principales

1. **Cloner le repo**

```bash
git clone <repository-url>
cd stella-next
cp .env.example .env
```

2. **Configurer les clés API** dans `.env`

3. **Lancer en local**

**Backend :**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend/api && python api.py
```

**Frontend :**

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

* Accès Frontend → [http://localhost:3000](http://localhost:3000)
* API → [http://localhost:8000/docs](http://localhost:8000/docs)

### Avec Docker (prod)

```bash
docker-compose up -d
```

---

## 📊 Capacités d’analyse

1. **Analyse boursière** : tendances, indicateurs techniques, fondamentaux.
2. **Profils d’entreprise** : métriques financières, secteur, CEO.
3. **Actualités** : agrégation et analyse de sentiment.
4. **Évaluation des risques** : signaux négatifs, gestion de portefeuille.
5. **Comparaison multi-entreprises** : benchmarking sur plusieurs métriques.
6. **Modèles ML** : prédictions avec RandomForest, analyse de confiance, SHAP pour l’explicabilité.

---

## 🐳 Déploiement

* **Via Docker Compose** → déploiement production simplifié (frontend + backend).
* **Monitoring intégré** → traçage LangSmith, logs détaillés.
* **Optimisations** → caching, async, index vectoriels pour requêtes rapides.

## 📄 Licence

Projet sous **licence MIT**.
