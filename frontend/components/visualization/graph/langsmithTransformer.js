/**
 * LangSmith Data Transformer - Transforme les données de trace LangSmith en structure de graphique
 * 
 * Ce module adapte les données de trace LangSmith pour utiliser le système de visualisation
 * existant tout en conservant l'apparence visuelle actuelle.
 */

import { transformWorkflowDataSync } from './workflowTransformer';

// Cache for LangSmith data to prevent multiple API calls for the same session
const langsmithDataCache = new Map();
const langsmithRequestCache = new Map(); // Cache for ongoing requests

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Transforme les données de trace LangSmith en format compatible avec le graphique existant
 * @param {Object} langsmithData - Données de trace LangSmith du backend
 * @param {number} currentStep - Étape actuelle (-1 pour workflow complet)
 * @param {string} language - Langue pour les labels
 * @returns {Object} Données formatées pour le graphique
 */
export function transformLangSmithData(langsmithData, currentStep = -1, language = 'en') {
  if (!langsmithData || (!langsmithData.tool_calls && !langsmithData.execution_path)) {
    console.warn('Données LangSmith invalides ou manquantes');
    return {
      nodes: [],
      edges: [],
      executedTools: [],
      nodeStates: { activeNodes: new Set(), executedNodes: new Set(), executingNodes: new Set() },
      metadata: { error: true, source: 'langsmith' }
    };
  }

  try {
    console.log('🔍 [LangSmith Transform] Processing data:', {
      execution_path: langsmithData.execution_path,
      tool_calls: langsmithData.tool_calls?.length || 0,
      graph_structure: langsmithData.graph_structure
    });

    // Create nodes based on the actual execution path and graph structure
    const nodes = createLangSmithNodes(langsmithData, language);
    
    // Create edges based on the actual execution path
    const edges = createLangSmithEdges(langsmithData, nodes);
    
    // Process tool calls for execution details
    const executedTools = processLangSmithToolCalls(langsmithData.tool_calls || []);
    
    // Determine node states based on execution
    const nodeStates = determineLangSmithNodeStates(nodes, langsmithData, currentStep);

    console.log('✅ [LangSmith Transform] Generated graph:', {
      nodes: nodes.length,
      edges: edges.length,
      executedTools: executedTools.length
    });

    return {
      nodes,
      edges,
      executedTools,
      nodeStates,
      metadata: {
        source: 'langsmith',
        thread_id: langsmithData.thread_id,
        execution_path: langsmithData.execution_path,
        total_execution_time: langsmithData.total_execution_time,
        langsmith_status: langsmithData.status,
        currentStep,
        isComplete: currentStep === -1,
        language
      }
    };

  } catch (error) {
    console.error('Erreur lors de la transformation des données LangSmith:', error);
    return {
      nodes: [],
      edges: [],
      executedTools: [],
      nodeStates: { activeNodes: new Set(), executedNodes: new Set(), executingNodes: new Set() },
      metadata: { error: true, source: 'langsmith', errorMessage: error.message }
    };
  }
}

/**
 * Create nodes based on LangSmith execution path and graph structure
 */
