/**
 * Workflow Data Transformer - Version simplifiée sans dépendances externes
 */

// Memoization cache for expensive transformations
const transformationCache = new Map();

/**
 * Generate cache key for workflow transformations
 */
function generateTransformationCacheKey(toolCalls, currentStep) {
  if (!toolCalls || !Array.isArray(toolCalls)) {
    return `empty-${currentStep}`;
  }

  try {
    const toolSignature = toolCalls.map(tc =>
      `${tc?.name || tc?.tool_name || 'unknown'}-${tc?.status || 'completed'}`
    ).join('|');
    return `${toolSignature}-${currentStep}`;
  } catch (error) {
    console.error('Error generating cache key:', error);
    return `error-${currentStep}-${Date.now()}`;
  }
}

/**
 * Clear transformation caches
 */
export function clearTransformationCache() {
  transformationCache.clear();
}

/**
 * Available tools in Stella with their metadata
 */
const AVAILABLE_TOOLS = {
  'search_ticker': {
    icon: '🔍',
    label: { fr: 'Recherche Ticker', en: 'Search Ticker' },
    description: { fr: 'Trouve le ticker boursier', en: 'Find stock ticker' },
    group: 'data_acquisition'
  },
  'fetch_data': {
    icon: '📊',
    label: { fr: 'Récupération Données', en: 'Fetch Data' },
    description: { fr: 'Récupère les données financières', en: 'Fetch financial data' },
    group: 'data_acquisition'
  },
  'preprocess_data': {
    icon: '🔧',
    label: { fr: 'Prétraitement', en: 'Preprocess' },
    description: { fr: 'Prépare les données', en: 'Prepare data' },
    group: 'data_processing'
  },
  'analyze_risks': {
    icon: '🎯',
    label: { fr: 'Analyse Risques', en: 'Risk Analysis' },
    description: { fr: 'Prédit les risques', en: 'Predict risks' },
    group: 'data_processing'
  },
  'get_stock_news': {
    icon: '📰',
    label: { fr: 'Actualités', en: 'Stock News' },
    description: { fr: 'Récupère les actualités', en: 'Get stock news' },
    group: 'data_acquisition'
  },
  'get_company_profile': {
    icon: '🏢',
    label: { fr: 'Profil Entreprise', en: 'Company Profile' },
    description: { fr: 'Profil de l\'entreprise', en: 'Company profile' },
    group: 'data_acquisition'
  },
  'display_price_chart': {
    icon: '📈',
    label: { fr: 'Graphique Prix', en: 'Price Chart' },
    description: { fr: 'Graphique des prix', en: 'Price chart' },
    group: 'visualization'
  },
  'compare_stocks': {
    icon: '⚖️',
    label: { fr: 'Comparaison', en: 'Compare Stocks' },
    description: { fr: 'Compare les actions', en: 'Compare stocks' },
    group: 'visualization'
  },
  'create_dynamic_chart': {
    icon: '📊',
    label: { fr: 'Graphique Dynamique', en: 'Dynamic Chart' },
    description: { fr: 'Crée un graphique', en: 'Create chart' },
    group: 'visualization'
  },
  'display_raw_data': {
    icon: '📋',
    label: { fr: 'Données Brutes', en: 'Raw Data' },
    description: { fr: 'Affiche données brutes', en: 'Display raw data' },
    group: 'data_display'
  },
  'display_processed_data': {
    icon: '📄',
    label: { fr: 'Données Traitées', en: 'Processed Data' },
    description: { fr: 'Affiche données traitées', en: 'Display processed data' },
    group: 'data_display'
  },
  'query_research': {
    icon: '🔬',
    label: { fr: 'Recherche Document', en: 'Research Query' },
    description: { fr: 'Recherche interne', en: 'Internal research' },
    group: 'research'
  }
};

/**
 * Core workflow nodes
 */
function getCoreWorkflowNodes() {
  return {
    start: {
      id: 'start',
      type: 'start',
      label: { fr: 'Début', en: 'Start' },
      description: { fr: 'Point d\'entrée du workflow', en: 'Workflow entry point' },
      icon: '▶️'
    },
    agent: {
      id: 'agent',
      type: 'agent',
      label: { fr: 'Agent (LLM)', en: 'Agent (LLM)' },
      description: { fr: 'Décision du LLM sur l\'action à prendre', en: 'LLM decides on next action' },
      icon: '🧠'
    },
    generate_final_response: {
      id: 'generate_final_response',
      type: 'preparation',
      label: { fr: 'Réponse Finale', en: 'Final Response' },
      description: { fr: 'Génère la réponse finale', en: 'Generate final response' },
      icon: '✨'
    },
    cleanup_state: {
      id: 'cleanup_state',
      type: 'preparation',
      label: { fr: 'Nettoyage', en: 'Cleanup' },
      description: { fr: 'Nettoie l\'état', en: 'Clean up state' },
      icon: '🧹'
    },
    handle_error: {
      id: 'handle_error',
      type: 'error',
      label: { fr: 'Gestion Erreur', en: 'Handle Error' },
      description: { fr: 'Gère les erreurs', en: 'Handle errors' },
      icon: '⚠️'
    },
    end: {
      id: 'end',
      type: 'end',
      label: { fr: 'Fin', en: 'End' },
      description: { fr: 'Fin du workflow', en: 'Workflow complete' },
      icon: '🏁'
    }
  };
}

