/**
 * Simple test for debug content extraction
 */

import {
  debugExtractUserQuery,
  debugExtractToolSummary,
  debugExtractNodeContent,
  simpleCreateContent
} from './contentExtractor.debug';

// Test the debug functions
console.log('Testing debug content extraction...');

// Test user query extraction
const testToolCalls = [
  { name: 'fetch_data', arguments: { ticker: 'AAPL' } }
];

const userQuery = debugExtractUserQuery(testToolCalls);
console.log('User query result:', userQuery);

// Test tool summary
const toolSummary = debugExtractToolSummary(testToolCalls);
console.log('Tool summary result:', toolSummary);

// Test node content
const testNode = { id: 'agent', type: 'agent' };
const nodeContent = debugExtractNodeContent(testNode);
console.log('Node content result:', nodeContent);

// Test simple content creation
const simpleContent = simpleCreateContent('Test Primary', 'Test Secondary', 'Test Detail');
console.log('Simple content result:', simpleContent);

console.log('Debug tests completed successfully!');