function createLangSmithNodes(langsmithData, language = 'en') {
  const nodes = [];
  const { execution_path, graph_structure, tool_calls, thread_id } = langsmithData;

  // All possible workflow nodes (complete graph structure)
  const allPossibleNodes = [
    '__start__',
    'agent', 
    'execute_tool',
    'generate_final_response',
    'prepare_chart_display',
    'prepare_data_display', 
    'prepare_news_display',
    'prepare_profile_display',
    'handle_error',
    'cleanup_state',
    '__end__'
  ];

  // Node labels and icons
  const nodeConfig = {
    '__start__': {
      icon: '▶️',
      label: { fr: 'Début', en: 'Start' },
      type: 'start'
    },
    'agent': {
      icon: '🧠',
      label: { fr: 'Agent (LLM)', en: 'Agent (LLM)' },
      type: 'agent'
    },
    'execute_tool': {
      icon: '🔧',
      label: { fr: 'Exécution Outils', en: 'Execute Tools' },
      type: 'tool_execution'
    },
    'generate_final_response': {
      icon: '✨',
      label: { fr: 'Réponse Finale', en: 'Final Response' },
      type: 'preparation'
    },
    'cleanup_state': {
      icon: '🧹',
      label: { fr: 'Nettoyage', en: 'Cleanup' },
      type: 'preparation'
    },
    'prepare_chart_display': {
      icon: '📊',
      label: { fr: 'Préparation Graphique', en: 'Prepare Chart' },
      type: 'preparation'
    },
    'prepare_data_display': {
      icon: '📋',
      label: { fr: 'Préparation Données', en: 'Prepare Data' },
      type: 'preparation'
    },
    'prepare_news_display': {
      icon: '📰',
      label: { fr: 'Préparation Actualités', en: 'Prepare News' },
      type: 'preparation'
    },
    'prepare_profile_display': {
      icon: '🏢',
      label: { fr: 'Préparation Profil', en: 'Prepare Profile' },
      type: 'preparation'
    },
    'handle_error': {
      icon: '⚠️',
      label: { fr: 'Gestion Erreur', en: 'Handle Error' },
      type: 'error'
    },
    '__end__': {
      icon: '🏁',
      label: { fr: 'Fin', en: 'End' },
      type: 'end'
    }
  };

  // Create all possible nodes, marking which ones were executed
  const executedNodes = new Set(execution_path || []);
  // Always include start and end if there's an execution path
  if (execution_path && execution_path.length > 0) {
    executedNodes.add('__start__');
    executedNodes.add('__end__');
  }

  console.log('🎨 [LangSmith Transform] Executed nodes:', Array.from(executedNodes));
  console.log('🎨 [LangSmith Transform] All possible nodes:', allPossibleNodes);

  allPossibleNodes.forEach((nodeName, index) => {
    const config = nodeConfig[nodeName] || {
      icon: '🔧',
      label: { fr: nodeName, en: nodeName },
      type: 'unknown'
    };

    const isExecuted = executedNodes.has(nodeName);
    console.log(`🎨 [LangSmith Transform] Node ${nodeName}: isExecuted=${isExecuted}`);

    nodes.push({
      id: nodeName,
      type: config.type,
      label: config.label,
      icon: config.icon,
      executionOrder: isExecuted ? (execution_path?.indexOf(nodeName) + 1 || 0) : null,
      isActive: isExecuted,
      isExecuted: isExecuted,
      isExecuting: false,
      isUnused: !isExecuted,
      position: { x: 0, y: 0 },
      // Store raw data for content extraction
      rawToolCalls: tool_calls,
      rawThreadId: thread_id
    });
  });

  // Add detached info nodes for agent and execute_tool if they were executed
  const agentNode = nodes.find(n => n.id === 'agent' && n.isExecuted);
  const executeToolNode = nodes.find(n => n.id === 'execute_tool' && n.isExecuted);

  if (agentNode) {
    nodes.push({
      id: 'agent_query_detail',
      type: 'info_detail',
      label: { fr: 'Requête Utilisateur', en: 'User Query' },
      icon: '💬',
      isActive: true,
      isExecuted: true,
      isExecuting: false,
      isDetailNode: true,
      parentNode: 'agent',
      position: { x: 0, y: 0 },
      rawToolCalls: tool_calls,
      rawThreadId: thread_id
    });
  }

  if (executeToolNode) {
    nodes.push({
      id: 'execute_tool_detail',
      type: 'info_detail',
      label: { fr: 'Outils Exécutés', en: 'Executed Tools' },
      icon: '🛠️',
      isActive: true,
      isExecuted: true,
      isExecuting: false,
      isDetailNode: true,
      parentNode: 'execute_tool',
      position: { x: 0, y: 0 },
      rawToolCalls: tool_calls,
      rawThreadId: thread_id
    });
  }

  return nodes;
}

/**
 * Create edges based on LangSmith execution path and complete workflow structure
 */