/**
 * Transform tool calls into graph nodes
 */
export function transformToolCallsToNodes(toolCalls = [], currentStep = -1) {
  const nodes = { ...getCoreWorkflowNodes() };
  const executedTools = [];

  toolCalls.forEach((toolCall, index) => {
    const toolName = toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool;

    if (!toolName) {
      console.warn('Tool call missing name:', toolCall);
      return;
    }

    const toolInfo = AVAILABLE_TOOLS[toolName] || {
      icon: '🔧',
      label: { fr: toolName, en: toolName },
      description: { fr: `Outil: ${toolName}`, en: `Tool: ${toolName}` },
      group: 'unknown'
    };

    const nodeId = `tool_${toolName}_${index}`;

    nodes[nodeId] = {
      id: nodeId,
      type: 'tool',
      toolName: toolName,
      label: toolInfo.label,
      description: toolInfo.description,
      icon: toolInfo.icon,
      group: toolInfo.group,
      executionOrder: index + 1,
      isActive: false,
      isExecuted: false,
      isExecuting: false,
      position: { x: 0, y: 0 }
    };

    const executionData = {
      toolName: toolName,
      arguments: toolCall.arguments || toolCall.input || toolCall.args || {},
      executionTime: toolCall.execution_time || toolCall.duration || 0,
      status: toolCall.status || (toolCall.error ? 'error' : 'completed'),
      result: toolCall.result || toolCall.output,
      error: toolCall.error,
      nodeId: nodeId,
      timestamp: toolCall.timestamp || Date.now(),
      executionOrder: index + 1
    };

    executedTools.push(executionData);
  });

  return { nodes, executedTools };
}

/**
 * Generate edges based on workflow routing logic
 */
export function generateWorkflowEdges(nodes, toolCalls = [], currentStep = -1) {
  const edges = [];
  const nodeIds = Object.keys(nodes);

  // Core workflow edges
  edges.push({
    id: 'start-agent',
    from: 'start',
    to: 'agent',
    condition: 'workflow_start',
    isActive: true,
    isExecuted: true
  });

  // Get tool node IDs in execution order
  const toolNodeIds = nodeIds
    .filter(id => id.startsWith('tool_'))
    .sort((a, b) => {
      const nodeA = nodes[a];
      const nodeB = nodes[b];
      return (nodeA.executionOrder || 0) - (nodeB.executionOrder || 0);
    });

  if (toolNodeIds.length > 0) {
    // Agent to first tool
    edges.push({
      id: `agent-${toolNodeIds[0]}`,
      from: 'agent',
      to: toolNodeIds[0],
      condition: 'tool_execution_start',
      isActive: true,
      isExecuted: currentStep >= 0
    });

    // Chain tools together
    for (let i = 0; i < toolNodeIds.length - 1; i++) {
      const currentToolId = toolNodeIds[i];
      const nextToolId = toolNodeIds[i + 1];

      edges.push({
        id: `${currentToolId}-${nextToolId}`,
        from: currentToolId,
        to: nextToolId,
        condition: 'tool_chain',
        isActive: true,
        isExecuted: currentStep > i || currentStep === -1
      });
    }

    // Last tool to final response
    const lastToolId = toolNodeIds[toolNodeIds.length - 1];

    edges.push({
      id: `${lastToolId}-generate_final_response`,
      from: lastToolId,
      to: 'generate_final_response',
      condition: 'generate_response',
      isActive: true,
      isExecuted: currentStep === -1
    });

    edges.push({
      id: 'generate_final_response-cleanup_state',
      from: 'generate_final_response',
      to: 'cleanup_state',
      condition: 'cleanup_required',
      isActive: true,
      isExecuted: currentStep === -1
    });

    edges.push({
      id: 'cleanup_state-end',
      from: 'cleanup_state',
      to: 'end',
      condition: 'workflow_complete',
      isActive: true,
      isExecuted: currentStep === -1
    });

  } else {
    // No tools - direct path
    edges.push({
      id: 'agent-end',
      from: 'agent',
      to: 'end',
      condition: 'no_tools_needed',
      isActive: currentStep === -1,
      isExecuted: currentStep === -1
    });
  }

  return edges;
}

