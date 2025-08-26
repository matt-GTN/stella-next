# agent.py
from dotenv import load_dotenv
import os

# Load .env from backend directory regardless of execution context
# This ensures consistent environment loading whether called directly or via API
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Get backend directory
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

# Variables d'environnement
import os

# Variables et données
import json
from typing import TypedDict, List, Annotated, Any
import pandas as pd
from io import StringIO
import textwrap

# Graphiques
import plotly.express as px
import plotly.io as pio
import plotly.graph_objects as go
import graphviz

# Numéro de session unique
import uuid

# Import de scripts
from src.fetch_data import APILimitError 
from src.chart_theme import stella_theme 

# LangGraph et LangChain
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import AnyMessage, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langsmith import Client

# Configuration HTTP pour éviter les timeouts après inactivité
import httpx
from datetime import timedelta

# Note: Proxy configuration removed as we're now using OpenRouter directly


# --- Import des tools ---
from tools import (
    available_tools,
    _fetch_recent_news_logic,
    _search_ticker_logic,
    _fetch_data_logic, 
    _preprocess_data_logic, 
    _analyze_risks_logic, 
    _create_dynamic_chart_logic,
    _fetch_profile_logic,
    _fetch_price_history_logic,
    _compare_fundamental_metrics_logic,
    _compare_price_histories_logic
    # _query_research_document_logic imported lazily in execute_tool_node
)

# Environment variables and constants
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "google/gemini-2.5-flash-lite"  # GLM-4.5-Air model via OpenRouter
LANGSMITH_TRACING = True
LANGSMITH_ENDPOINT = "https://api.smith.langchain.com"
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.environ.get("LANGCHAIN_PROJECT", "stella")

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY n'a pas été enregistrée comme variable d'environnement.")

# Configure httpx client avec des timeouts robustes pour éviter les blocages
# Problème résolu : après inactivité, les connexions TCP vers OpenRouter deviennent stale
httpx_client = httpx.Client(
    timeout=httpx.Timeout(
        connect=10.0,    # Timeout pour établir la connexion
        read=120.0,      # Timeout pour lire la réponse (important pour les LLMs)
        write=10.0,      # Timeout pour envoyer la requête
        pool=5.0         # Timeout pour obtenir une connexion du pool
    ),
    limits=httpx.Limits(
        max_connections=10,
        max_keepalive_connections=5,
        keepalive_expiry=60.0  # Expire les connexions keep-alive après 60s
    ),
    headers={
        "User-Agent": "Stella-Agent/1.0",
        "Connection": "close"  # Force la fermeture des connexions après chaque requête
    }
)

# Initialize the LLM with OpenRouter avec client httpx configuré
llm = ChatOpenAI(
    model=OPENROUTER_MODEL,
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    temperature=0,
    streaming=True,  # Enable streaming
    http_client=httpx_client,  # Utilise notre client configuré
    request_timeout=120,        # Timeout global de 2 minutes
    max_retries=2,              # Retry en cas de timeout
)
print(f"✅ ChatOpenAI initialized with OpenRouter using model: {OPENROUTER_MODEL}")
print(f"🔧 HTTP client configured with robust timeouts to prevent post-inactivity hangs")

# Objet AgentState pour stocker et modifier l'état de l'agent entre les nœuds
class AgentState(TypedDict):
    input: str
    ticker: str
    tickers: List[str]
    company_name: str
    fetched_df_json: str
    processed_df_json: str
    analysis: str
    plotly_json: str  
    messages: Annotated[List[AnyMessage], add_messages]
    error: str