function createLangSmithEdges(langsmithData, nodes) {
  const edges = [];
  const { execution_path } = langsmithData;
  
  // Define the complete workflow structure with all possible paths
  const workflowStructure = [
    { from: '__start__', to: 'agent', condition: 'workflow_start' },
    { from: 'agent', to: 'execute_tool', condition: 'tools_needed' },
    { from: 'agent', to: 'generate_final_response', condition: 'no_tools_needed' },
    { from: 'execute_tool', to: 'generate_final_response', condition: 'generate_response' },
    { from: 'execute_tool', to: 'prepare_chart_display', condition: 'chart_needed' },
    { from: 'execute_tool', to: 'prepare_data_display', condition: 'data_display_needed' },
    { from: 'execute_tool', to: 'prepare_news_display', condition: 'news_needed' },
    { from: 'execute_tool', to: 'prepare_profile_display', condition: 'profile_needed' },
    { from: 'execute_tool', to: 'handle_error', condition: 'error_occurred' },
    { from: 'generate_final_response', to: 'cleanup_state', condition: 'cleanup_required' },
    { from: 'prepare_chart_display', to: 'cleanup_state', condition: 'cleanup_required' },
    { from: 'prepare_data_display', to: 'cleanup_state', condition: 'cleanup_required' },
    { from: 'prepare_news_display', to: 'cleanup_state', condition: 'cleanup_required' },
    { from: 'prepare_profile_display', to: 'cleanup_state', condition: 'cleanup_required' },
    { from: 'handle_error', to: 'cleanup_state', condition: 'cleanup_required' },
    { from: 'cleanup_state', to: '__end__', condition: 'workflow_complete' }
  ];

  // Create edges based on workflow structure
  workflowStructure.forEach((edgeSpec, index) => {
    const fromNode = nodes.find(n => n.id === edgeSpec.from);
    const toNode = nodes.find(n => n.id === edgeSpec.to);
    
    if (!fromNode || !toNode) return;

    // Determine if this edge was actually used in execution
    let isExecuted = false;
    let isActive = false;

    if (execution_path && execution_path.length > 0) {
      // Check if this is part of the actual execution path
      const fromIndex = execution_path.indexOf(edgeSpec.from);
      const toIndex = execution_path.indexOf(edgeSpec.to);
      
      // Edge is executed if both nodes are in execution path and connected
      if (fromIndex >= 0 && toIndex >= 0 && toIndex === fromIndex + 1) {
        isExecuted = true;
        isActive = true;
      }
      // Special case for start -> first node and last node -> end
      else if (edgeSpec.from === '__start__' && execution_path[0] === edgeSpec.to) {
        isExecuted = true;
        isActive = true;
      }
      else if (edgeSpec.to === '__end__' && execution_path[execution_path.length - 1] === edgeSpec.from) {
        isExecuted = true;
        isActive = true;
      }
      // Don't mark edges as active just because the from node was executed
      // Only mark as active if it's actually part of the execution path
    }

    console.log(`🎨 [LangSmith Transform] Edge ${edgeSpec.from}->${edgeSpec.to}: isExecuted=${isExecuted}, isActive=${isActive}`);

    edges.push({
      id: `${edgeSpec.from}-${edgeSpec.to}`,
      from: edgeSpec.from,
      to: edgeSpec.to,
      condition: edgeSpec.condition,
      isActive: isActive,
      isExecuted: isExecuted,
      isUnused: !isActive,
      index
    });
  });

  // Add edges for detail nodes
  const hasAgentDetail = nodes.some(n => n.id === 'agent_query_detail');
  const hasExecuteToolDetail = nodes.some(n => n.id === 'execute_tool_detail');

  if (hasAgentDetail) {
    edges.push({
      id: 'agent-agent_query_detail',
      from: 'agent',
      to: 'agent_query_detail',
      condition: 'detail_connection',
      isActive: true,
      isExecuted: true,
      isDetailEdge: true,
      index: edges.length
    });
  }

  if (hasExecuteToolDetail) {
    edges.push({
      id: 'execute_tool-execute_tool_detail',
      from: 'execute_tool',
      to: 'execute_tool_detail',
      condition: 'detail_connection',
      isActive: true,
      isExecuted: true,
      isDetailEdge: true,
      index: edges.length
    });
  }

  return edges;
}

/**
 * Process tool calls for execution details
 */
function processLangSmithToolCalls(toolCalls) {
  return toolCalls.map((toolCall, index) => ({
    toolName: toolCall.name,
    arguments: toolCall.arguments || {},
    executionTime: toolCall.execution_time || 0,
    status: toolCall.status || 'completed',
    result: toolCall.result,
    error: toolCall.error,
    nodeId: `tool_${toolCall.name}_${index}`,
    timestamp: toolCall.timestamp,
    executionOrder: index + 1,
    run_id: toolCall.run_id
  }));
}

/**
 * Determine node states for LangSmith data
 */
function determineLangSmithNodeStates(nodes, langsmithData, currentStep) {
  const states = {
    activeNodes: new Set(),
    executedNodes: new Set(),
    executingNodes: new Set(),
    errorNodes: new Set(),
    inactiveNodes: new Set()
  };

  // All nodes in the execution path are active and executed
  nodes.forEach(node => {
    states.activeNodes.add(node.id);
    states.executedNodes.add(node.id);

    // Check for errors in tool calls
    if (node.type === 'tool_detail') {
      const toolCall = langsmithData.tool_calls?.find(tc => 
        node.id.includes(tc.name)
      );
      if (toolCall && (toolCall.error || toolCall.status === 'error')) {
        states.errorNodes.add(node.id);
      }
    }
  });

  return states;
}

