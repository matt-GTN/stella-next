/**
 * Workflow Data Transformer - Core data processing engine for graph visualization.
 * 
 * This module provides comprehensive transformation of backend tool calls into
 * graph visualization data structures with advanced features:
 * 
 * - **Data Validation**: Comprehensive validation with fallback handling
 * - **Edge Case Detection**: Automatic detection of large workflows, concurrent executions
 * - **Performance Optimization**: Memoization, caching, and virtualization support
 * - **State Management**: Advanced node state tracking (active, executed, executing, error)
 * - **Routing Logic**: Intelligent workflow routing based on tool types and execution context
 * - **Error Handling**: Graceful degradation with fallback structures
 * - **Localization**: Multi-language support for all text elements
 * - **Tool Metadata**: Rich tool information with icons, descriptions, and grouping
 * 
 * The transformer handles various backend formats and normalizes them into a consistent
 * structure for visualization. It includes sophisticated algorithms for determining
 * execution flow, node states, and optimal routing paths.
 * 
 * @module workflowTransformer
 * @since 1.0.0
 * @author Kiro AI Assistant
 * 
 * @example
 * ```javascript
 * import { transformWorkflowData } from './workflowTransformer';
 * 
 * const toolCalls = [
 *   { name: 'search_ticker', arguments: { symbol: 'AAPL' }, status: 'completed' },
 *   { name: 'fetch_data', arguments: { ticker: 'AAPL' }, status: 'executing' }
 * ];
 * 
 * const graphData = transformWorkflowData(toolCalls, 1, 'en');
 * console.log(graphData.nodes); // Array of positioned nodes
 * console.log(graphData.edges); // Array of connections
 * console.log(graphData.nodeStates); // Execution state information
 * ```
 */

// Lazy imports to avoid circular dependencies and temporal dead zone issues
let validateGraphData, createFallbackGraphStructure, ValidationErrorTypes;
let detectEdgeCases, createOptimizedGraphStructure, getPerformanceRecommendations, EdgeCaseTypes;

// Initialize imports lazily
async function initializeValidation() {
  if (!validateGraphData) {
    const validation = await import('./dataValidation');
    validateGraphData = validation.validateGraphData;
    createFallbackGraphStructure = validation.createFallbackGraphStructure;
    ValidationErrorTypes = validation.ValidationErrorTypes;
  }
}

async function initializeEdgeCases() {
  if (!detectEdgeCases) {
    const edgeCases = await import('./edgeCasesHandler');
    detectEdgeCases = edgeCases.detectEdgeCases;
    createOptimizedGraphStructure = edgeCases.createOptimizedGraphStructure;
    getPerformanceRecommendations = edgeCases.getPerformanceRecommendations;
    EdgeCaseTypes = edgeCases.EdgeCaseTypes;
  }
}

// Memoization cache for expensive transformations
const transformationCache = new Map();
const edgeGenerationCache = new Map();
const nodeStatesCache = new Map();

/**
 * Generate cache key for workflow transformations
 * @param {Array} toolCalls - Tool calls array
 * @param {number} currentStep - Current step
 * @returns {string} Cache key
 */
function generateTransformationCacheKey(toolCalls, currentStep) {
  // Defensive programming to prevent temporal dead zone errors
  if (!toolCalls || !Array.isArray(toolCalls)) {
    return `empty-${currentStep}`;
  }
  
  try {
    const toolSignature = toolCalls.map(tc => 
      `${tc?.name || tc?.tool_name || 'unknown'}-${tc?.status || 'completed'}-${tc?.execution_time || 0}`
    ).join('|');
    return `${toolSignature}-${currentStep}`;
  } catch (error) {
    console.error('Error generating cache key:', error);
    return `error-${currentStep}-${Date.now()}`;
  }
}

/**
 * Synchronous fallback version for cases where async isn't supported
 * @param {Array} toolCalls - Tool calls array
 * @param {number} currentStep - Current step
 * @param {string} language - Language
 * @returns {Object} Basic graph structure
 */