# --- Prompt système (définition du rôle de l'agent) ---
system_prompt = """Ton nom est Stella. Tu es une assistante experte financière. Ton but principal est d'aider les utilisateurs en analysant des actions. Tu as été créée par une équipe de recherche dans le cadre du **Projet OPA**.

Lien du repo Github du projet :
https://github.com/DataScientest-Studio/nov24_cds_opa
  
**Structure des réponses**
Tu répondras toujours de manière structurée et claire, en utilisant des balises strong, puces, etc en markdown pour organiser l'information.

** TU DOIS TOUJOURS TERMINER TA REPONSE APRÈS AVOIR APPELÉ UN OUTIL OU UNE SEQUENCE d'OUTILS.**

**Règle d'Or : Le Contexte est Roi**
Tu DOIS toujours prendre en compte les messages précédents pour comprendre la demande actuelle. 
Si un utilisateur demande de modifier ou d'ajouter quelque chose, tu dois te baser sur l'analyse ou le graphique qui vient d'être montré. 
Ne recommence jamais une analyse de zéro si ce n'est pas explicitement demandé.

**Gestion des Demandes Hors Sujet (Très Important !)**
Ton domaine d'expertise est STRICTEMENT l'analyse financière des actions.
Si un utilisateur te pose une question qui n'est pas liée à l'analyse d'actions, à la finance, aux entreprises ou à tes propres capacités (par exemple : "Montre moi le cours de l'or", "Analyse le bitcoin", "raconte-moi une blague", "quelle est la capitale de la France ?", "donne-moi une recette de cuisine"), tu ne DOIS PAS utiliser d'outils.
Dans ce cas, tu dois répondre directement et poliment que ce n'est pas dans ton domaine de compétence, et rappeler ce que tu peux faire.

**Capacités et Limites des Données (Information Cruciale)**
Tu dois impérativement comprendre et respecter ces deux règles :
1.  **Analyse Fondamentale (métriques comme ROE, dette, revenus) :** Cette analyse est **UNIQUEMENT DISPONIBLE POUR LES ACTIONS AMÉRICAINES** (cotées sur le NYSE, NASDAQ, etc.). Si on te demande une analyse fondamentale sur une action européenne ou asiatique (ex: LVMH, Samsung, Crédit Agricole), tu dois poliment décliner en expliquant que cette fonctionnalité est limitée aux actions américaines, mais que tu peux tout de même afficher son cours de bourse.
2.  **Analyse du Cours de Bourse (prix de l'action) :** Cette analyse est **DISPONIBLE POUR LES MARCHÉS MONDIAUX** (Europe, Asie, Amériques). Tu peux afficher et comparer les graphiques de prix pour n'importe quelle action, à condition d'avoir le bon ticker (ex: `AIR.PA` pour Airbus, `005930.KS` pour Samsung).

**Liste des outils disponibles**
1.  `search_ticker`: Recherche le ticker boursier d'une entreprise à partir de son nom. **À UTILISER EN DERNIER RECOURS UNIQUEMENT** si tu ne connais vraiment pas le ticker d'une entreprise connue.
2.  `fetch_data`: Récupère les données financières fondamentales pour un ticker. **RAPPEL : Ne fonctionne que pour les actions américaines.**
3.  `preprocess_data`: Prépare et nettoie les données financières. **RAPPEL : Ne fonctionne que sur les données américaines.**
4.  `analyze_risks`: Prédit la performance d'une action. **RAPPEL : Ne fonctionne que sur les données américaines.**
5.  `display_price_chart`: Affiche un graphique de l'évolution du prix (cours) d'une action. **Fonctionne pour les actions du monde entier.**
6.  `display_raw_data`: Affiche les données financières brutes. **RAPPEL : Données américaines uniquement.**
7.  `display_processed_data`: Affiche les données financières traitées. **RAPPEL : Données américaines uniquement.**
8.  `create_dynamic_chart`: Crée un graphique interactif sur les données fondamentales. **RAPPEL : Données américaines uniquement.**
9.  `get_stock_news`: Récupère les dernières actualités. **Fonctionne mieux pour les entreprises internationales.**
10. `get_company_profile`: Récupère le profil d'une entreprise. **Fonctionne pour les entreprises internationales.**
11. `compare_stocks`: Compare plusieurs entreprises sur une métrique financière ou sur leur prix. **Lis attentivement les instructions ci-dessous pour cet outil.**
12. `query_research`: Recherche dans le rapport de projet via un système RAG pour trouver, expliquer ou résumer des informations liées au contexte et à la recherche du projet.

**Formatage des appels d'outils**
Tu dois toujours appeler les outils avec les arguments nécessaires, en respectant la structure suivante :

{
  "name": "fetch_data",
  "arguments": {"ticker": "TSLA"}
}
Utilise bien un formatage JSON et pas de XML sinon ta réponse sera rejetée. Ajout TOUJOURS un texte d'explication d'une ou deux phrases de ton raisonnement avant l'appel de l'outil, pour expliquer pourquoi tu l'appelles.

Si l'utilisateur te demande à quoi tu sers, ce que tu sais faire, ou toute autre demande similaire, tu n'utiliseras **AUCUN OUTIL**.
Tu expliqueras clairement, et de manière exhaustive tes fonctionnalités, et en donnant des exemples.
---

**Séquence d'analyse complète (Actions Américaines Uniquement)**
Quand un utilisateur te demande une analyse complète, tu DOIS appeler TOUS les outils nécessaires EN UNE SEULE FOIS. :
1.  `search_ticker` UNIQUEMENT si tu ne connais vraiment pas le ticker d'une entreprise bien connue.
2.  `fetch_data` avec le ticker (que tu connais directement ou que tu as trouvé).
3.  `preprocess_data` pour nettoyer les données.
4.  `analyze_risks` pour obtenir un verdict.

**IMPORTANT : Pour une analyse complète, tu dois faire PLUSIEURS appels d'outils dans la même réponse.** Par exemple, si l'utilisateur demande "Analyse AAPL", tu dois appeler fetch_data, preprocess_data ET analyze_risks dans la même réponse, sans attendre de retour entre chaque outil.

Ta tâche est considérée comme terminée après l'appel à `analyze_risks`. La réponse finale avec le graphique sera générée automatiquement.
Exemples de demandes devant déclencher une analyse complète : 
* "Analyse Tesla"
* "Tu peux m'analyser Apple"
* "Quels risques d'investissement pour McDonald's ?"

**IDENTIFICATION DU TICKER - RÈGLE STRICTE** 
**TU CONNAIS DÉJÀ LES TICKERS DES ENTREPRISES PRINCIPALES :**
- Apple = AAPL, Microsoft = MSFT, Google/Alphabet = GOOGL, Amazon = AMZN, Tesla = TSLA, Meta = META
- Netflix = NFLX, Nvidia = NVDA, Coca-Cola = KO, McDonald's = MCD, Disney = DIS, Nike = NKE
- Bank of America = BAC, JPMorgan = JPM, Goldman Sachs = GS, American Express = AXP
- Boeing = BA, General Electric = GE, Ford = F, General Motors = GM
- Et TOUTES les entreprises du Fortune 500 et les grandes entreprises internationales

**UTILISE DIRECTEMENT les tickers que tu connais.** N'utilise `search_ticker` QUE pour des entreprises vraiment obscures ou régionales que tu ne connais pas du tout.

**Actions européennes courantes :**
- ASML = ASML, LVMH = MC.PA, Airbus = AIR.PA, L'Oréal = OR.PA, Sanofi = SAN.PA
- Nestlé = NESN.SW, TSMC = TSM, Samsung = 005930.KS

**Analyse et Visualisation Dynamique (Actions Américaines Uniquement) :**
Quand un utilisateur te demande de "montrer", "visualiser" des métriques spécifiques (par exemple, "montre-moi l'évolution du ROE"), tu DOIS appeler TOUS les outils nécessaires EN UNE SEULE FOIS :
1.  Appelle `fetch_data`.
2.  Appelle `preprocess_data`.
3.  Appelle `create_dynamic_chart`.

**IMPORTANT : Tu dois faire ces TROIS appels d'outils dans la même réponse**, sans attendre de retour entre chaque outil.

**Analyse Comparative :**
Quand l'utilisateur demande de comparer plusieurs entreprises (ex: "compare le ROE de Google et Apple" ou "performance de l'action de MSFT vs GOOGL"), tu DOIS :
1.  **Identifier le type de comparaison :**
    *   Si la métrique est 'price' (prix, cours, performance de l'action), c'est une **comparaison de PRIX**. Elle fonctionne pour TOUTES les actions.
    *   Si la métrique est fondamentale (ROE, dette, marketCap, etc.), c'est une **comparaison FONDAMENTALE**. Elle ne fonctionne que pour les actions AMÉRICAINES. Si l'une des actions n'est pas américaine, tu dois refuser la comparaison et expliquer pourquoi, en proposant de comparer leur prix à la place.
2.  Si les tickers ne sont pas donnés, utilise directement les tickers des entreprises connues. N'utilise `search_ticker` QUE pour des entreprises vraiment inconnues.
3.  Utilise l'outil `compare_stocks` en conséquence :
    *   Pour une comparaison **fondamentale** (américaine uniquement) : `comparison_type='fundamental'`, `metric='roe'` (par exemple).
    *   Pour une comparaison de **prix** (mondiale) : `comparison_type='price'`, `metric='price'`.

**AFFICHAGE DE DONNEES** 
Si l'utilisateur te demande d'afficher des données, tu dois appeler TOUS les outils nécessaires EN UNE SEULE FOIS :
* Vérifier si l'entreprise est américaine ou internationale. Répondre en rappelant tes limites si l'entreprise n'est pas américaine. 
* Si des données ne sont pas disponibles dans le contexte, tu dois appeler `fetch_data` ET ENSUITE `display_raw_data` ou `display_processed_data` dans la même réponse.
* Si des données sont déjà disponibles, appelle directement l'outil d'affichage approprié.

**IMPORTANT : Pour afficher des données traitées, tu dois faire fetch_data, preprocess_data ET display_processed_data dans la même réponse** si les données ne sont pas déjà disponibles.

Tu dois bien comprendre que tu ne dois jamais afficher les données brutes ou traitées sans utiliser ces outils, car ils formatent correctement les données pour l'affichage.
Exemples : 
* "Affiche les données brutes de Tesla" -> `fetch_data` + `display_raw_data` (en une fois)
* "Affiche les données traitées d'Apple" -> `fetch_data` + `preprocess_data` + `display_processed_data` (en une fois)
* "Montre-moi les données" -> `display_raw_data` (si données déjà disponibles)
* "Tableau des données" -> `display_raw_data` (si données déjà disponibles)

**DEMANDES LIEES AU PROJET OPA**
Tu as accès au document de recherche interne l'équipe qui t'a créée via l'outil `query_research`.
Ton but est d'essayer de répondre au maximum à des questions qui pourraient être en lien avec le projet OPA, ou avec ta création.
Lorsqu'une question est posée sur le projet (créateurs, fonctionnement, méthodologie, conclusion, ta stack technique, etc), tu DOIS TOUJOURS utiliser l'outil `query_research` pour obtenir des informations pertinentes.
Le contexte seul ne suffit pas, car il n'est pas toujours à jour ou complet. APPELLE TOUJOURS CET OUTIL AVANT DE REPONDRE A UNE QUESTION CONCERNANT LE PROJET.
Utilise cet outil quand l'utilisateur:
* De manière général, pose n'importe quelle question concernant le contexte du projet.
* Demande comment tu as été créée.
* Pose des questions sur les méthodologies, analyses ou conclusions de recherche de l'équipe, ou toute autre information concernant le projet dans lequel tu as été créée.

**Gestion des Questions de Suivi (Très Important !)**

**TU DOIS TOUJOURS UTILISER DES TOOL CALLS POUR LES DEMANDES DE SUIVI !** Ne réponds jamais par du texte seul si l'utilisateur demande d'ajouter, modifier ou analyser quelque chose.

*   **Si je montre un graphique et que l'utilisateur dit "ajoute Meta", "et pour [nouveau ticker] ?" ou "rajoute [ticker]"**: Tu DOIS appeler `compare_stocks` avec la liste des tickers précédents PLUS le nouveau ticker.
    *Ex: Après un graphique de `['AAPL', 'GOOG']`, si l'utilisateur dit "ajoute Meta", tu DOIS appeler `compare_stocks(tickers=['AAPL', 'GOOG', 'META'], metric='price', comparison_type='price')`.*

*   **Si l'utilisateur demande d'analyser une nouvelle action après en avoir analysé une autre**: Tu DOIS faire une nouvelle analyse complète avec les outils appropriés (`fetch_data`, `preprocess_data`, `analyze_risks`).
    *Ex: Après "analyse Tesla", si l'utilisateur dit "analyse Apple", tu DOIS appeler tous les outils nécessaires pour Apple.*

*   **Si l'utilisateur demande de changer la période**: Tu DOIS refaire le dernier graphique avec la nouvelle période.
    *Ex: Après un graphique sur 1 an, si l'utilisateur dit "montre sur 5 ans", tu DOIS rappeler le même outil avec `period_days=1260`.*

*   **Pour le NASDAQ 100**: Utilise le ticker de l'ETF `QQQ`. Pour le S&P 500, utilise `SPY`. Si l'utilisateur mentionne un indice, ajoute son ticker à la liste pour la comparaison de prix.

**RÈGLE CRUCIALE POUR LES DEMANDES DE SUIVI :**
Si l'utilisateur fait une demande qui nécessite des données ou des outils (ajouter un ticker, faire une nouvelle analyse, changer une période, etc.), tu DOIS TOUJOURS utiliser les tool calls appropriés. Ne fournis JAMAIS une réponse textuelle seule pour ces demandes.

Lorsuqe tu écris un ticker ou ton nom Stella, entoure le toujours de backticks (``) pour le mettre en valeur. (ex: `AAPL`).
Tu dois toujours répondre en français, tutoyer ton interlocuteur, adopter un ton joyeux, ajoute toujours une pointe d'humour dans tes messages.
Fais TOUJOURS référence à **Stella comme toi même**. 
Fais attention au formatage de tes réponses, à toujours bien placer des balises markdown, afin de structurer tes réponses et les rendre agréables à lire.
"""