/**
 * Get tool configuration
 */
function getToolConfig(toolName) {
  const toolConfigs = {
    'fetch_data': {
      icon: '📊',
      label: { fr: 'Récupération Données', en: 'Fetch Data' },
      description: { fr: 'Récupère les données financières', en: 'Fetch financial data' }
    },
    'preprocess_data': {
      icon: '🔧',
      label: { fr: 'Prétraitement', en: 'Preprocess' },
      description: { fr: 'Prépare les données', en: 'Prepare data' }
    },
    'analyze_risks': {
      icon: '🎯',
      label: { fr: 'Analyse Risques', en: 'Risk Analysis' },
      description: { fr: 'Prédit les risques', en: 'Predict risks' }
    },
    'search_ticker': {
      icon: '🔍',
      label: { fr: 'Recherche Ticker', en: 'Search Ticker' },
      description: { fr: 'Trouve le ticker boursier', en: 'Find stock ticker' }
    },
    'get_stock_news': {
      icon: '📰',
      label: { fr: 'Actualités', en: 'Stock News' },
      description: { fr: 'Récupère les actualités', en: 'Get stock news' }
    },
    'get_company_profile': {
      icon: '🏢',
      label: { fr: 'Profil Entreprise', en: 'Company Profile' },
      description: { fr: 'Profil de l\'entreprise', en: 'Company profile' }
    },
    'display_price_chart': {
      icon: '📈',
      label: { fr: 'Graphique Prix', en: 'Price Chart' },
      description: { fr: 'Graphique des prix', en: 'Price chart' }
    },
    'compare_stocks': {
      icon: '⚖️',
      label: { fr: 'Comparaison', en: 'Compare Stocks' },
      description: { fr: 'Compare les actions', en: 'Compare stocks' }
    },
    'create_dynamic_chart': {
      icon: '📊',
      label: { fr: 'Graphique Dynamique', en: 'Dynamic Chart' },
      description: { fr: 'Crée un graphique', en: 'Create chart' }
    }
  };

  return toolConfigs[toolName] || {
    icon: '🔧',
    label: { fr: toolName, en: toolName },
    description: { fr: `Outil: ${toolName}`, en: `Tool: ${toolName}` }
  };
}

/**
 * Clear LangSmith caches
 */
export function clearLangSmithCache() {
  langsmithDataCache.clear();
  langsmithRequestCache.clear();
  console.log('🧹 [LangSmith] Cache cleared');
}

/**
 * Generate cache key for LangSmith data - includes message-specific data for uniqueness
 */
