/**
 * Simple tests for content extraction functionality
 * These tests verify that the content extraction system works correctly
 */

import {
  extractUserQuery,
  extractToolSummary,
  truncateText,
  formatToolName,
  createTruncatedContent
} from './contentExtractor';

// Test data
const mockToolCalls = [
  {
    name: 'fetch_data',
    arguments: { ticker: 'AAPL' },
    status: 'completed'
  },
  {
    name: 'analyze_risks',
    arguments: { ticker: 'AAPL' },
    status: 'completed'
  }
];

const mockLangSmithData = {
  thread_id: 'test_thread_123',
  tool_calls: [
    {
      name: 'search_ticker',
      arguments: { ticker: 'MSFT' },
      status: 'completed'
    }
  ]
};

// Test functions
function testExtractUserQuery() {
  console.log('Testing extractUserQuery...');
  
  // Test with tool calls
  const result1 = extractUserQuery(mockToolCalls, null, null);
  console.log('Tool calls result:', result1);
  
  // Test with LangSmith data
  const result2 = extractUserQuery(null, null, mockLangSmithData);
  console.log('LangSmith result:', result2);
  
  // Test with thread ID
  const result3 = extractUserQuery(null, 'AAPL_analysis_session', null);
  console.log('Thread ID result:', result3);
  
  return result1.primary.includes('AAPL') && result2.primary.includes('MSFT');
}

function testExtractToolSummary() {
  console.log('Testing extractToolSummary...');
  
  // Test with multiple tools
  const result1 = extractToolSummary(mockToolCalls, null);
  console.log('Multiple tools result:', result1);
  
  // Test with single tool
  const result2 = extractToolSummary([mockToolCalls[0]], null);
  console.log('Single tool result:', result2);
  
  // Test with LangSmith data
  const result3 = extractToolSummary(null, mockLangSmithData);
  console.log('LangSmith tools result:', result3);
  
  return result1.primary.includes('2 Tools') && result2.primary.includes('Fetch Data');
}

function testTruncateText() {
  console.log('Testing truncateText...');
  
  const longText = 'This is a very long text that should be truncated properly';
  const result1 = truncateText(longText, 20);
  console.log('Truncated text:', result1);
  
  const shortText = 'Short text';
  const result2 = truncateText(shortText, 20);
  console.log('Short text (no truncation):', result2);
  
  return result1.length <= 20 && result1.includes('...') && result2 === shortText;
}

function testFormatToolName() {
  console.log('Testing formatToolName...');
  
  const result1 = formatToolName('fetch_data');
  const result2 = formatToolName('analyze_risks');
  const result3 = formatToolName('get_stock_news');
  
  console.log('Formatted names:', result1, result2, result3);
  
  return result1 === 'Fetch Data' && result2 === 'Analyze Risks' && result3 === 'Get Stock News';
}

function testCreateTruncatedContent() {
  console.log('Testing createTruncatedContent...');
  
  const content = {
    primary: 'This is a very long primary text that should be truncated',
    secondary: 'This is also a long secondary text',
    detail: 'And this is an even longer detail text that definitely needs truncation',
    source: 'test'
  };
  
  const result = createTruncatedContent(content, {
    primary: 15,
    secondary: 20,
    detail: 25
  });
  
  console.log('Truncated content:', result);
  
  return result.primary.length <= 15 && result.secondary.length <= 20 && result.detail.length <= 25;
}

// Run tests
export function runContentExtractionTests() {
  console.log('🧪 Running Content Extraction Tests...');
  
  const tests = [
    { name: 'extractUserQuery', fn: testExtractUserQuery },
    { name: 'extractToolSummary', fn: testExtractToolSummary },
    { name: 'truncateText', fn: testTruncateText },
    { name: 'formatToolName', fn: testFormatToolName },
    { name: 'createTruncatedContent', fn: testCreateTruncatedContent }
  ];
  
  const results = tests.map(test => {
    try {
      const passed = test.fn();
      console.log(`✅ ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      return { name: test.name, passed };
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR -`, error);
      return { name: test.name, passed: false, error };
    }
  });
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n📊 Test Results: ${passedCount}/${results.length} tests passed`);
  
  return results;
}

// Export for use in development
if (typeof window !== 'undefined') {
  window.runContentExtractionTests = runContentExtractionTests;
}