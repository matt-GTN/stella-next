/**
 * Graph visualization components export index
 * Provides clean imports for all graph-related components
 */

// Main agent decision visualization component
export { default as AgentDecisionDAG } from './AgentDecisionDAG';

// Wrapper component that handles both LangSmith and legacy data
export { default as GraphVisualizationWrapper } from './GraphVisualizationWrapper';

// Data processing utilities
export { 
  transformWorkflowData,
  transformToolCallsToNodes,
  generateWorkflowEdges,
  determineNodeStates,
  transformWorkflowDataSync,
  clearTransformationCache
} from './workflowTransformer';

// LangSmith data processing utilities
export {
  transformLangSmithData,
  fetchLangSmithTrace,
  hasLangSmithTrace,
  getLangSmithGraphData,
  clearLangSmithCache
} from './langsmithTransformer';

// Utility function to clear all caches
export function clearAllGraphCaches() {
  const { clearTransformationCache } = require('./workflowTransformer');
  const { clearLangSmithCache } = require('./langsmithTransformer');
  
  clearTransformationCache();
  clearLangSmithCache();
  console.log('🧹 [GraphVisualization] All caches cleared');
}

// Utility function to clear caches for a specific message
export function clearMessageGraphCache(messageId) {
  const { clearTransformationCache } = require('./workflowTransformer');
  const { clearLangSmithCache } = require('./langsmithTransformer');
  
  // For now, clear all caches since we don't have message-specific clearing
  // In the future, we could implement selective cache clearing
  clearTransformationCache();
  clearLangSmithCache();
  console.log('🧹 [GraphVisualization] Caches cleared for message:', messageId);
}

// Content extraction utilities
export {
  extractUserQuery,
  extractToolSummary,
  extractNodeContent,
  truncateText,
  createTruncatedContent,
  safeContentExtraction,
  formatToolName
} from './contentExtractor';

// Re-export the main component as default
export { default } from './AgentDecisionDAG';
