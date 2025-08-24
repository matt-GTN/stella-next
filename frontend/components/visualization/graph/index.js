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
