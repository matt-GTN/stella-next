/**
 * Edge Consolidation Utilities
 * 
 * This module provides utility functions for identifying and consolidating
 * duplicate edges in the graph visualization system.
 * Implements Requirements 5.1, 5.2, 5.3, 5.4 for edge deduplication.
 */

/**
 * Generate a unique key for an edge connection
 * Used to identify duplicate paths between the same nodes
 * 
 * @param {Object} edge - Edge object with from/to properties
 * @returns {string} Unique connection key
 */
export function generateConnectionKey(edge) {
  const fromId = edge.from || edge.fromId || edge.source;
  const toId = edge.to || edge.toId || edge.target;
  
  if (!fromId || !toId) {
    console.warn('Edge missing from/to identifiers:', edge);
    return `unknown-${Math.random()}`;
  }
  
  return `${fromId}->${toId}`;
}

/**
 * Check if two edges represent the same connection
 * Implements Requirement 5.1 for identifying duplicate paths
 * 
 * @param {Object} edge1 - First edge object
 * @param {Object} edge2 - Second edge object
 * @returns {boolean} True if edges connect the same nodes
 */
export function areEdgesDuplicate(edge1, edge2) {
  return generateConnectionKey(edge1) === generateConnectionKey(edge2);
}

/**
 * Select the most relevant edge from a group of duplicates
 * Implements Requirement 5.2 for preserving most relevant edge properties
 * 
 * @param {Array} duplicateEdges - Array of duplicate edge objects
 * @returns {Object} Most relevant edge to use as base for consolidation
 */
export function selectMostRelevantEdge(duplicateEdges) {
  if (!duplicateEdges || duplicateEdges.length === 0) return null;
  if (duplicateEdges.length === 1) return duplicateEdges[0];
  
  // Priority order for selecting most relevant edge:
  // 1. Executed edges (highest priority)
  // 2. Active edges
  // 3. Edges with specific conditions (not generic)
  // 4. Edges with valid path data
  // 5. First edge as fallback
  
  // First, try to find an executed edge
  const executedEdge = duplicateEdges.find(edge => edge.isExecuted);
  if (executedEdge) return executedEdge;
  
  // Next, try to find an active edge
  const activeEdge = duplicateEdges.find(edge => edge.isActive || edge.highlighted);
  if (activeEdge) return activeEdge;
  
  // Then, try to find an edge with a specific condition
  const specificConditionEdge = duplicateEdges.find(edge => 
    edge.condition && 
    edge.condition !== 'default' && 
    edge.condition !== 'generic'
  );
  if (specificConditionEdge) return specificConditionEdge;
  
  // Finally, try to find an edge with valid path data
  const validPathEdge = duplicateEdges.find(edge => edge.d && edge.d.length > 0);
  if (validPathEdge) return validPathEdge;
  
  // Fallback to first edge
  return duplicateEdges[0];
}

/**
 * Consolidate execution status from multiple duplicate edges
 * Implements Requirement 5.3 for maintaining correct highlighting and execution status
 * 
 * @param {Array} duplicateEdges - Array of duplicate edge objects
 * @returns {Object} Consolidated execution status properties
 */
export function consolidateExecutionStatus(duplicateEdges) {
  if (!duplicateEdges || duplicateEdges.length === 0) {
    return {
      isExecuted: false,
      isActive: false,
      highlighted: false,
      isUnused: true
    };
  }
  
  // Edge is executed if ANY duplicate was executed
  const isExecuted = duplicateEdges.some(edge => edge.isExecuted);
  
  // Edge is active if ANY duplicate was active
  const isActive = duplicateEdges.some(edge => edge.isActive || edge.highlighted);
  
  // Edge is highlighted if ANY duplicate was highlighted
  const highlighted = duplicateEdges.some(edge => edge.highlighted);
  
  // Edge is unused only if ALL duplicates were unused AND none were executed/active
  const isUnused = duplicateEdges.every(edge => edge.isUnused) && !isExecuted && !isActive;
  
  return {
    isExecuted,
    isActive,
    highlighted,
    isUnused
  };
}

/**
 * Consolidate visual properties from multiple duplicate edges
 * Implements Requirement 5.4 for ensuring visual consistency
 * 
 * @param {Array} duplicateEdges - Array of duplicate edge objects
 * @returns {Object} Consolidated visual properties
 */
export function consolidateVisualProperties(duplicateEdges) {
  if (!duplicateEdges || duplicateEdges.length === 0) {
    return {
      curveType: 'horizontal',
      dashed: false,
      condition: 'default'
    };
  }
  
  const mostRelevantEdge = selectMostRelevantEdge(duplicateEdges);
  
  // Use curve type from the most relevant edge (executed edges take priority)
  const executedEdge = duplicateEdges.find(edge => edge.isExecuted);
  const curveType = (executedEdge?.curveType || mostRelevantEdge?.curveType || 'horizontal');
  
  // Consolidate dashed property - edge is dashed if any duplicate was dashed
  const dashed = duplicateEdges.some(edge => edge.dashed);
  
  // Use the most specific condition (non-generic conditions take priority)
  const specificCondition = duplicateEdges.find(edge => 
    edge.condition && 
    edge.condition !== 'default' && 
    edge.condition !== 'generic'
  )?.condition;
  
  const condition = specificCondition || mostRelevantEdge?.condition || 'default';
  
  return {
    curveType,
    dashed,
    condition
  };
}