export function transformWorkflowDataSync(toolCalls = [], currentStep = -1, language = 'en') {
  try {
    // Basic transformation without validation and edge case handling
    const { nodes, executedTools } = transformToolCallsToNodes(toolCalls, currentStep);
    const edges = generateWorkflowEdges(nodes, toolCalls, currentStep);
    const nodeStates = determineNodeStates(nodes, toolCalls, currentStep);

    return {
      nodes: Object.values(nodes),
      edges,
      executedTools,
      nodeStates,
      metadata: {
        totalTools: toolCalls.length,
        currentStep,
        isComplete: currentStep === -1,
        syncFallback: true
      }
    };
  } catch (error) {
    console.error('Sync transformation error:', error);
    return {
      nodes: [],
      edges: [],
      executedTools: [],
      nodeStates: { activeNodes: new Set(), executedNodes: new Set(), executingNodes: new Set() },
      metadata: { error: true, syncFallback: true }
    };
  }
}

/**
 * Clear transformation caches (useful for development)
 */
export function clearTransformationCache() {
  transformationCache.clear();
  edgeGenerationCache.clear();
  nodeStatesCache.clear();
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
 * Core workflow nodes that are always present
 * Using function to avoid temporal dead zone issues
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
 * Transform tool calls into graph nodes with enhanced state management
 * @param {Array} toolCalls - Array of tool call objects from backend
 * @param {number} currentStep - Current execution step (-1 for complete workflow)
 * @returns {Object} Object containing nodes and their states
 */
export function transformToolCallsToNodes(toolCalls = [], currentStep = -1) {
  const nodes = { ...getCoreWorkflowNodes() };
  const executedTools = [];
  const activeNodes = new Set(['start', 'agent']);
  const executedNodes = new Set(['start']); // Start is always executed
  const executingNodes = new Set();

  // Process each tool call to create individual tool nodes
  toolCalls.forEach((toolCall, index) => {
    // Handle different tool call formats from backend
    const toolName = toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool;
    
    if (!toolName) {
      console.warn('Tool call missing name:', toolCall);
      return;
    }

    // Handle unknown tools gracefully
    const toolInfo = AVAILABLE_TOOLS[toolName] || {
      icon: '🔧',
      label: { fr: toolName, en: toolName },
      description: { fr: `Outil: ${toolName}`, en: `Tool: ${toolName}` },
      group: 'unknown'
    };

    const nodeId = `tool_${toolName}_${index}`;

    // Create individual tool node with enhanced metadata
    nodes[nodeId] = {
      id: nodeId,
      type: 'tool',
      toolName: toolName,
      label: toolInfo.label,
      description: toolInfo.description,
      icon: toolInfo.icon,
      group: toolInfo.group,
      executionOrder: index + 1,
      isActive: false, // Will be set based on currentStep
      isExecuted: false, // Will be set based on currentStep
      isExecuting: false, // Will be set based on currentStep
      position: { x: 0, y: 0 } // Will be calculated by positioning algorithm
    };

    // Enhanced tool execution tracking with more metadata
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
    activeNodes.add(nodeId);
  });

  // Determine node states based on execution progress
  const nodeStates = determineNodeStates(nodes, toolCalls, currentStep);
  
  // Apply states to all nodes
  Object.keys(nodes).forEach(nodeId => {
    const node = nodes[nodeId];
    node.isActive = nodeStates.activeNodes.has(nodeId);
    node.isExecuted = nodeStates.executedNodes.has(nodeId);
    node.isExecuting = nodeStates.executingNodes.has(nodeId);
  });

  return {
    nodes,
    executedTools,
    activeNodes: nodeStates.activeNodes,
    executedNodes: nodeStates.executedNodes,
    executingNodes: nodeStates.executingNodes
  };
}

/**
 * Generate edges based on enhanced workflow routing logic
 * @param {Object} nodes - Graph nodes object
 * @param {Array} toolCalls - Tool calls for routing logic
 * @param {number} currentStep - Current execution step for state determination
 * @returns {Array} Array of graph edges with enhanced routing logic
 */
export function generateWorkflowEdges(nodes, toolCalls = [], currentStep = -1) {
  const edges = [];
  const nodeIds = Object.keys(nodes);
  
  // Core workflow edges - always present
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

  // Enhanced routing logic based on tool execution
  if (toolNodeIds.length > 0) {
    // Agent to first tool - represents LLM decision to use tools
    edges.push({
      id: `agent-${toolNodeIds[0]}`,
      from: 'agent',
      to: toolNodeIds[0],
      condition: 'tool_execution_start',
      isActive: true,
      isExecuted: currentStep >= 0
    });

    // Chain tools together in execution order
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

    // Determine routing from last tool based on tool types and backend logic
    const lastToolId = toolNodeIds[toolNodeIds.length - 1];
    const lastToolName = nodes[lastToolId]?.toolName;
    
    // Enhanced routing logic based on tool functionality
    const routingDecision = determineToolRouting(toolCalls, lastToolName);
    
    if (routingDecision.requiresResponse) {
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
    } else {
      // Direct to cleanup if no response generation needed
      edges.push({
        id: `${lastToolId}-cleanup_state`,
        from: lastToolId,
        to: 'cleanup_state',
        condition: 'direct_cleanup',
        isActive: true,
        isExecuted: currentStep === -1
      });
    }

    // Cleanup to end - always final step
    edges.push({
      id: 'cleanup_state-end',
      from: 'cleanup_state',
      to: 'end',
      condition: 'workflow_complete',
      isActive: true,
      isExecuted: currentStep === -1
    });

  } else {
    // No tools - direct path from agent to end (rare case)
    edges.push({
      id: 'agent-end',
      from: 'agent',
      to: 'end',
      condition: 'no_tools_needed',
      isActive: currentStep === -1,
      isExecuted: currentStep === -1
    });
  }

  // Error handling edges - activated when errors occur
  const hasErrors = toolCalls.some(tc => tc.error || tc.status === 'error');
  
  edges.push({
    id: 'agent-handle_error',
    from: 'agent',
    to: 'handle_error',
    condition: 'error_detected',
    isActive: hasErrors,
    isExecuted: hasErrors
  });

  // Error recovery path
  if (hasErrors) {
    edges.push({
      id: 'handle_error-cleanup_state',
      from: 'handle_error',
      to: 'cleanup_state',
      condition: 'error_recovery',
      isActive: true,
      isExecuted: true
    });
  }

  // Add conditional routing edges for complex workflows
  addConditionalRoutingEdges(edges, nodes, toolCalls);

  return edges;
}

/**
 * Determine routing decision based on tool types and execution context
 * @param {Array} toolCalls - Array of executed tools
 * @param {string} lastToolName - Name of the last executed tool
 * @returns {Object} Routing decision object
 */
function determineToolRouting(toolCalls, lastToolName) {
  // Tools that typically require response generation
  const responseGeneratingTools = [
    'analyze_risks', 'compare_stocks', 'create_dynamic_chart',
    'display_price_chart', 'get_company_profile'
  ];

  // Tools that are primarily data processing
  const dataProcessingTools = [
    'search_ticker', 'fetch_data', 'preprocess_data',
    'display_raw_data', 'display_processed_data'
  ];

  const hasResponseTools = toolCalls.some(tc => 
    responseGeneratingTools.includes(tc.name || tc.tool_name)
  );

  return {
    requiresResponse: hasResponseTools || responseGeneratingTools.includes(lastToolName),
    isDataProcessing: dataProcessingTools.includes(lastToolName),
    toolCount: toolCalls.length
  };
}

/**
 * Add conditional routing edges for complex workflow scenarios
 * @param {Array} edges - Existing edges array to modify
 * @param {Object} nodes - Graph nodes
 * @param {Array} toolCalls - Tool calls for context
 */
function addConditionalRoutingEdges(edges, nodes, toolCalls) {
  // Add parallel execution paths if multiple tool groups are used
  const toolGroups = new Set();
  Object.values(nodes).forEach(node => {
    if (node.type === 'tool' && node.group) {
      toolGroups.add(node.group);
    }
  });

  // If multiple tool groups, add cross-group connections
  if (toolGroups.size > 1) {
    // This could be enhanced to show parallel execution paths
    // For now, we maintain sequential execution as per current backend logic
  }

  // Add retry edges for failed tools (future enhancement)
  toolCalls.forEach((toolCall, index) => {
    if (toolCall.error && toolCall.retry_count) {
      const toolNodeId = `tool_${toolCall.name || toolCall.tool_name}_${index}`;
      // Could add retry visualization here
    }
  });
}

/**
 * Enhanced node state determination based on execution progress and tool analysis
 * @param {Object} nodes - Graph nodes object
 * @param {Array} toolCalls - Tool calls array
 * @param {number} currentStep - Current execution step (-1 for complete workflow)
 * @returns {Object} Enhanced node states with detailed execution tracking
 */
export function determineNodeStates(nodes, toolCalls = [], currentStep = -1) {
  const states = {
    activeNodes: new Set(),
    executedNodes: new Set(),
    executingNodes: new Set(),
    errorNodes: new Set(),
    inactiveNodes: new Set()
  };

  // Core workflow nodes - always active
  states.activeNodes.add('start');
  states.activeNodes.add('agent');
  states.executedNodes.add('start'); // Start is always executed

  // Analyze tool execution for errors
  const hasErrors = toolCalls.some(tc => tc.error || tc.status === 'error');
  const toolNodeIds = Object.keys(nodes)
    .filter(id => id.startsWith('tool_'))
    .sort((a, b) => (nodes[a].executionOrder || 0) - (nodes[b].executionOrder || 0));

  if (currentStep === -1) {
    // Workflow complete - determine final states
    states.executedNodes.add('agent');
    
    // All tool nodes are executed (successfully or with errors)
    toolNodeIds.forEach(nodeId => {
      states.activeNodes.add(nodeId);
      states.executedNodes.add(nodeId);
      
      // Check if this specific tool had an error
      const toolIndex = parseInt(nodeId.split('_').pop());
      const toolCall = toolCalls[toolIndex];
      if (toolCall && (toolCall.error || toolCall.status === 'error')) {
        states.errorNodes.add(nodeId);
      }
    });

    // Determine which preparation nodes should be active
    if (toolCalls.length > 0) {
      const routingDecision = determineToolRouting(toolCalls);
      
      if (routingDecision.requiresResponse) {
        states.activeNodes.add('generate_final_response');
        states.executedNodes.add('generate_final_response');
      }
      
      states.activeNodes.add('cleanup_state');
      states.activeNodes.add('end');
      states.executedNodes.add('cleanup_state');
      states.executedNodes.add('end');
    } else {
      // No tools executed - direct to end
      states.activeNodes.add('end');
      states.executedNodes.add('end');
    }

    // Handle error nodes if present
    if (hasErrors) {
      states.activeNodes.add('handle_error');
      states.executedNodes.add('handle_error');
    }

  } else {
    // Workflow in progress - determine current execution state
    states.executedNodes.add('agent'); // Agent has made decisions
    
    // Mark completed tools as executed
    for (let i = 0; i < Math.min(currentStep, toolNodeIds.length); i++) {
      const nodeId = toolNodeIds[i];
      states.activeNodes.add(nodeId);
      states.executedNodes.add(nodeId);
      
      // Check for errors in completed tools
      const toolCall = toolCalls[i];
      if (toolCall && (toolCall.error || toolCall.status === 'error')) {
        states.errorNodes.add(nodeId);
      }
    }

    // Mark current tool as executing
    if (currentStep >= 0 && currentStep < toolNodeIds.length) {
      const currentNodeId = toolNodeIds[currentStep];
      states.activeNodes.add(currentNodeId);
      states.executingNodes.add(currentNodeId);
    }

    // Mark future tools as active but not executed
    for (let i = currentStep + 1; i < toolNodeIds.length; i++) {
      states.activeNodes.add(toolNodeIds[i]);
    }

    // Handle post-tool execution states
    if (currentStep >= toolNodeIds.length && toolNodeIds.length > 0) {
      const routingDecision = determineToolRouting(toolCalls);
      
      if (routingDecision.requiresResponse) {
        states.activeNodes.add('generate_final_response');
        if (currentStep === toolNodeIds.length) {
          states.executingNodes.add('generate_final_response');
        } else {
          states.executedNodes.add('generate_final_response');
        }
      }
      
      states.activeNodes.add('cleanup_state');
      states.activeNodes.add('end');
      
      if (currentStep > toolNodeIds.length + (routingDecision.requiresResponse ? 1 : 0)) {
        states.executedNodes.add('cleanup_state');
        states.executingNodes.add('end');
      } else if (currentStep === toolNodeIds.length + (routingDecision.requiresResponse ? 1 : 0)) {
        states.executingNodes.add('cleanup_state');
      }
    }
  }

  // Mark unused core workflow nodes as inactive
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
 * Main transformation function - Enhanced workflow data processing with comprehensive validation.
 * 
 * This is the primary entry point for transforming backend tool calls into complete
 * graph visualization data. The function performs extensive processing including:
 * 
 * 1. **Data Validation**: Validates input structure and normalizes different formats
 * 2. **Edge Case Detection**: Identifies large workflows, concurrent executions, etc.
 * 3. **Node Generation**: Creates nodes for all workflow components with proper metadata
 * 4. **Edge Generation**: Builds connections based on execution flow and routing logic
 * 5. **State Calculation**: Determines active, executed, and executing states
 * 6. **Performance Optimization**: Applies virtualization and caching strategies
 * 7. **Error Handling**: Provides fallback structures for invalid data
 * 8. **Localization**: Applies language-specific labels and descriptions
 * 
 * The function is memoized for performance and includes comprehensive error handling
 * with graceful degradation to ensure the visualization always renders something useful.
 * 
 * @function transformWorkflowData
 * @param {Array<Object>} [toolCalls=[]] - Array of tool call objects from backend
 * @param {Object} toolCalls[].name - Tool name (search_ticker, fetch_data, etc.)
 * @param {Object} [toolCalls[].arguments={}] - Tool arguments/parameters
 * @param {string} [toolCalls[].status='completed'] - Execution status
 * @param {number} [toolCalls[].execution_time=0] - Execution time in milliseconds
 * @param {any} [toolCalls[].result] - Tool execution result
 * @param {string} [toolCalls[].error] - Error message if execution failed
 * @param {number} [currentStep=-1] - Current execution step (-1 for complete workflow)
 * @param {'fr'|'en'} [language='en'] - Language for error messages and fallbacks
 * 
 * @returns {Object} Complete graph data structure
 * @returns {Array<Object>} returns.nodes - Array of positioned graph nodes
 * @returns {Array<Object>} returns.edges - Array of graph connections
 * @returns {Array<Object>} returns.executedTools - Tool execution metadata
 * @returns {Object} returns.nodeStates - Node state information (active, executed, etc.)
 * @returns {Object} returns.executionStats - Execution statistics and metrics
 * @returns {Object} returns.validationResult - Data validation results and warnings
 * @returns {Object} returns.edgeCases - Detected edge cases and optimizations
 * @returns {Array<Object>} returns.performanceRecommendations - Performance optimization suggestions
 * @returns {Object} returns.metadata - Comprehensive metadata about the transformation
 * 
 * @throws {Error} Only in catastrophic failure - normally returns fallback structure
 * 
 * @example
 * ```javascript
 * // Complete workflow transformation
 * const result = transformWorkflowData([
 *   { name: 'search_ticker', arguments: { symbol: 'AAPL' }, status: 'completed' },
 *   { name: 'fetch_data', arguments: { ticker: 'AAPL' }, status: 'completed' },
 *   { name: 'analyze_risks', arguments: { data: '...' }, status: 'executing' }
 * ], 2, 'en');
 * 
 * // Access transformed data
 * const { nodes, edges, nodeStates, metadata } = result;
 * console.log(`Transformed ${nodes.length} nodes and ${edges.length} edges`);
 * console.log(`Active nodes: ${nodeStates.activeNodes.size}`);
 * console.log(`Validation passed: ${metadata.validationPassed}`);
 * ```
 * 
 * @see {@link validateGraphData} For data validation logic
 * @see {@link detectEdgeCases} For edge case detection
 * @see {@link transformToolCallsToNodes} For node generation
 * @see {@link generateWorkflowEdges} For edge generation
 * @see {@link determineNodeStates} For state calculation
 * 
 * @since 1.0.0
 * @author Kiro AI Assistant
 */
export async function transformWorkflowData(toolCalls = [], currentStep = -1, language = 'en') {
  // Check cache first
  const cacheKey = generateTransformationCacheKey(toolCalls, currentStep);
  if (transformationCache.has(cacheKey)) {
    const cachedResult = transformationCache.get(cacheKey);
    // Add language-specific error messages if needed
    if (cachedResult.validationResult) {
      cachedResult.validationResult.language = language;
    }
    return cachedResult;
  }

  let result;
  let validationResult;

  try {
    // Initialize validation module
    await initializeValidation();
    
    // Step 1: Comprehensive data validation
    validationResult = validateGraphData(toolCalls, AVAILABLE_TOOLS);
    
    // Step 2: Handle validation results
    if (!validationResult.isValid) {
      console.error('Graph data validation failed:', validationResult.errors);
      
      // Create fallback structure for completely invalid data
      result = createFallbackGraphStructure(language);
      result.validationResult = validationResult;
      result.metadata.validationFailed = true;
      result.metadata.fallbackReason = 'Invalid data structure';
      
      // Cache and return fallback
      transformationCache.set(cacheKey, result);
      return result;
    }

    // Step 3: Use validated and normalized data
    const normalizedToolCalls = validationResult.normalizedData || [];
    
    // Step 4: Detect edge cases and create optimizations
    await initializeEdgeCases();
    const edgeCases = detectEdgeCases(normalizedToolCalls, { currentStep, language });
    const performanceRecommendations = getPerformanceRecommendations(edgeCases);
    
    // Step 5: Check for empty workflow edge case
    const emptyCase = edgeCases.detected.find(e => e.type === EdgeCaseTypes.EMPTY_WORKFLOW);
    if (emptyCase) {
      const emptyStructure = createOptimizedGraphStructure(normalizedToolCalls, edgeCases, { language });
      result = {
        ...emptyStructure,
        validationResult,
        edgeCases,
        performanceRecommendations,
        metadata: {
          ...emptyStructure.metadata,
          hasEdgeCases: true,
          edgeCaseTypes: [EdgeCaseTypes.EMPTY_WORKFLOW],
          validationPassed: true
        }
      };
      
      // Cache and return empty structure
      transformationCache.set(cacheKey, result);
      return result;
    }
    
    // Step 6: Transform tool calls to nodes with enhanced state tracking
    const { nodes, executedTools } = transformToolCallsToNodes(normalizedToolCalls, currentStep);
    
    // Step 7: Generate edges with enhanced routing logic
    const edges = generateWorkflowEdges(nodes, normalizedToolCalls, currentStep);
    
    // Step 8: Get detailed node states
    const nodeStates = determineNodeStates(nodes, normalizedToolCalls, currentStep);

    // Step 9: Apply enhanced states to all nodes
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      node.isActive = nodeStates.activeNodes.has(nodeId);
      node.isExecuted = nodeStates.executedNodes.has(nodeId);
      node.isExecuting = nodeStates.executingNodes.has(nodeId);
      node.hasError = nodeStates.errorNodes.has(nodeId);
      node.isInactive = nodeStates.inactiveNodes.has(nodeId);
      
      // Apply fallback configurations for unknown tools
      const toolCall = normalizedToolCalls.find(tc => 
        node.toolName && tc.name === node.toolName
      );
      if (toolCall?._fallbackConfig) {
        node.label = toolCall._fallbackConfig.label;
        node.description = toolCall._fallbackConfig.description;
        node.icon = toolCall._fallbackConfig.icon;
        node.group = toolCall._fallbackConfig.group;
        node._isUnknown = true;
        node._fallbackApplied = true;
      }
    });

    // Step 10: Calculate execution statistics
    const executionStats = calculateExecutionStats(normalizedToolCalls, nodeStates);

    // Step 11: Calculate node positions (this was missing!)
    let positionedNodes;
    try {
      const { calculateNodePositions } = await import('./nodePositioning');
      positionedNodes = calculateNodePositions(Object.values(nodes), 800, 600);
    } catch (positionError) {
      console.warn('Position calculation failed, using fallback:', positionError);
      // Fallback: simple grid positioning
      positionedNodes = Object.values(nodes).map((node, index) => ({
        ...node,
        position: {
          x: 100 + (index % 3) * 200,
          y: 100 + Math.floor(index / 3) * 150
        }
      }));
    }

    // Step 12: Apply edge case optimizations if needed
    const optimizedStructure = createOptimizedGraphStructure(normalizedToolCalls, edgeCases, {
      language,
      enableVirtualization: normalizedToolCalls.length > 50,
      enableClustering: edgeCases.detected.some(e => e.type === EdgeCaseTypes.CONCURRENT_EXECUTION),
      maxVisibleNodes: 200
    });

    // Step 13: Build final result with validation and edge case metadata
    result = {
      nodes: positionedNodes,
      edges,
      executedTools,
      nodeStates,
      executionStats,
      validationResult,
      edgeCases,
      performanceRecommendations,
      optimizedStructure: optimizedStructure.metadata?.isOptimized ? optimizedStructure : null,
      metadata: {
        totalTools: normalizedToolCalls.length,
        currentStep,
        isComplete: currentStep === -1,
        hasErrors: nodeStates.errorNodes.size > 0,
        hasWarnings: validationResult.warnings.length > 0,
        unknownToolsCount: validationResult.statistics.unknownTools,
        fallbacksApplied: validationResult.statistics.fallbacksUsed,
        activeToolGroups: getActiveToolGroups(nodes, nodeStates.activeNodes),
        validationPassed: true,
        hasEdgeCases: edgeCases.detected.length > 0,
        edgeCaseTypes: edgeCases.detected.map(e => e.type),
        isLargeWorkflow: normalizedToolCalls.length > 50,
        hasConcurrentExecution: edgeCases.detected.some(e => e.type === EdgeCaseTypes.CONCURRENT_EXECUTION),
        toolCallsSignature: normalizedToolCalls.map(tc => tc.name).join('|')
      }
    };

  } catch (error) {
    console.error('Workflow transformation error:', error);
    
    // Create error fallback structure
    result = createFallbackGraphStructure(language);
    result.validationResult = validationResult || { 
      isValid: false, 
      errors: [{ 
        type: 'transformation_error', 
        message: error.message,
        context: { error: error.stack }
      }],
      warnings: [],
      statistics: { totalItems: 0, validItems: 0 }
    };
    result.metadata.transformationError = error.message;
    result.metadata.fallbackReason = 'Transformation exception';
  }

  // Cache the result
  transformationCache.set(cacheKey, result);
  
  // Limit cache size to prevent memory leaks
  if (transformationCache.size > 30) {
    const firstKey = transformationCache.keys().next().value;
    transformationCache.delete(firstKey);
  }

  return result;
}