# --- Définition des noeuds du Graph ---

# Noeud 1 : agent_node, point d'entrée et appel du LLM 
def agent_node(state: AgentState):
    """Le 'cerveau' de l'agent. Décide du prochain outil à appeler."""
    print("\n--- AGENT: Décision de la prochaine étape... ---")

    # On commence par le prompt système pour donner le rôle
    current_messages = [SystemMessage(content=system_prompt)]
    
    # --- INJECTION DE CONTEXTE DYNAMIQUE ---
    context_parts = []
    
    # Contexte des données disponibles
    data_to_inspect_json = state.get("processed_df_json") or state.get("fetched_df_json")
    if data_to_inspect_json:
        try:
            df = pd.read_json(StringIO(data_to_inspect_json), orient='split')
            available_columns = df.columns.tolist()
            context_parts.append(f"Des données sont disponibles avec les colonnes : {available_columns}")
        except Exception as e:
            print(f"Avertissement: Impossible d'injecter le contexte des colonnes. Erreur: {e}")
    
    # Contexte des tickers dans une comparaison en cours
    current_tickers = state.get("tickers")
    if current_tickers and len(current_tickers) > 1:
        context_parts.append(f"COMPARAISON EN COURS : {current_tickers}")
        
        # Déterminer le type de comparaison basé sur le dernier message d'outil
        last_tool_call = None
        for msg in reversed(state['messages']):
            if isinstance(msg, AIMessage) and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    if tool_call['name'] == 'compare_stocks':
                        last_tool_call = tool_call
                        break
                if last_tool_call:
                    break
        
        if last_tool_call:
            comparison_type = last_tool_call['args'].get('comparison_type', 'price')
            metric = last_tool_call['args'].get('metric', 'price')
            period_days = last_tool_call['args'].get('period_days', 252)
            
            context_parts.append(f"Type de comparaison actuelle : {comparison_type}")
            context_parts.append(f"Métrique comparée : {metric}")
            if comparison_type == 'price':
                context_parts.append(f"Période : {period_days} jours")
            
            context_parts.append(f"""RÈGLES POUR LES DEMANDES DE SUIVI :
- Si l'utilisateur dit "ajoute [ticker]" ou "rajoute [ticker]" : utilise compare_stocks avec tickers={current_tickers + ['NOUVEAU_TICKER']}, metric='{metric}', comparison_type='{comparison_type}'
- Si l'utilisateur change la période : utilise compare_stocks avec les mêmes tickers et metric='{metric}', comparison_type='{comparison_type}', mais période différente
- Si l'utilisateur change la métrique : utilise compare_stocks avec les mêmes tickers mais nouvelle métrique et bon comparison_type""")
    
    # Contexte du ticker principal pour analyses individuelles
    current_ticker = state.get("ticker")
    if current_ticker and not current_tickers:
        context_parts.append(f"ANALYSE INDIVIDUELLE EN COURS : {current_ticker}")
        context_parts.append(f"Si l'utilisateur demande d'analyser un nouveau ticker, tu DOIS faire une nouvelle analyse complète avec fetch_data, preprocess_data, analyze_risks.")
    
    if context_parts:
        context_message = SystemMessage(
            content=(
                f"\n\n--- CONTEXTE ACTUEL ---\n"
                + "\n".join(context_parts) +
                f"\n---------------------------------\n"
            )
        )
        current_messages.append(context_message)

    # On ajoute l'historique de la conversation depuis l'état
    current_messages.extend(state['messages'])

    # 🕐 TIMING: Start measuring LLM inference time
    import time
    llm_start_time = time.time()
    print(f"⏱️  [LLM] Starting inference call to {OPENROUTER_MODEL}...")
    
    # On invoque le LLM avec la liste de messages complète
    # Cette liste est locale et ne modifie pas l'état directement
    response = llm.bind_tools(available_tools).invoke(current_messages)
    
    # 🕐 TIMING: End measuring LLM inference time
    llm_end_time = time.time()
    llm_duration = llm_end_time - llm_start_time
    print(f"⏱️  [LLM] Inference completed in {llm_duration:.2f} seconds")
    
    print(f"response.content: {response.content}")
    return {"messages": [response]}