function generateLangSmithCacheKey(sessionId, currentStep = -1, language = 'en', messageData = null) {
  // Use the unique cache key if provided, otherwise generate one
  if (messageData && messageData._cacheKey) {
    return `${sessionId}-${currentStep}-${language}-${messageData._cacheKey}`;
  }
  
  // Include message-specific data in cache key to ensure each message gets unique visualization
  let messageSignature = '';
  if (messageData) {
    const toolCallsSignature = messageData.toolCalls ? 
      messageData.toolCalls.map((tc, index) => `${tc.name || tc.tool_name || 'unknown'}-${index}`).join('|') : 
      'no-tools';
    const contentSignature = (messageData.content || messageData.initialContent || messageData.finalContent || '').substring(0, 50);
    const timestamp = messageData.timestamp ? new Date(messageData.timestamp).getTime() : Date.now();
    messageSignature = `-msg:${messageData.id || 'unknown'}-ts:${timestamp}-tools:${toolCallsSignature}-content:${contentSignature.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  return `${sessionId}-${currentStep}-${language}${messageSignature}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry) {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TIMEOUT;
}

/**
 * Récupère les données de trace LangSmith depuis l'API avec cache et déduplication des requêtes
 * @param {string} sessionId - ID de session
 * @returns {Promise<Object>} Données de trace LangSmith
 */
export async function fetchLangSmithTrace(sessionId) {
  try {
    console.log('🔍 [LangSmith] Récupération des traces pour session:', sessionId);
    
    // Check if there's already an ongoing request for this session
    if (langsmithRequestCache.has(sessionId)) {
      console.log('🔄 [LangSmith] Requête en cours détectée, attente de la réponse...');
      return await langsmithRequestCache.get(sessionId);
    }
    
    // Check cache first
    const cacheKey = sessionId;
    const cachedEntry = langsmithDataCache.get(cacheKey);
    
    if (isCacheValid(cachedEntry)) {
      console.log('💾 [LangSmith] Données récupérées depuis le cache');
      return cachedEntry.data;
    }
    
    // Create the request promise and cache it to prevent duplicate requests
    const requestPromise = performLangSmithRequest(sessionId);
    langsmithRequestCache.set(sessionId, requestPromise);
    
    try {
      const data = await requestPromise;
      
      // Cache the successful result
      langsmithDataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log('✅ [LangSmith] Données récupérées et mises en cache');
      return data;
      
    } finally {
      // Always remove the request from the ongoing requests cache
      langsmithRequestCache.delete(sessionId);
    }

  } catch (error) {
    console.error('❌ [LangSmith] Erreur lors de la récupération:', error);
    throw error;
  }
}

/**
 * Perform the actual LangSmith API request
 */
async function performLangSmithRequest(sessionId) {
  // Use Next.js API route to proxy the request
  const apiUrl = `/api/langsmith-trace/${sessionId}`;
  
  // Ajouter un timeout côté client aussi
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('🔍 [LangSmith] Réponse API:', response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Aucune trace LangSmith trouvée pour cette session');
      }
      if (response.status === 408) {
        throw new Error('Timeout lors de la récupération des traces LangSmith');
      }
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [LangSmith] Données récupérées:', data);
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('⏰ [LangSmith] Timeout côté client');
      throw new Error('[LangSmith] timeout côté client');
    }
    throw error;
  }
}

/**
 * Vérifie si les données LangSmith sont disponibles pour une session
 * @param {string} sessionId - ID de session
 * @returns {Promise<boolean>} True si les données sont disponibles
 */
export async function hasLangSmithTrace(sessionId) {
  try {
    console.log('🔍 [LangSmith] Vérification de la trace pour session:', sessionId);
    
    // Test the Next.js API route directly
    const apiUrl = `/api/langsmith-trace/${sessionId}`;
    console.log('🔍 [LangSmith] Test de l\'endpoint:', apiUrl);
    
    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 [LangSmith] Réponse GET:', response.status, response.ok);
    
    // Si c'est 404, pas de trace disponible
    if (response.status === 404) {
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.warn('⚠️ [LangSmith] Erreur lors de la vérification de la trace:', error);
    return false;
  }
}

/**
 * Transforme les données LangSmith en format compatible avec le composant AgentDecisionDAG
 * @param {string} sessionId - ID de session
 * @param {number} currentStep - Étape actuelle
 * @param {string} language - Langue
 * @param {Object} messageData - Message data for unique caching
 * @returns {Promise<Object>} Données formatées pour le graphique
 */
export async function getLangSmithGraphData(sessionId, currentStep = -1, language = 'en', messageData = null) {
  console.log('🔍 [LangSmith] getLangSmithGraphData appelé pour session:', sessionId);
  
  // Check if caching is disabled for this message
  const disableCache = messageData?._disableCache;
  
  // Check transformed data cache first - include message data for unique caching
  const transformedCacheKey = generateLangSmithCacheKey(sessionId, currentStep, language, messageData);
  const cachedTransformed = langsmithDataCache.get(`transformed-${transformedCacheKey}`);
  
  if (!disableCache && isCacheValid(cachedTransformed)) {
    console.log('💾 [LangSmith] Données transformées récupérées depuis le cache pour message:', messageData?.id);
    return cachedTransformed.data;
  }
  
  if (disableCache) {
    console.log('🚫 [LangSmith] Cache désactivé pour message:', messageData?.id);
  }
  
  try {
    const langsmithData = await fetchLangSmithTrace(sessionId);
    console.log('🔍 [LangSmith] Données brutes récupérées:', langsmithData);
    
    const transformedData = transformLangSmithData(langsmithData, currentStep, language);
    console.log('🔍 [LangSmith] Données transformées:', transformedData);
    
    // Cache the transformed data with message-specific key (only if caching is enabled)
    if (!disableCache) {
      langsmithDataCache.set(`transformed-${transformedCacheKey}`, {
        data: transformedData,
        timestamp: Date.now()
      });
    }
    
    return transformedData;
  } catch (error) {
    console.error('❌ [LangSmith] Erreur lors de la récupération des données graphique:', error);
    throw error;
  }
}