/**
 * Determine node states based on execution progress
 */
export function determineNodeStates(nodes, toolCalls = [], currentStep = -1) {
  const states = {
    activeNodes: new Set(),
    executedNodes: new Set(),
    executingNodes: new Set(),
    errorNodes: new Set(),
    inactiveNodes: new Set()
  };

  // Core workflow nodes
  states.activeNodes.add('start');
  states.activeNodes.add('agent');
  states.executedNodes.add('start');

  const toolNodeIds = Object.keys(nodes)
    .filter(id => id.startsWith('tool_'))
    .sort((a, b) => (nodes[a].executionOrder || 0) - (nodes[b].executionOrder || 0));

  if (currentStep === -1) {
    // Workflow complete
    states.executedNodes.add('agent');

    toolNodeIds.forEach((nodeId, index) => {
      states.activeNodes.add(nodeId);
      states.executedNodes.add(nodeId);

      const toolCall = toolCalls[index];
      if (toolCall && (toolCall.error || toolCall.status === 'error')) {
        states.errorNodes.add(nodeId);
      }
    });

    if (toolCalls.length > 0) {
      states.activeNodes.add('generate_final_response');
      states.activeNodes.add('cleanup_state');
      states.activeNodes.add('end');
      states.executedNodes.add('generate_final_response');
      states.executedNodes.add('cleanup_state');
      states.executedNodes.add('end');
    } else {
      states.activeNodes.add('end');
      states.executedNodes.add('end');
    }

  } else {
    // Workflow in progress
    states.executedNodes.add('agent');

    for (let i = 0; i < Math.min(currentStep, toolNodeIds.length); i++) {
      const nodeId = toolNodeIds[i];
      states.activeNodes.add(nodeId);
      states.executedNodes.add(nodeId);

      const toolCall = toolCalls[i];
      if (toolCall && (toolCall.error || toolCall.status === 'error')) {
        states.errorNodes.add(nodeId);
      }
    }

    if (currentStep >= 0 && currentStep < toolNodeIds.length) {
      const currentNodeId = toolNodeIds[currentStep];
      states.activeNodes.add(currentNodeId);
      states.executingNodes.add(currentNodeId);
    }

    for (let i = currentStep + 1; i < toolNodeIds.length; i++) {
      states.activeNodes.add(toolNodeIds[i]);
    }
  }

  // Mark unused nodes as inactive
  Object.keys(nodes).forEach(nodeId => {
    if (!states.activeNodes.has(nodeId) &&
      !states.executedNodes.has(nodeId) &&
      !states.executingNodes.has(nodeId)) {
      states.inactiveNodes.add(nodeId);
    }
  });

  return states;
}

/**
 * Synchronous transformation function
 */
export function transformWorkflowDataSync(toolCalls = [], currentStep = -1, language = 'en') {
  try {
    const { nodes, executedTools } = transformToolCallsToNodes(toolCalls, currentStep);
    const edges = generateWorkflowEdges(nodes, toolCalls, currentStep);
    const nodeStates = determineNodeStates(nodes, toolCalls, currentStep);

    // Apply states to nodes
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      node.isActive = nodeStates.activeNodes.has(nodeId);
      node.isExecuted = nodeStates.executedNodes.has(nodeId);
      node.isExecuting = nodeStates.executingNodes.has(nodeId);
    });

    return {
      nodes: Object.values(nodes),
      edges,
      executedTools,
      nodeStates,
      metadata: {
        totalTools: toolCalls.length,
        currentStep,
        isComplete: currentStep === -1,
        syncFallback: true,
        language
      }
    };
  } catch (error) {
    console.error('Sync transformation error:', error);
    return {
      nodes: [],
      edges: [],
      executedTools: [],
      nodeStates: { activeNodes: new Set(), executedNodes: new Set(), executingNodes: new Set() },
      metadata: { error: true, syncFallback: true, errorMessage: error.message }
    };
  }
}

/**
 * Main async transformation function (simplified)
 */
export async function transformWorkflowData(toolCalls = [], currentStep = -1, language = 'en') {
  // Check cache first
  const cacheKey = generateTransformationCacheKey(toolCalls, currentStep);
  if (transformationCache.has(cacheKey)) {
    return transformationCache.get(cacheKey);
  }

  try {
    // Use sync version for now
    const result = transformWorkflowDataSync(toolCalls, currentStep, language);
    result.metadata.async = true;
    result.metadata.cached = false;

    // Cache result
    transformationCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Async transformation error:', error);
    return {
      nodes: [],
      edges: [],
      executedTools: [],
      nodeStates: { activeNodes: new Set(), executedNodes: new Set(), executingNodes: new Set() },
      metadata: { error: true, errorMessage: error.message }
    };
  }
}