# Noeud 2 : execute_tool_node, exécute les outils en se basant sur la décision de l'agent_node (Noeud 1).
def execute_tool_node(state: AgentState):
    """Le "pont" qui exécute la logique réelle et met à jour l'état."""
    print("\n--- OUTILS: Exécution d'un outil ---")
    action_message = next((msg for msg in reversed(state['messages']) if isinstance(msg, AIMessage) and msg.tool_calls), None)
    if not action_message:
        raise ValueError("Aucun appel d'outil trouvé dans le dernier AIMessage.")

    tool_outputs = []
    current_state_updates = {}
    
    # Create a working copy of state that gets updated as we execute tools
    working_state = state.copy()
    
    # On gère le cas où plusieurs outils sont appelés, bien que ce soit rare ici.
    for tool_call in action_message.tool_calls:
        tool_name = tool_call['name']
        tool_args = tool_call['args']
        tool_id = tool_call['id']
        print(f"Le LLM a décidé d'appeler le tool : {tool_name} - avec les arguments : {tool_args}")
        
        # 🕐 TIMING: Start measuring tool execution time
        import time
        tool_start_time = time.time()
        print(f"⏱️  [TOOL] Starting execution of '{tool_name}'...")

        try:
            if tool_name == "search_ticker":
                company_name = tool_args.get("company_name")
                ticker = _search_ticker_logic(company_name=company_name)
                # On stocke le ticker ET le nom de l'entreprise
                current_state_updates["ticker"] = ticker
                current_state_updates["company_name"] = company_name 
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=f"[Ticker `{ticker}` trouvé.]"))

            elif tool_name == "fetch_data":
                try:
                    output_df = _fetch_data_logic(ticker=tool_args.get("ticker"))
                    current_state_updates["fetched_df_json"] = output_df.to_json(orient='split')
                    current_state_updates["ticker"] = tool_args.get("ticker")
                    # Update working state immediately for next tool
                    working_state["fetched_df_json"] = current_state_updates["fetched_df_json"]
                    working_state["ticker"] = current_state_updates["ticker"]
                    tool_outputs.append(ToolMessage(tool_call_id=tool_id, content="[Données récupérées avec succès.]"))
                except APILimitError as e:
                    user_friendly_error = "Désolé, il semble que j'aie un problème d'accès à mon fournisseur de données. Peux-tu réessayer plus tard ?"
                    tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=json.dumps({"error": user_friendly_error})))
                    current_state_updates["error"] = user_friendly_error
            
            elif tool_name == "get_stock_news":
                
                # 1. On cherche le ticker dans les arguments fournis par le LLM, SINON dans l'état.
                ticker = tool_args.get("ticker") or state.get("ticker")
                
                # 2. Si après tout ça, on n'a toujours pas de ticker, c'est une vraie erreur.
                if not ticker:
                    raise ValueError("Impossible de déterminer un ticker pour chercher les nouvelles, ni dans la commande, ni dans le contexte.")
                
                # 3. On fait pareil pour le nom de l'entreprise (qui est optionnel mais utile)
                # On utilise le ticker comme nom si on n'a rien d'autre.
                company_name = tool_args.get("company_name") or state.get("company_name") or ticker
                
                # 4. On appelle la logique avec les bonnes informations.
                news_summary = _fetch_recent_news_logic(
                    ticker=ticker, 
                    company_name=company_name
                )

                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=news_summary))
                
            elif tool_name == "preprocess_data":
                # Check working state first, then fall back to original state
                fetched_df_json = current_state_updates.get("fetched_df_json") or working_state.get("fetched_df_json")
                if not fetched_df_json:
                    raise ValueError("Impossible de prétraiter les données car elles n'ont pas encore été récupérées.")
                fetched_df = pd.read_json(StringIO(fetched_df_json), orient='split')
                output = _preprocess_data_logic(df=fetched_df)
                current_state_updates["processed_df_json"] = output.to_json(orient='split')
                # Update working state immediately for next tool
                working_state["processed_df_json"] = current_state_updates["processed_df_json"]
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content="[Données prétraitées avec succès.]"))

            elif tool_name == "analyze_risks":
                # Check working state first, then fall back to original state  
                processed_df_json = current_state_updates.get("processed_df_json") or working_state.get("processed_df_json")
                if not processed_df_json:
                    raise ValueError("Impossible de faire une prédiction car les données n'ont pas encore été prétraitées.")
                processed_df = pd.read_json(StringIO(processed_df_json), orient='split')
                output = _analyze_risks_logic(processed_data=processed_df)
                current_state_updates["analysis"] = output
                # Update working state immediately for potential next tool
                working_state["analysis"] = current_state_updates["analysis"]
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=output))
            
            elif tool_name == "create_dynamic_chart":
                # Check working state first for data access in tool chains
                data_json_for_chart = (
                    current_state_updates.get("processed_df_json") or 
                    working_state.get("processed_df_json") or 
                    current_state_updates.get("fetched_df_json") or 
                    working_state.get("fetched_df_json")
                )
                if not data_json_for_chart:
                    raise ValueError("Aucune donnée disponible pour créer un graphique.")
                
                # On convertit le JSON en DataFrame
                df_for_chart = pd.read_json(StringIO(data_json_for_chart), orient='split')
                
                chart_json = _create_dynamic_chart_logic(
                    data=df_for_chart,  # <--- Le DataFrame est passé directement
                    chart_type=tool_args.get('chart_type'),
                    x_column=tool_args.get('x_column'),
                    y_column=tool_args.get('y_column'),
                    title=tool_args.get('title'),
                    color_column=tool_args.get('color_column')
                )
                
                
                if "Erreur" in chart_json:
                    raise ValueError(chart_json) # Transforme l'erreur de l'outil en exception
                
                current_state_updates["plotly_json"] = chart_json
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content="[Graphique interactif créé.]"))

            elif tool_name in ["display_raw_data", "display_processed_data"]:
                # Vérifie la disponibilité des données en tenant compte de la chaîne d'outils en cours
                if tool_name == "display_raw_data":
                    df_json = (
                        current_state_updates.get("fetched_df_json") or
                        working_state.get("fetched_df_json") or
                        state.get("fetched_df_json")
                    )
                else:  # display_processed_data
                    df_json = (
                        current_state_updates.get("processed_df_json") or
                        working_state.get("processed_df_json") or
                        state.get("processed_df_json")
                    )

                if not df_json:
                    raise ValueError("Aucune donnée disponible à afficher.")

                # Rien à renvoyer ici, on laisse le noeud prepare_data_display attacher le bon DataFrame
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content="[Préparation de l'affichage des données.]"))

            elif tool_name == "get_company_profile":
                ticker = tool_args.get("ticker")
                profile_json = _fetch_profile_logic(ticker=ticker)
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=profile_json))
            
            elif tool_name == "display_price_chart":
                ticker = tool_args.get("ticker")
                period = tool_args.get("period_days", 252) # Utilise la valeur par défaut si non fournie
                
                # On appelle notre logique pour récupérer les données de prix
                price_df = _fetch_price_history_logic(ticker=ticker, period_days=period)
                
                # On crée le graphique directement ici
                fig = px.line(
                    price_df, 
                    x=price_df.index, 
                    y='close', 
                    title=f"Historique du cours de `{ticker.upper()}` sur {period} jours",
                    color_discrete_sequence=stella_theme['colors']

                )
                fig.update_layout(
                    template=stella_theme['template'], 
                    font=stella_theme['font'], 
                    xaxis_title="Date", 
                    yaxis_title="Prix de clôture (USD)",
                    xaxis=stella_theme['axis_config'],
                    yaxis=stella_theme['axis_config'],
                    legend=dict(
                        bordercolor="rgba(0, 0, 0, 0)",  # Pas de bordure
                        borderwidth=0
                    )
                )
                
                # On convertit en JSON et on met à jour l'état
                chart_json = pio.to_json(fig)
                current_state_updates["plotly_json"] = chart_json
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content="[Graphique de prix créé avec succès.]"))

            elif tool_name == "compare_stocks":
                tickers = tool_args.get("tickers")
                metric = tool_args.get("metric")
                comparison_type = tool_args.get("comparison_type", "fundamental")

                if comparison_type == 'fundamental':
                    # On appelle la fonction qui retourne l'historique
                    comp_df = _compare_fundamental_metrics_logic(tickers=tickers, metric=metric)
                    fig = px.line(
                        comp_df,
                        x=comp_df.index,
                        y=comp_df.columns,
                        title=f"Évolution de la métrique '{metric.upper()}'",
                        labels={'value': metric.upper(), 'variable': 'Ticker', 'calendarYear': 'Année'},
                        markers=True, # Les marqueurs sont utiles pour voir les points de données annuels
                        color_discrete_sequence=stella_theme['colors']  # Utilise la palette de couleurs Stella
                    )
                elif comparison_type == 'price':
                    # La logique pour le prix ne change pas, elle est déjà une évolution
                    period = tool_args.get("period_days", 252)
                    comp_df = _compare_price_histories_logic(tickers=tickers, period_days=period)
                    fig = px.line(
                        comp_df,
                        title=f"Comparaison de la performance des actions (Base 100)",
                        labels={'value': 'Performance Normalisée (Base 100)', 'variable': 'Ticker', 'index': 'Date'},
                        color_discrete_sequence=stella_theme['colors']
                    )
                else:
                    raise ValueError(f"Type de comparaison inconnu: {comparison_type}")

                # Le reste du code est commun et ne change pas
                fig.update_layout(
                    template="plotly_white",
                    xaxis=stella_theme['axis_config'],
                    yaxis=stella_theme['axis_config'],
                    legend=dict(
                        bordercolor="rgba(0, 0, 0, 0)",  # Pas de bordure
                        borderwidth=0
                    )
                )
                chart_json = pio.to_json(fig)
                current_state_updates["plotly_json"] = chart_json
                current_state_updates["tickers"] = tickers
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content="[Graphique de comparaison créé.]"))
            
            elif tool_name == "query_research":
                query = tool_args.get("query")
                # Lazy import to avoid initialization delays
                from src.pdf_research import query_research_document as _query_research_document_logic
                research_result = _query_research_document_logic(query=query)
                tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=research_result))
            
        except Exception as e:
            # Bloc de capture générique pour toutes les autres erreurs
            error_msg = f"Erreur lors de l'exécution de l'outil '{tool_name}': {repr(e)}"
            tool_outputs.append(ToolMessage(tool_call_id=tool_id, content=f"[ERREUR: {error_msg}]"))
            current_state_updates["error"] = error_msg
            print(error_msg)
        
        # 🕐 TIMING: End measuring tool execution time
        tool_end_time = time.time()
        tool_duration = tool_end_time - tool_start_time
        print(f"⏱️  [TOOL] '{tool_name}' completed in {tool_duration:.2f} seconds")
            
    current_state_updates["messages"] = tool_outputs
    return current_state_updates

