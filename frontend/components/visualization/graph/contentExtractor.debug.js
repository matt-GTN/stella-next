/**
 * Debug version of content extractor with minimal dependencies
 * This helps isolate any issues with the content extraction system
 */

// Simple truncate function without complex logic
export function simpleTruncateText(text, maxLength) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

// Simple content creation without complex processing
export function simpleCreateContent(primary, secondary = null, detail = null) {
  return {
    primary: simpleTruncateText(primary || 'Unknown', 18),
    secondary: secondary ? simpleTruncateText(secondary, 22) : null,
    detail: detail ? simpleTruncateText(detail, 25) : null,
    source: 'simple'
  };
}

// Debug version of user query extraction
export function debugExtractUserQuery(toolCalls) {
  try {
    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      const firstTool = toolCalls[0];
      if (firstTool?.arguments?.ticker) {
        return simpleCreateContent(
          `Analyze ${firstTool.arguments.ticker}`,
          'Financial Analysis',
          `Query: ${firstTool.arguments.ticker}`
        );
      }
    }
    return simpleCreateContent('Financial Analysis', 'User Query', 'General analysis');
  } catch (error) {
    console.error('Debug extract user query error:', error);
    return simpleCreateContent('Error', 'Query Error', 'Failed to extract');
  }
}

// Debug version of tool summary extraction
export function debugExtractToolSummary(toolCalls) {
  try {
    if (!toolCalls || !Array.isArray(toolCalls) || toolCalls.length === 0) {
      return simpleCreateContent('No Tools', 'No Execution', 'No tools executed');
    }
    
    const toolName = toolCalls[0]?.name || 'Tool';
    if (toolCalls.length === 1) {
      return simpleCreateContent(toolName, 'Single Tool', `Executed: ${toolName}`);
    } else {
      return simpleCreateContent(
        `${toolCalls.length} Tools`,
        'Multiple Tools',
        `${toolCalls.length} tools executed`
      );
    }
  } catch (error) {
    console.error('Debug extract tool summary error:', error);
    return simpleCreateContent('Error', 'Tool Error', 'Failed to extract');
  }
}

// Debug version of node content extraction
export function debugExtractNodeContent(node) {
  try {
    const nodeId = node.id;
    const nodeType = node.type;

    switch (nodeType) {
      case 'start':
        return simpleCreateContent('Start', null, 'Workflow start');
      case 'end':
        return simpleCreateContent('End', null, 'Workflow complete');
      case 'agent':
        return simpleCreateContent('Agent', 'Analysis', 'LLM decision');
      case 'tool_execution':
        return simpleCreateContent('Tools', 'Execution', 'Tool execution');
      case 'preparation':
        return simpleCreateContent(nodeId.replace(/_/g, ' '), 'Preparation', `Step: ${nodeId}`);
      default:
        return simpleCreateContent(nodeId, nodeType, `Node: ${nodeId}`);
    }
  } catch (error) {
    console.error('Debug extract node content error:', error);
    return simpleCreateContent('Error', 'Node Error', 'Failed to extract');
  }
}

// Safe extraction wrapper
export function debugSafeExtraction(extractorFn, fallback) {
  try {
    return extractorFn();
  } catch (error) {
    console.error('Debug safe extraction error:', error);
    return fallback || simpleCreateContent('Error', 'Extraction Error', 'Safe fallback');
  }
}