/**
 * Normalize tool calls from different backend formats
 * @param {Array} toolCalls - Raw tool calls from backend
 * @returns {Array} Normalized tool calls
 */
function normalizeToolCalls(toolCalls = []) {
  return toolCalls.map((toolCall, index) => {
    // Handle different backend formats
    const normalized = {
      name: toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool,
      arguments: toolCall.arguments || toolCall.input || toolCall.args || {},
      result: toolCall.result || toolCall.output,
      error: toolCall.error,
      status: toolCall.status || (toolCall.error ? 'error' : 'completed'),
      execution_time: toolCall.execution_time || toolCall.duration || 0,
      timestamp: toolCall.timestamp || Date.now(),
      index: index
    };

    // Validate required fields
    if (!normalized.name) {
      console.warn(`Tool call at index ${index} missing name:`, toolCall);
      normalized.name = `unknown_tool_${index}`;
    }

    return normalized;
  });
}

/**
 * Calculate execution statistics for the workflow
 * @param {Array} toolCalls - Normalized tool calls
 * @param {Object} nodeStates - Node states object
 * @returns {Object} Execution statistics
 */
function calculateExecutionStats(toolCalls, nodeStates) {
  const totalExecutionTime = toolCalls.reduce((sum, tc) => sum + (tc.execution_time || 0), 0);
  const errorCount = nodeStates.errorNodes.size;
  const successCount = toolCalls.length - errorCount;

  return {
    totalExecutionTime,
    averageExecutionTime: toolCalls.length > 0 ? totalExecutionTime / toolCalls.length : 0,
    successRate: toolCalls.length > 0 ? (successCount / toolCalls.length) * 100 : 100,
    errorCount,
    successCount,
    totalSteps: nodeStates.activeNodes.size
  };
}