# Noeud 3 : generate_final_response_node, synthétise la réponse finale à partir de l'état.
def generate_final_response_node(state: AgentState):
    """
    Génère la réponse textuelle finale ET le graphique Plotly par défaut après une analyse complète.
    Ce noeud est le point de sortie pour une analyse de prédiction.
    """
    print("\n--- AGENT: Génération de la réponse finale et du graphique ---")
    
    # --- 1. Récupération des informations de l'état ---
    ticker = state.get("ticker", "l'action")
    analysis_result = state.get("analysis", "inconnu")
    processed_df_json = state.get("processed_df_json")

    # --- 2. Construction de la réponse textuelle ---
    response_content = ""
    latest_year_str = "récentes"
    next_year_str = "prochaine"
    
    if processed_df_json:
        try:
            df = pd.read_json(StringIO(processed_df_json), orient='split')
            if not df.empty and 'calendarYear' in df.columns:
                latest_year_str = df['calendarYear'].iloc[-1]
                next_year_str = str(int(latest_year_str) + 1)
        except Exception as e:
            print(f"Avertissement : Impossible d'extraire l'année des données : {e}")

    # Logique de la réponse textuelle basée sur la prédiction
    if analysis_result == "Risque Élevé Détecté":
        response_content = (
            f"⚠️ **Attention !** Pour l'action `{ticker.upper()}`, en se basant sur les données de `{latest_year_str}`(dernières données disponibles), mon analyse a détecté des signaux indiquant un **risque élevé de sous-performance pour l'année à venir (`{next_year_str}`)**.\n\n"
            "Mon modèle est particulièrement confiant dans cette évaluation. Je te conseille la plus grande prudence."
        )
    elif analysis_result == "Aucun Risque Extrême Détecté":
        response_content = (
            f"Pour l'action `{ticker.upper()}`, en se basant sur les données de `{latest_year_str}`(dernières données disponibles), mon analyse n'a **pas détecté de signaux de danger extrême pour l'année à venir (`{next_year_str}`)**.\n\n"
            "**Important :** Cela ne signifie pas que c'est un bon investissement. Cela veut simplement dire que mon modèle, spécialisé dans la détection de signaux très négatifs, n'en a pas trouvé ici. Mon rôle est de t'aider à éviter une erreur évidente, pas de te garantir un succès."
        )
    else:
        response_content = f"L'analyse des données pour `{ticker.upper()}` a été effectuée, mais le résultat de la prédiction n'a pas pu être interprété."

    # --- 3. Création du graphique de synthèse ---
    chart_json = None
    explanation_text = None 
    if processed_df_json:
        try:
            df = pd.read_json(StringIO(processed_df_json), orient='split')
            # Les colonnes dont nous avons besoin pour ce nouveau graphique
            metrics_to_plot = ['calendarYear', 'revenuePerShare_YoY_Growth', 'earningsYield']
            
            # On s'assure que les colonnes existent
            plot_cols = [col for col in metrics_to_plot if col in df.columns]
            
            if not df.empty and all(col in plot_cols for col in metrics_to_plot):
                chart_title = f"Analyse Croissance vs. Valorisation pour {ticker.upper()}"
                
                # Créer la figure de base
                fig = go.Figure()

                # 1. Ajouter les barres de Croissance du CA (% YoY) sur l'axe Y1
                fig.add_trace(go.Scatter(
                    x=df['calendarYear'],
                    y=df['revenuePerShare_YoY_Growth'],
                    name='Croissance (%)',
                    mode='lines+markers', # On spécifie le mode ligne avec marqueurs
                    line=dict(color=stella_theme['colors'][1]), # On utilise 'line' pour la couleur
                    yaxis='y1'
                ))

                # 2. Ajouter la ligne de Valorisation (Earnings Yield) sur l'axe Y2
                fig.add_trace(go.Scatter(
                    x=df['calendarYear'],
                    y=df['earningsYield'],
                    name='Valorisation',
                    mode='lines+markers',
                    line=dict(color=stella_theme['colors'][0]), # Bleu Stella
                    yaxis='y2'
                ))
                
                # Ajouter une ligne à zéro pour mieux visualiser la croissance positive/négative
                fig.add_hline(y=0, line_width=1, line_dash="dash", line_color="black", yref="y1")

                # 3. Configurer les axes et le layout
                fig.update_layout(
                    title_text=chart_title,
                    template=stella_theme['template'],
                    font=stella_theme['font'],
                    **stella_theme['layout_defaults'],  # Applique les paramètres glassmorphism
                    margin=dict(r=320),
                    xaxis=dict(
                        title='Année',
                        type='category', # Force l'axe à traiter les années comme des étiquettes uniques
                        **stella_theme['axis_config']  # Applique la configuration d'axes noirs
                    ),
                    yaxis=dict(
                        title=dict(
                            text='Croissance Annuelle du CA',
                            font=dict(color=stella_theme['colors'][1])
                        ),
                        tickfont=dict(color=stella_theme['colors'][1]),
                        ticksuffix=' %',
                        **stella_theme['axis_config']  # Applique la configuration d'axes noirs
                    ),
                    yaxis2=dict(
                        title=dict(
                            text='Rendement bénéficiaire',
                            font=dict(color=stella_theme['colors'][0]) 
                        ),
                        tickfont=dict(color=stella_theme['colors'][0]),
                        anchor='x',
                        overlaying='y',
                        side='right',
                        tickformat='.2%',
                        **stella_theme['axis_config']  # Applique la configuration d'axes noirs
                    ),
                    legend=dict(
                        orientation="v",
                        yanchor="top",
                        y=1, # On aligne le haut de la légende avec le haut du graphique
                        xanchor="left",
                        x=1.40, # On pousse la légende un peu plus à droite
                        bordercolor="rgba(0, 0, 0, 0)", # Pas de bordure
                        borderwidth=0,
                        title_text="Légende"
                    )
                )
                
                chart_json = pio.to_json(fig)
                response_content += f"\n\n**Voici une visualisation de sa croissance par rapport à sa valorisation :**"
            else:
                response_content += "\n\n(Impossible de générer le graphique de synthèse Croissance/Valorisation : données ou colonnes manquantes)."

        except Exception as e:
            print(f"Erreur lors de la création du graphique par défaut : {e}")
            response_content += "\n\n(Je n'ai pas pu générer le graphique associé en raison d'une erreur.)"
    
    # --- 4. Création du message final ---
    final_message = AIMessage(content=response_content)
    if chart_json:
        # On attache le graphique au message
        setattr(final_message, 'plotly_json', chart_json)

    return {"messages": [final_message]}

# Noeud 4 : cleanup_state_node, nettoie l'état pour éviter de stocker des données lourdes.
def cleanup_state_node(state: AgentState):
    """
    Nettoie l'état pour la prochaine interaction.
    Il efface les données spécifiques à la dernière réponse (prédiction, graphique)
    mais GARDE le contexte principal (données brutes et traitées, ticker)
    pour permettre des questions de suivi.
    """
    print("\n--- SYSTEM: Nettoyage partiel de l'état avant la sauvegarde ---")
    
    # On garde : 'ticker', 'tickers', 'company_name', 'fetched_df_json', 'processed_df_json'
    # On supprime (réinitialise) :
    return {
        "analysis": "",   # Efface la prédiction précédente
        "plotly_json": "",  # Efface le graphique précédent
        "error": ""         # Efface toute erreur précédente
    }

# Noeuds supplémentaires de préparation pour l'affichage des données, graphiques, actualités et profil d'entreprise.
def prepare_data_display_node(state: AgentState):
    """Prépare un AIMessage avec un DataFrame spécifique attaché."""
    print("\n--- AGENT: Préparation du DataFrame pour l'affichage ---")
    
    tool_name_called = next(msg for msg in reversed(state['messages']) if isinstance(msg, AIMessage) and msg.tool_calls).tool_calls[-1]['name']

    if tool_name_called == "display_processed_data" and state.get("processed_df_json"):
        df_json = state["processed_df_json"]
        message_content = "Voici les données **pré-traitées** que tu as demandées :"
    elif tool_name_called == "display_raw_data" and state.get("fetched_df_json"):
        df_json = state["fetched_df_json"]
        message_content = "Voici les données **brutes** que tu as demandées :"
    else:
        final_message = AIMessage(content="Désolé, les données demandées ne sont pas disponibles.")
        return {"messages": [final_message]}

    final_message = AIMessage(content=message_content)
    setattr(final_message, 'dataframe_json', df_json)
    return {"messages": [final_message]}

def prepare_chart_display_node(state: AgentState):
    """Prépare un AIMessage avec le graphique Plotly demandé par l'utilisateur."""
    print("\n--- AGENT: Préparation du graphique pour l'affichage ---")
    
    # Laisse le LLM générer une courte phrase d'introduction
    response = ("**Voici le graphique demandé :** ")
    
    final_message = AIMessage(content=response)
    setattr(final_message, 'plotly_json', state["plotly_json"])
    
    return {"messages": [final_message]}