/**
 * Consolidate a group of duplicate edges into a single edge
 * Main consolidation function that combines all consolidation logic
 * 
 * @param {Array} duplicateEdges - Array of duplicate edge objects
 * @returns {Object} Single consolidated edge object
 */
export function consolidateEdgeGroup(duplicateEdges) {
  if (!duplicateEdges || duplicateEdges.length === 0) return null;
  if (duplicateEdges.length === 1) return duplicateEdges[0];
  
  const mostRelevantEdge = selectMostRelevantEdge(duplicateEdges);
  const executionStatus = consolidateExecutionStatus(duplicateEdges);
  const visualProperties = consolidateVisualProperties(duplicateEdges);
  
  // Create consolidated edge preserving most relevant properties
  const consolidatedEdge = {
    // Use most relevant edge as base
    ...mostRelevantEdge,
    
    // Override with consolidated properties
    ...executionStatus,
    ...visualProperties,
    
    // Preserve the most important ID (prefer non-generated IDs)
    id: duplicateEdges.find(e => e.id && !e.id.startsWith('edge-'))?.id || mostRelevantEdge.id,
    
    // Keep the path data from the most relevant edge
    d: (duplicateEdges.find(e => e.isExecuted)?.d || mostRelevantEdge?.d || ''),
    
    // Preserve detail edge status if any duplicate was a detail edge
    isDetailEdge: duplicateEdges.some(e => e.isDetailEdge),
    
    // Use the lowest index for consistent ordering
    index: Math.min(...duplicateEdges.map(e => e.index || 0)),
    
    // Mark as consolidated for debugging and visual indicators
    isConsolidated: true,
    originalCount: duplicateEdges.length,
    
    // Store original edges for debugging
    originalEdges: duplicateEdges.map(e => ({ id: e.id, condition: e.condition }))
  };
  
  return consolidatedEdge;
}

/**
 * Group edges by their connection and consolidate duplicates
 * Main entry point for edge deduplication system
 * 
 * @param {Array} edges - Array of all edge objects
 * @returns {Array} Array of consolidated edges with duplicates removed
 */
export function deduplicateAndConsolidateEdges(edges) {
  if (!edges || edges.length === 0) return [];
  
  console.log(`🔗 [Edge Consolidation] Starting deduplication of ${edges.length} edges`);
  
  // Group edges by their connection (from -> to)
  const edgeGroups = new Map();
  
  edges.forEach(edge => {
    const connectionKey = generateConnectionKey(edge);
    
    if (!edgeGroups.has(connectionKey)) {
      edgeGroups.set(connectionKey, []);
    }
    edgeGroups.get(connectionKey).push(edge);
  });
  
  console.log(`🔗 [Edge Consolidation] Found ${edgeGroups.size} unique connections`);
  
  // Consolidate each group
  const consolidatedEdges = [];
  let duplicatesFound = 0;
  
  edgeGroups.forEach((duplicateEdges, connectionKey) => {
    if (duplicateEdges.length > 1) {
      duplicatesFound += duplicateEdges.length - 1;
      console.log(`🔗 [Edge Consolidation] Consolidating ${duplicateEdges.length} duplicate edges for ${connectionKey}`);
    }
    
    const consolidatedEdge = consolidateEdgeGroup(duplicateEdges);
    if (consolidatedEdge) {
      consolidatedEdges.push(consolidatedEdge);
    }
  });
  
  console.log(`🔗 [Edge Consolidation] Removed ${duplicatesFound} duplicate edges, ${consolidatedEdges.length} edges remaining`);
  
  return consolidatedEdges;
}

/**
 * Validate edge consolidation results
 * Utility function to verify consolidation worked correctly
 * 
 * @param {Array} originalEdges - Original edge array before consolidation
 * @param {Array} consolidatedEdges - Consolidated edge array after deduplication
 * @returns {Object} Validation results and statistics
 */
export function validateConsolidation(originalEdges, consolidatedEdges) {
  const originalConnections = new Set(originalEdges.map(generateConnectionKey));
  const consolidatedConnections = new Set(consolidatedEdges.map(generateConnectionKey));
  
  const duplicatesRemoved = originalEdges.length - consolidatedEdges.length;
  const connectionsPreserved = originalConnections.size === consolidatedConnections.size;
  
  // Check for any lost connections
  const lostConnections = [];
  originalConnections.forEach(connection => {
    if (!consolidatedConnections.has(connection)) {
      lostConnections.push(connection);
    }
  });
  
  return {
    originalCount: originalEdges.length,
    consolidatedCount: consolidatedEdges.length,
    duplicatesRemoved,
    connectionsPreserved,
    lostConnections,
    isValid: connectionsPreserved && lostConnections.length === 0
  };
}