/**
 * Get active tool groups for visualization grouping
 * @param {Object} nodes - Graph nodes
 * @param {Set} activeNodes - Set of active node IDs
 * @returns {Array} Array of active tool groups
 */
function getActiveToolGroups(nodes, activeNodes) {
  const groups = new Set();
  
  Object.values(nodes).forEach(node => {
    if (node.type === 'tool' && activeNodes.has(node.id) && node.group) {
      groups.add(node.group);
    }
  });
  
  return Array.from(groups);
}

/**
 * Validate workflow data structure
 * @param {Array} toolCalls - Tool calls to validate
 * @returns {Object} Validation result with errors and warnings
 */
export function validateWorkflowData(toolCalls = []) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if toolCalls is an array
  if (!Array.isArray(toolCalls)) {
    validation.isValid = false;
    validation.errors.push('toolCalls must be an array');
    return validation;
  }

  // Validate each tool call
  toolCalls.forEach((toolCall, index) => {
    if (!toolCall || typeof toolCall !== 'object') {
      validation.errors.push(`Tool call at index ${index} is not an object`);
      validation.isValid = false;
      return;
    }

    const toolName = toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool;
    if (!toolName) {
      validation.warnings.push(`Tool call at index ${index} missing name property`);
    }

    // Check for unknown tools
    if (toolName && !AVAILABLE_TOOLS[toolName]) {
      validation.warnings.push(`Unknown tool "${toolName}" at index ${index}`);
    }

    // Validate arguments
    if (toolCall.arguments && typeof toolCall.arguments !== 'object') {
      validation.warnings.push(`Tool call "${toolName}" at index ${index} has invalid arguments format`);
    }
  });

  return validation;
}