def prepare_news_display_node(state: AgentState):
    """Prépare un AIMessage avec les actualités formatées pour l'affichage."""
    print("\n--- AGENT: Préparation de l'affichage des actualités ---")
    
    # 1. Retrouver le ToolMessage qui contient le résultat des actualités
    # On cherche le dernier message de type ToolMessage dans l'historique
    tool_message = next((msg for msg in reversed(state['messages']) if isinstance(msg, ToolMessage)), None)
    
    if not tool_message or not tool_message.content:
        final_message = AIMessage(content="Désolé, je n'ai pas pu récupérer les actualités.")
        return {"messages": [final_message]}

    # 2. Préparer le contenu textuel de la réponse
    ticker = state.get("ticker", "l'entreprise")
    company_name = state.get("company_name", ticker)
    
    # Éviter la duplication si company_name et ticker sont identiques ou si on utilise les valeurs par défaut
    if company_name.lower() == ticker.lower() or ticker == "l'entreprise":
        response_content = f"**Voici les dernières actualités que j'ai trouvées pour {company_name.title()}** :"
    else:
        response_content = f"**Voici les dernières actualités que j'ai trouvées pour {company_name.title()} ({ticker.upper()})** :"
    
    final_message = AIMessage(content=response_content)
    
    # 3. Attacher le JSON des actualités au message final
    # Le front-end (Streamlit) utilisera cet attribut pour afficher les articles
    setattr(final_message, 'news_json', tool_message.content)
    
    return {"messages": [final_message]}

def prepare_profile_display_node(state: AgentState):
    """Prépare un AIMessage avec le profil de l'entreprise pour l'affichage."""
    print("\n--- AGENT: Préparation de l'affichage du profil d'entreprise ---")
    
    tool_message = next((msg for msg in reversed(state['messages']) if isinstance(msg, ToolMessage)), None)
    
    if not tool_message or not tool_message.content:
        final_message = AIMessage(content="Désolé, je n'ai pas pu récupérer le profil de l'entreprise.")
        return {"messages": [final_message]}

    prompt = f"""
    Voici les informations de profil pour une entreprise au format JSON :
    {tool_message.content}
    **INFORMATION CRUCIALE :**
    TU DOIS rédiger une réponse formatée en markdown pour présenter ces informations à l'utilisateur.
    Rédige une réponse la plus exhaustive et agréable possible pour présenter ces informations à l'utilisateur.
    Mets en avant le nom de l'entreprise, son secteur et son CEO, mais n'omet aucune information qui n'est pas null dans le JSON.
    Tu n'afficheras pas l'image du logo, l'UI s'en chargera, et tu n'as pas besoin de la mentionner.
    Présente les informations de manière sobre en listant les points du JSON.
    Si il y a un champ null, TU DOIS TOUJOURS le compléter via tes connaissances, sans inventer de données.
    Si tu ne trouves pas d'informations, indique simplement "Inconnu" ou "Non disponible".
    Termine en donnant le lien vers leur site web.
    """
    response = llm.invoke(prompt)
    print(f"response.content: {response.content}")
    final_message = AIMessage(content=response.content)
    
    # On attache le JSON pour que le front-end puisse afficher l'image du logo !
    setattr(final_message, 'profile_json', tool_message.content)
    
    return {"messages": [final_message]}

# Noeud de gestion des erreurs
def handle_error_node(state: AgentState):
    """
    Génère un message d'erreur clair pour l'utilisateur, puis prépare le nettoyage de l'état.
    Ce noeud est appelé par le routeur chaque fois que le champ 'error' est rempli.
    """
    print("\n--- AGENT: Gestion de l'erreur... ---")
    error_message = state.get("error", "Une erreur inconnue est survenue.")
    
    # On crée une réponse claire et formatée pour l'utilisateur.
    user_facing_error = textwrap.dedent(f"""
        Désolé, une erreur est survenue et je n'ai pas pu terminer ta demande.
        
        **Détail de l'erreur :**
        ```
        {error_message}
        ```
        
        Peux-tu essayer de reformuler ta question ou tenter une autre action ?
    """)
    
    # On met cette réponse dans un AIMessage qui sera affiché dans le chat.
    # L'étape suivante sera le nettoyage de l'état.
    return {"messages": [AIMessage(content=user_facing_error)]}

# --- Router pour diriger le flux du graph ---
def router(state: AgentState) -> str:
    """Le routeur principal du graphe, version finale robuste avec support du tool chaining."""
    print("\n--- ROUTEUR: Évaluation de l'état pour choisir la prochaine étape ---")

    # On récupère les messages de l'état
    messages = state['messages']
    
    # Y a-t-il une erreur ? C'est la priorité absolue.
    if state.get("error"):
        print("Routeur -> Décision: Erreur détectée, passage au gestionnaire d'erreurs.")
        return "handle_error"

    # Le dernier message est-il une décision de l'IA d'appeler un outil ?
    last_message = messages[-1]

    if isinstance(last_message, AIMessage) and not last_message.tool_calls:
        print("Routeur -> Décision: L'IA a fourni une réponse textuelle. Fin du cycle.")
        return END
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        # C'est la première fois qu'on voit cette décision, on doit exécuter l'outil.
        print("Routeur -> Décision: Appel d'outil demandé, passage à execute_tool.")
        return "execute_tool"

    # Si le dernier message n'est PAS un appel à un outil, cela signifie probablement
    # qu'un outil vient de s'exécuter. Nous devons décider où aller ensuite.
    
    # On retrouve le dernier appel à un outil fait par l'IA
    ai_message_with_tool_call = next(
        (msg for msg in reversed(messages) if isinstance(msg, AIMessage) and msg.tool_calls),
        None
    )
    # S'il n'y en a pas, on ne peut rien faire de plus.
    if not ai_message_with_tool_call:
        print("Routeur -> Décision: Aucune action claire à prendre (pas d'appel d'outil trouvé), fin du processus.")
        return END
    
    # Check if there are multiple tool calls to execute in sequence
    remaining_tool_calls = ai_message_with_tool_call.tool_calls
    executed_tool_calls = [msg for msg in reversed(messages) if isinstance(msg, ToolMessage)]
    
    print(f"--- ROUTEUR: Nombre total d'outils à exécuter: {len(remaining_tool_calls)}, déjà exécutés: {len(executed_tool_calls)}")
    
    # If we still have tools to execute from the same AI message, continue executing them
    if len(executed_tool_calls) < len(remaining_tool_calls):
        next_tool_name = remaining_tool_calls[len(executed_tool_calls)]['name']
        print(f"Routeur -> Décision: Outil suivant dans la chaîne: '{next_tool_name}', continuer l'exécution.")
        return "execute_tool"
        
    # All tools from the current AI message have been executed, check the last executed tool
    tool_name = ai_message_with_tool_call.tool_calls[-1]['name']
    print(f"--- ROUTEUR: Tous les outils de la chaîne ont été exécutés, le dernier était '{tool_name}'. ---")

    # Maintenant, on décide de la suite en fonction du dernier outil de la chaîne.
    if tool_name == 'analyze_risks':
        return "generate_final_response"
    elif tool_name == 'compare_stocks': 
        return "prepare_chart_display"
    elif tool_name == 'display_price_chart':
        return "prepare_chart_display"
    elif tool_name in ['display_raw_data', 'display_processed_data']:
        return "prepare_data_display"
    elif tool_name == 'create_dynamic_chart':
        return "prepare_chart_display"
    elif tool_name == 'get_stock_news':
        return "prepare_news_display"
    elif tool_name == 'get_company_profile': 
        return "prepare_profile_display"
    else: # Pour search_ticker, fetch_data, preprocess_data, etc
        return "agent"
    
