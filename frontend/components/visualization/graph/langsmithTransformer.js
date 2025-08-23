/**
 * LangSmith Data Transformer - Transforme les données de trace LangSmith en structure de graphique
 * 
 * Ce module adapte les données de trace LangSmith pour utiliser le système de visualisation
 * existant tout en conservant l'apparence visuelle actuelle.
 */

import { transformWorkflowDataSync } from './workflowTransformer';

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
  const { execution_path, graph_structure, tool_calls } = langsmithData;

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

  // Create nodes from execution path
  if (execution_path && execution_path.length > 0) {
    // Add start node
    nodes.push({
      id: '__start__',
      type: 'start',
      label: nodeConfig['__start__'].label,
      icon: nodeConfig['__start__'].icon,
      isActive: true,
      isExecuted: true,
      isExecuting: false,
      position: { x: 0, y: 0 }
    });

    // Add nodes from execution path
    execution_path.forEach((nodeName, index) => {
      const config = nodeConfig[nodeName] || {
        icon: '🔧',
        label: { fr: nodeName, en: nodeName },
        type: 'unknown'
      };

      nodes.push({
        id: nodeName,
        type: config.type,
        label: config.label,
        icon: config.icon,
        executionOrder: index + 1,
        isActive: true,
        isExecuted: true,
        isExecuting: false,
        position: { x: 0, y: 0 }
      });
    });

    // Add end node
    nodes.push({
      id: '__end__',
      type: 'end',
      label: nodeConfig['__end__'].label,
      icon: nodeConfig['__end__'].icon,
      isActive: true,
      isExecuted: true,
      isExecuting: false,
      position: { x: 0, y: 0 }
    });
  }

  // Add tool detail nodes if we have tool calls
  if (tool_calls && tool_calls.length > 0) {
    tool_calls.forEach((toolCall, index) => {
      const toolName = toolCall.name;
      const toolConfig = getToolConfig(toolName);
      
      nodes.push({
        id: `tool_${toolName}_${index}`,
        type: 'tool_detail',
        toolName: toolName,
        label: toolConfig.label,
        icon: toolConfig.icon,
        description: toolConfig.description,
        executionOrder: index + 1,
        isActive: true,
        isExecuted: true,
        isExecuting: false,
        position: { x: 0, y: 0 },
        parentNode: 'execute_tool'
      });
    });
  }

  return nodes;
}

/**
 * Create edges based on LangSmith execution path
 */
function createLangSmithEdges(langsmithData, nodes) {
  const edges = [];
  const { execution_path } = langsmithData;

  if (!execution_path || execution_path.length === 0) {
    return edges;
  }

  // Create linear path from start through execution path to end
  let previousNode = '__start__';

  execution_path.forEach((nodeName, index) => {
    edges.push({
      id: `${previousNode}-${nodeName}`,
      from: previousNode,
      to: nodeName,
      condition: `step_${index + 1}`,
      isActive: true,
      isExecuted: true
    });
    previousNode = nodeName;
  });

  // Connect last node to end
  edges.push({
    id: `${previousNode}-__end__`,
    from: previousNode,
    to: '__end__',
    condition: 'workflow_complete',
    isActive: true,
    isExecuted: true
  });

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
 * Récupère les données de trace LangSmith depuis l'API
 * @param {string} sessionId - ID de session
 * @returns {Promise<Object>} Données de trace LangSmith
 */
export async function fetchLangSmithTrace(sessionId) {
  try {
    console.log('🔍 [LangSmith] Récupération des traces pour session:', sessionId);
    
    // Use direct backend URL for now (Next.js proxy might have issues)
    const apiUrl = `http://localhost:8000/langsmith-trace/${sessionId}`;
    
    // Ajouter un timeout côté client aussi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes
    
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
    if (error.name === 'AbortError') {
      console.error('⏰ [LangSmith] Timeout côté client');
      throw new Error('Timeout lors de la récupération des traces LangSmith');
    }
    console.error('❌ [LangSmith] Erreur lors de la récupération:', error);
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
    
    // D'abord tester la connectivité de base
    try {
      const healthResponse = await fetch('http://localhost:8000/health');
      console.log('🔍 [LangSmith] Health check:', healthResponse.status, healthResponse.ok);
      
      if (!healthResponse.ok) {
        console.warn('⚠️ [LangSmith] Backend non accessible');
        return false;
      }
    } catch (healthError) {
      console.warn('⚠️ [LangSmith] Erreur de connectivité backend:', healthError);
      return false;
    }
    
    // Ensuite tester l'endpoint LangSmith avec GET
    const apiUrl = `http://localhost:8000/langsmith-trace/${sessionId}`;
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
 * @returns {Promise<Object>} Données formatées pour le graphique
 */
export async function getLangSmithGraphData(sessionId, currentStep = -1, language = 'en') {
  console.log('🔍 [LangSmith] getLangSmithGraphData appelé pour session:', sessionId);
  
  try {
    const langsmithData = await fetchLangSmithTrace(sessionId);
    console.log('🔍 [LangSmith] Données brutes récupérées:', langsmithData);
    
    const transformedData = transformLangSmithData(langsmithData, currentStep, language);
    console.log('🔍 [LangSmith] Données transformées:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error('❌ [LangSmith] Erreur lors de la récupération des données graphique:', error);
    throw error;
  }
}