/**
 * Get tool execution summary for debugging and monitoring
 * @param {Array} toolCalls - Tool calls array
 * @returns {Object} Execution summary
 */
export function getExecutionSummary(toolCalls = []) {
  const summary = {
    totalTools: toolCalls.length,
    toolTypes: {},
    toolGroups: {},
    executionOrder: [],
    errors: [],
    totalTime: 0
  };

  toolCalls.forEach((toolCall, index) => {
    const toolName = toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool;
    const toolInfo = AVAILABLE_TOOLS[toolName];
    
    // Count tool types
    if (toolName) {
      summary.toolTypes[toolName] = (summary.toolTypes[toolName] || 0) + 1;
      summary.executionOrder.push({
        index,
        toolName,
        status: toolCall.status || (toolCall.error ? 'error' : 'completed'),
        executionTime: toolCall.execution_time || 0
      });
    }

    // Count tool groups
    if (toolInfo?.group) {
      summary.toolGroups[toolInfo.group] = (summary.toolGroups[toolInfo.group] || 0) + 1;
    }

    // Track errors
    if (toolCall.error) {
      summary.errors.push({
        index,
        toolName,
        error: toolCall.error
      });
    }

    // Sum execution time
    summary.totalTime += toolCall.execution_time || 0;
  });

  return summary;
}