# --- CONSTRUCTION DU GRAPH ---
def get_agent_app():
    memory = MemorySaver()
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", agent_node)
    workflow.add_node("execute_tool", execute_tool_node)
    workflow.add_node("generate_final_response", generate_final_response_node)
    workflow.add_node("cleanup_state", cleanup_state_node)
    workflow.add_node("prepare_data_display", prepare_data_display_node) 
    workflow.add_node("prepare_chart_display", prepare_chart_display_node)
    workflow.add_node("prepare_news_display", prepare_news_display_node)
    workflow.add_node("prepare_profile_display", prepare_profile_display_node)
    workflow.add_node("handle_error", handle_error_node)

    workflow.set_entry_point("agent")

    workflow.add_conditional_edges("agent", router, {"execute_tool": "execute_tool", "handle_error": "handle_error", "__end__": END})
    workflow.add_conditional_edges(
        "execute_tool",
        router,
        {
            "agent": "agent", 
            "generate_final_response": "generate_final_response",
            "prepare_data_display": "prepare_data_display", 
            "prepare_chart_display": "prepare_chart_display",
            "prepare_news_display": "prepare_news_display", 
            "prepare_profile_display": "prepare_profile_display",
            "handle_error": "handle_error",
            "__end__": END
        }
    )

    workflow.add_edge("generate_final_response", "cleanup_state")
    workflow.add_edge("prepare_profile_display", "cleanup_state")
    workflow.add_edge("prepare_data_display", "cleanup_state")
    workflow.add_edge("prepare_chart_display", "cleanup_state")
    workflow.add_edge("prepare_news_display", "cleanup_state")
    workflow.add_edge("handle_error", "cleanup_state")
    workflow.add_edge("cleanup_state", END)

    app = workflow.compile(checkpointer=memory)

    try:
        graph = app.get_graph()
        image_bytes = graph.draw_mermaid_png()
        with open("agent_workflow.png", "wb") as f:
            f.write(image_bytes)
        
        print("\nVisualisation du graph sauvegardée dans le répertoire en tant que agent_workflow.png \n")

    except Exception as e:
        print(f"\nJe n'ai pas pu générer la visualisation. Lancez 'pip install playwright' et 'playwright install'. Erreur: {e}\n")
    
    return app

app = get_agent_app()


# --- Crée une animation du workflow ---
def get_langsmith_trace_data(thread_id: str):
    """
    Récupère les données de trace LangSmith pour la visualisation du graphique.
    Retourne les données structurées sans génération d'images.
    """
    print(f"\n{'='*80}")
    print(f"🔍 LANGSMITH TRACE DEBUG - Starting trace retrieval for: {thread_id}")
    print(f"{'='*80}")
    
    # STEP 1: Environment and configuration check
    print(f"\n📋 STEP 1: Environment Configuration Check")
    print(f"   LANGCHAIN_PROJECT: {os.environ.get('LANGCHAIN_PROJECT', '❌ NOT_SET')}")
    print(f"   LANGSMITH_API_KEY: {'✅ SET' if os.environ.get('LANGSMITH_API_KEY') else '❌ NOT_SET'}")
    print(f"   LANGCHAIN_TRACING_V2: {os.environ.get('LANGCHAIN_TRACING_V2', '❌ NOT_SET')}")
    print(f"   LANGCHAIN_ENDPOINT: {os.environ.get('LANGCHAIN_ENDPOINT', '❌ NOT_SET')}")
    
    # Check if tracing is enabled
    if os.environ.get('LANGCHAIN_TRACING_V2') != 'true':
        print(f"   ⚠️  WARNING: LANGCHAIN_TRACING_V2 is not set to 'true'")
        print(f"   This means LangSmith tracing might not be active!")
    
    try:
        # STEP 2: Initialize LangSmith client
        print(f"\n🔧 STEP 2: Initializing LangSmith Client")
        try:
            from langsmith import Client
            client = Client()
            print(f"   ✅ LangSmith client initialized successfully")
            
            # Test client connection
            try:
                # Try to get client info to test connection
                print(f"   🔗 Testing client connection...")
                client_info = client.info
                print(f"   ✅ Client connection test successful")
            except Exception as conn_test_error:
                print(f"   ⚠️  Client connection test failed: {conn_test_error}")
                print(f"   This might indicate API key or network issues")
                
        except ImportError as import_error:
            print(f"   ❌ Failed to import LangSmith Client: {import_error}")
            raise import_error
        except Exception as client_error:
            print(f"   ❌ Failed to initialize LangSmith client: {client_error}")
            raise client_error
        
        # STEP 3: Query runs with timeout protection
        print(f"\n🔍 STEP 3: Querying LangSmith Runs")
        print(f"   Thread ID: {thread_id}")
        print(f"   Project: {os.environ.get('LANGCHAIN_PROJECT', 'stella')}")
        
        # Note: Removed signal-based timeout as it doesn't work in threads
        # The API endpoint already has asyncio timeout protection
        
        all_runs = []
        try:
            print(f"   📡 Sending query to LangSmith API...")
            
            # Try different query approaches
            try:
                # Primary query by thread_id
                project_name = os.environ.get("LANGCHAIN_PROJECT", "stella")
                print(f"   Using project name: '{project_name}'")
                
                # Try querying by thread_id first (might not work with all LangSmith versions)
                try:
                    all_runs = list(client.list_runs(
                        project_name=project_name,
                        thread_id=thread_id,
                    ))
                    print(f"   ✅ Direct thread_id query completed. Found {len(all_runs)} runs")
                except Exception as thread_query_error:
                    print(f"   ⚠️  Direct thread_id query failed: {thread_query_error}")
                    print(f"   🔄 Falling back to manual filtering...")
                    
                    # Fallback: get all runs and filter manually
                    all_project_runs = list(client.list_runs(
                        project_name=project_name,
                        limit=100  # Get more runs for better chance of finding the thread
                    ))
                    
                    print(f"   📊 Retrieved {len(all_project_runs)} total runs from project")
                    
                    # Filter by thread_id manually
                    all_runs = []
                    for run in all_project_runs:
                        run_thread_id = None
                        
                        # Try multiple ways to get thread_id
                        if hasattr(run, 'thread_id') and run.thread_id:
                            run_thread_id = run.thread_id
                        elif hasattr(run, 'extra') and run.extra and 'thread_id' in run.extra:
                            run_thread_id = run.extra['thread_id']
                        elif hasattr(run, 'session_id') and run.session_id:
                            run_thread_id = run.session_id
                        
                        if run_thread_id == thread_id:
                            all_runs.append(run)
                    
                    print(f"   🎯 Manual filtering found {len(all_runs)} runs matching thread_id '{thread_id}'")
                
            except Exception as primary_query_error:
                print(f"   ❌ Primary query failed: {primary_query_error}")
                print(f"   🔄 Trying alternative query without thread_id filter...")
                
                # Fallback: query recent runs and filter manually
                try:
                    recent_runs = list(client.list_runs(
                        project_name=project_name,
                        limit=50  # Get recent runs
                    ))
                    all_runs = [run for run in recent_runs if run.thread_id == thread_id]
                    print(f"   ✅ Fallback query completed. Found {len(all_runs)} matching runs out of {len(recent_runs)} recent runs")
                    
                except Exception as fallback_error:
                    print(f"   ❌ Fallback query also failed: {fallback_error}")
                    raise fallback_error
            
        except Exception as query_error:
            print(f"   ❌ QUERY ERROR: {type(query_error).__name__}: {query_error}")
            import traceback
            print(f"   📋 Full traceback:")
            for line in traceback.format_exc().split('\n'):
                if line.strip():
                    print(f"      {line}")
            raise query_error
        finally:
            pass  # No signal cleanup needed

        # STEP 4: Analyze query results
        print(f"\n📊 STEP 4: Analyzing Query Results")
        if not all_runs:
            print(f"   ❌ No runs found for thread_id: {thread_id}")
            print(f"   🔍 Possible causes:")
            print(f"      1. The session hasn't been traced to LangSmith")
            print(f"      2. The project name doesn't match (current: {os.environ.get('LANGCHAIN_PROJECT', 'stella')})")
            print(f"      3. The API key doesn't have access to this project")
            print(f"      4. The thread_id is incorrect or doesn't exist")
            print(f"      5. Tracing is disabled (LANGCHAIN_TRACING_V2 != 'true')")
            
            # Try to list available sessions for debugging
            try:
                print(f"   🔍 Attempting to list recent sessions for debugging...")
                recent_runs = list(client.list_runs(
                    project_name=project_name,
                    limit=20
                ))
                if recent_runs:
                    unique_threads = set(run.thread_id for run in recent_runs if run.thread_id)
                    print(f"   📋 Found {len(unique_threads)} recent thread IDs:")
                    for i, tid in enumerate(list(unique_threads)[:10]):
                        print(f"      {i+1:2d}. {tid}")
                    
                    # Check if the requested thread_id is similar to any existing ones
                    print(f"   🔍 Looking for similar thread IDs to: {thread_id}")
                    for tid in unique_threads:
                        if thread_id in tid or tid in thread_id:
                            print(f"      ⚠️  Similar ID found: {tid}")
                        # Check if it's a UUID vs session format mismatch
                        if len(thread_id) == 36 and '-' in thread_id and tid.startswith('session_'):
                            print(f"      💡 UUID format requested but session format found: {tid}")
                        elif thread_id.startswith('session_') and len(tid) == 36 and '-' in tid:
                            print(f"      💡 Session format requested but UUID format found: {tid}")
                else:
                    print(f"   ❌ No recent runs found in project")
            except Exception as debug_error:
                print(f"   ⚠️  Could not list recent sessions: {debug_error}")
            
            return None

        print(f"   ✅ Found {len(all_runs)} runs total")
        print(f"   📋 Run details:")
        for i, run in enumerate(all_runs[:10]):  # Show first 10 runs
            status = "✅ completed" if run.end_time else "🔄 running"
            print(f"      {i+1:2d}. ID: {str(run.id)[:8]}... | Parent: {str(run.parent_run_id)[:8] + '...' if run.parent_run_id else 'None':12} | Name: {run.name:20} | Status: {status}")
        
        if len(all_runs) > 10:
            print(f"      ... and {len(all_runs) - 10} more runs")
        
        # STEP 5: Find main thread run
        print(f"\n🎯 STEP 5: Finding Main Thread Run")
        thread_run = next((r for r in all_runs if not r.parent_run_id), None)
        if not thread_run:
            print(f"   ❌ No main thread run found (all runs have parent_run_id)")
            print(f"   🔍 This is unexpected - there should be a root run without parent")
            print(f"   📋 All run parent relationships:")
            for i, run in enumerate(all_runs):
                print(f"      {i+1}. {run.name} -> parent: {run.parent_run_id}")
            return None

        print(f"   ✅ Found main thread run: {thread_run.id}")
        print(f"      Name: {thread_run.name}")
        print(f"      Start: {thread_run.start_time}")
        print(f"      End: {thread_run.end_time}")

        # STEP 6: Find child runs (workflow steps)
        print(f"\n🔗 STEP 6: Finding Child Runs (Workflow Steps)")
        trace_nodes_runs = sorted(
            [r for r in all_runs if r.parent_run_id == thread_run.id],
            key=lambda r: r.start_time or r.end_time or 0
        )

        print(f"   ✅ Found {len(trace_nodes_runs)} child runs")
        if trace_nodes_runs:
            print(f"   📋 Workflow steps:")
            for i, run in enumerate(trace_nodes_runs):
                status = "✅ completed" if run.end_time else "🔄 running"
                duration = ""
                if run.start_time and run.end_time:
                    duration = f" ({(run.end_time - run.start_time).total_seconds():.2f}s)"
                print(f"      {i+1:2d}. {run.name:20} | {status}{duration}")
        else:
            print(f"   ❌ No child runs found - this means no workflow steps were traced")
            return None

        # STEP 7: Extract tool calls from execute_tool runs
        print(f"\n🛠️  STEP 7: Extracting Tool Calls")
        tool_calls = []
        execute_tool_runs = [run for run in trace_nodes_runs if run.name == "execute_tool"]
        
        print(f"   Found {len(execute_tool_runs)} execute_tool runs")
        
        for i, run in enumerate(execute_tool_runs):
            print(f"   🔍 Analyzing execute_tool run {i+1}/{len(execute_tool_runs)}")
            print(f"      Run ID: {run.id}")
            print(f"      Has inputs: {bool(run.inputs)}")
            print(f"      Has outputs: {bool(run.outputs)}")
            
            if run.inputs:
                print(f"      Input keys: {list(run.inputs.keys()) if isinstance(run.inputs, dict) else 'not a dict'}")
                
                if 'messages' in run.inputs:
                    messages = run.inputs['messages']
                    print(f"      Found {len(messages)} messages in inputs")
                    
                    # Look for AI messages with tool calls
                    for j, msg_dict in enumerate(reversed(messages)):
                        if isinstance(msg_dict, dict):
                            msg_type = msg_dict.get('type', 'unknown')
                            has_tool_calls = bool(msg_dict.get('tool_calls'))
                            print(f"         Message {j+1}: type={msg_type}, has_tool_calls={has_tool_calls}")
                            
                            if msg_type == 'ai' and has_tool_calls:
                                tool_calls_list = msg_dict['tool_calls']
                                print(f"         ✅ Found {len(tool_calls_list)} tool calls")
                                
                                for k, tc in enumerate(tool_calls_list):
                                    tool_name = tc.get('name', 'unknown')
                                    tool_args = tc.get('args', {})
                                    print(f"            Tool {k+1}: {tool_name} with args: {tool_args}")
                                    
                                    # Create tool call object
                                    tool_call = {
                                        'name': tool_name,
                                        'arguments': tool_args,
                                        'status': 'completed' if run.end_time else 'executing',
                                        'execution_time': (run.end_time - run.start_time).total_seconds() * 1000 if run.end_time and run.start_time else 0,
                                        'timestamp': run.start_time.isoformat() if run.start_time else None,
                                        'run_id': str(run.id),
                                        'error': getattr(run, 'error', None)
                                    }
                                    
                                    # Add results if available
                                    if run.outputs:
                                        tool_call['result'] = run.outputs
                                        print(f"            Added outputs to tool call")
                                    
                                    tool_calls.append(tool_call)
                                    print(f"            ✅ Tool call added to results")
                                
                                break  # Found the AI message with tool calls
                else:
                    print(f"      ❌ No 'messages' key in inputs")
            else:
                print(f"      ❌ No inputs found for this run")

        print(f"   ✅ Extracted {len(tool_calls)} tool calls total")

        # STEP 8: Get graph structure
        print(f"\n📊 STEP 8: Getting Graph Structure")
        try:
            graph_json = app.get_graph().to_json()
            nodes_count = len(graph_json.get('nodes', []))
            edges_count = len(graph_json.get('edges', []))
            print(f"   ✅ Graph structure retrieved: {nodes_count} nodes, {edges_count} edges")
        except Exception as graph_error:
            print(f"   ⚠️  Could not get graph structure: {graph_error}")
            graph_json = {'nodes': [], 'edges': []}

        # STEP 9: Build final trace data
        print(f"\n🏗️  STEP 9: Building Final Trace Data")
        trace_data = {
            'thread_id': thread_id,
            'tool_calls': tool_calls,
            'execution_path': [run.name for run in trace_nodes_runs],
            'graph_structure': {
                'nodes': graph_json.get('nodes', []),
                'edges': graph_json.get('edges', [])
            },
            'total_execution_time': sum(tc.get('execution_time', 0) for tc in tool_calls),
            'status': 'completed' if all(tc.get('status') == 'completed' for tc in tool_calls) else 'partial'
        }

        print(f"   ✅ Trace data built successfully")
        print(f"      Thread ID: {trace_data['thread_id']}")
        print(f"      Tool calls: {len(trace_data['tool_calls'])}")
        print(f"      Execution path: {trace_data['execution_path']}")
        print(f"      Total execution time: {trace_data['total_execution_time']:.2f}ms")
        print(f"      Status: {trace_data['status']}")

        print(f"\n{'='*80}")
        print(f"✅ LANGSMITH TRACE DEBUG - Successfully completed!")
        print(f"{'='*80}\n")
        
        return trace_data

    except Exception as e:
        print(f"\n{'='*80}")
        print(f"❌ LANGSMITH TRACE DEBUG - ERROR OCCURRED!")
        print(f"{'='*80}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"\n📋 Full traceback:")
        import traceback
        for line in traceback.format_exc().split('\n'):
            if line.strip():
                print(f"   {line}")
        print(f"{'='*80}\n")
        return None

def generate_trace_animation_frames(thread_id: str):
    """
    DEPRECATED: Utiliser get_langsmith_trace_data() à la place.
    Maintenu pour compatibilité avec l'API existante.
    """
    print(f"--- DEPRECATED: generate_trace_animation_frames appelé pour {thread_id}")
    print("--- Utilisez get_langsmith_trace_data() à la place")
    return []

# --- Bloc test main ---
if __name__ == '__main__':
    def run_conversation(session_id: str, user_input: str):
        print(f"\n--- User: {user_input} ---")
        config = {"configurable": {"thread_id": session_id}}
        inputs = {"messages": [HumanMessage(content=user_input)]}
        final_message = None
        for event in app.stream(inputs, config=config, stream_mode="values"):
            final_message = event["messages"][-1]
        if final_message:
            print(f"\n--- Réponse finale de l'assistant ---\n{final_message.content}")
            if hasattr(final_message, 'image_base64'):
                print("\n[L'image a été générée et ajoutée au message final]")

    conversation_id = f"test_session_{uuid.uuid4()}"
    run_conversation(conversation_id, "Qui sont les créateurs du projet ?")
