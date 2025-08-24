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

// Simple content creation without complex processing - longer text for wrapping
export function simpleCreateContent(primary, secondary = null, detail = null, isDetailNode = false) {
  // Use much longer text limits since we now have proper text wrapping
  const primaryLimit = isDetailNode ? 45 : 25; // Increased limits for detail nodes
  const secondaryLimit = isDetailNode ? 55 : 30; // Increased limits for detail nodes
  const detailLimit = isDetailNode ? 90 : 40; // Increased limits for detail nodes
  
  // Clean up secondary and detail to avoid duplicates
  const cleanPrimary = simpleTruncateText(primary || 'Unknown', primaryLimit);
  const cleanSecondary = secondary && secondary !== primary ? 
    simpleTruncateText(secondary, secondaryLimit) : null;
  const cleanDetail = detail && detail !== primary && detail !== secondary ? 
    simpleTruncateText(detail, detailLimit) : null;
  
  return {
    primary: cleanPrimary,
    secondary: cleanSecondary,
    detail: cleanDetail,
    source: 'simple',
    isDetailNode
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
export function debugExtractNodeContent(node, graphData = null) {
  try {
    const nodeId = node.id;
    const nodeType = node.type;

    // Add debugging for detail nodes
    if (nodeId === 'agent_query_detail' || nodeId.includes('execute_tool_detail')) {
      console.log('🔍 [ContentExtractor] Processing detail node:', {
        nodeId,
        nodeType,
        nodeData: node.data,
        nodeMetadata: node.metadata,
        nodeLabel: node.label,
        graphDataKeys: graphData ? Object.keys(graphData) : 'no graphData'
      });
    }

    // Handle special detail nodes with actual content
    if (nodeId === 'agent_query_detail') {
      // Extract actual user query from node data and graph context
      const userQuery = extractUserQueryFromNode(node, graphData);
      console.log('🔍 [ContentExtractor] Extracted user query:', userQuery);
      
      // For user query detail, show the actual query as primary text
      // Only show secondary/detail if they contain different meaningful information
      const hasDistinctSecondary = userQuery.secondary && 
        userQuery.secondary !== userQuery.primary && 
        userQuery.secondary !== 'User Input' && 
        userQuery.secondary !== 'Query Details';
      
      const hasDistinctDetail = userQuery.detail && 
        userQuery.detail !== userQuery.primary && 
        userQuery.detail !== userQuery.secondary &&
        userQuery.detail !== 'User input';
      
      return simpleCreateContent(
        userQuery.primary || 'User Query',
        hasDistinctSecondary ? userQuery.secondary : null,
        hasDistinctDetail ? userQuery.detail : null,
        true // isDetailNode = true for larger text limits
      );
    }

    if (nodeId.includes('execute_tool_detail')) {
      // Extract actual tool details from node data and graph context
      const toolDetails = extractToolDetailsFromNode(node, graphData);
      console.log('🔍 [ContentExtractor] Extracted tool details:', toolDetails);
      
      // For tool detail, show the actual tool name(s) as primary text
      // Only show secondary/detail if they contain different meaningful information
      const hasDistinctSecondary = toolDetails.secondary && 
        toolDetails.secondary !== toolDetails.primary && 
        toolDetails.secondary !== 'Tool Execution' && 
        toolDetails.secondary !== 'Execution';
      
      const hasDistinctDetail = toolDetails.detail && 
        toolDetails.detail !== toolDetails.primary && 
        toolDetails.detail !== toolDetails.secondary &&
        toolDetails.detail !== 'Tool arguments';
      
      return simpleCreateContent(
        toolDetails.primary || 'Tool Details',
        hasDistinctSecondary ? toolDetails.secondary : null,
        hasDistinctDetail ? toolDetails.detail : null,
        true // isDetailNode = true for larger text limits
      );
    }

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

// Extract actual user query from node data
function extractUserQueryFromNode(node, graphData = null) {
  try {
    console.log('🔍 [UserQuery] Extracting from node:', {
      nodeId: node.id,
      nodeData: node.data,
      nodeMetadata: node.metadata,
      nodeLabel: node.label,
      rawToolCalls: node.rawToolCalls,
      rawThreadId: node.rawThreadId
    });

    // First try to get query from the node itself
    let query = node.data?.query || 
                node.data?.input || 
                node.data?.user_input ||
                node.data?.message ||
                node.metadata?.query ||
                node.metadata?.input ||
                node.label;

    // Try to extract from rawToolCalls if available (LangSmith data)
    if (!query && node.rawToolCalls && Array.isArray(node.rawToolCalls) && node.rawToolCalls.length > 0) {
      console.log('🔍 [UserQuery] Examining rawToolCalls structure:', node.rawToolCalls);
      
      // Look for user query in the first tool call or tool call context
      const firstToolCall = node.rawToolCalls[0];
      console.log('🔍 [UserQuery] First tool call structure:', firstToolCall);
      
      query = firstToolCall?.user_query || 
              firstToolCall?.input || 
              firstToolCall?.context?.user_query ||
              firstToolCall?.context?.input ||
              firstToolCall?.query ||
              firstToolCall?.message;
      
      console.log('🔍 [UserQuery] Found in rawToolCalls:', query);
    }

    // If not found in node, try to find it in the graph data
    if (!query && graphData) {
      console.log('🔍 [UserQuery] Searching in graphData:', {
        graphDataMetadata: graphData.metadata,
        graphDataKeys: Object.keys(graphData),
        hasNodes: !!graphData.nodes
      });

      // Look for user input in graph metadata or initial data
      query = graphData.metadata?.user_query ||
              graphData.metadata?.input ||
              graphData.metadata?.message ||
              graphData.initialInput ||
              graphData.userQuery;

      // Also check if there's a start node with user input
      const startNode = graphData.nodes?.find(n => n.id === '__start__' || n.type === 'start');
      if (startNode && !query) {
        console.log('🔍 [UserQuery] Found start node:', startNode);
        query = startNode.data?.query || startNode.data?.input || startNode.metadata?.input;
      }

      // Try to extract from any tool calls in the graph metadata
      if (!query && graphData.metadata?.tool_calls) {
        console.log('🔍 [UserQuery] Checking tool_calls in metadata:', graphData.metadata.tool_calls);
        const firstToolCall = Array.isArray(graphData.metadata.tool_calls) ? 
          graphData.metadata.tool_calls[0] : graphData.metadata.tool_calls;
        
        query = firstToolCall?.user_query || 
                firstToolCall?.input || 
                firstToolCall?.context?.user_query ||
                firstToolCall?.query;
      }

      // Try to extract from executedTools in metadata
      if (!query && graphData.executedTools && Array.isArray(graphData.executedTools) && graphData.executedTools.length > 0) {
        console.log('🔍 [UserQuery] Checking executedTools:', graphData.executedTools);
        const firstTool = graphData.executedTools[0];
        query = firstTool?.user_query || firstTool?.input || firstTool?.context?.query;
      }

      // Try to extract from any node that might have user input
      if (!query && graphData.nodes) {
        for (const graphNode of graphData.nodes) {
          if (graphNode.rawToolCalls && Array.isArray(graphNode.rawToolCalls)) {
            for (const toolCall of graphNode.rawToolCalls) {
              query = toolCall?.user_query || 
                      toolCall?.input || 
                      toolCall?.context?.user_query ||
                      toolCall?.query ||
                      toolCall?.message;
              if (query) {
                console.log('🔍 [UserQuery] Found query in node tool calls:', query);
                break;
              }
            }
            if (query) break;
          }
        }
      }
    }

    console.log('🔍 [UserQuery] Final query found:', query);

    if (typeof query === 'string' && query.length > 0) {
      // For user query nodes, only show the query itself, no duplicate content
      return {
        primary: simpleTruncateText(query, 45),
        secondary: null, // Don't show 'User Input' as it's redundant
        detail: null // Don't duplicate the query
      };
    }

    // If we have rawToolCalls but no explicit query, try to infer from tool usage and arguments
    if (node.rawToolCalls && Array.isArray(node.rawToolCalls) && node.rawToolCalls.length > 0) {
      const allToolNames = node.rawToolCalls.map(tc => tc?.name || tc?.tool_name || '').filter(Boolean);
      const firstTool = node.rawToolCalls[0];
      const toolName = firstTool?.name || firstTool?.tool_name || 'tool';
      
      // Try to extract specific parameters that might indicate the query
      let specificQuery = '';
      for (const toolCall of node.rawToolCalls) {
        let args = toolCall?.arguments || toolCall?.args;
        if (typeof args === 'string') {
          try {
            args = JSON.parse(args);
          } catch (e) {}
        }
        
        if (args && typeof args === 'object') {
          // Look for ticker, symbol, company, etc.
          const ticker = args.ticker || args.symbol || args.company;
          const query_text = args.query || args.question || args.search;
          
          if (ticker) {
            specificQuery = `Analyze ${ticker}`;
            break;
          } else if (query_text) {
            specificQuery = query_text;
            break;
          }
        }
      }
      
      if (specificQuery) {
        return {
          primary: simpleTruncateText(specificQuery, 45),
          secondary: null, // Don't repeat the query
          detail: null // Don't duplicate content
        };
      }
      
      // Create a meaningful fallback based on tool usage - single line only
      if (allToolNames.some(name => name.includes('stock') || name.includes('ticker') || name.includes('fetch'))) {
        return {
          primary: 'Stock Analysis Request',
          secondary: null,
          detail: null
        };
      } else if (allToolNames.some(name => name.includes('news'))) {
        return {
          primary: 'News Information Request',
          secondary: null,
          detail: null
        };
      } else if (allToolNames.some(name => name.includes('chart') || name.includes('display'))) {
        return {
          primary: 'Data Visualization Request',
          secondary: null,
          detail: null
        };
      }
    }

    return {
      primary: 'User Query',
      secondary: null, // Don't show redundant 'Input'
      detail: null // Don't show redundant detail
    };
  } catch (error) {
    console.error('Error extracting user query:', error);
    return {
      primary: 'Query Error',
      secondary: 'Error',
      detail: 'Failed to extract query'
    };
  }
}

// Extract actual tool details from node data
function extractToolDetailsFromNode(node, graphData = null) {
  try {
    console.log('🔍 [ToolDetails] Extracting from node:', {
      nodeId: node.id,
      nodeData: node.data,
      nodeMetadata: node.metadata
    });

    // First try to get tool data from the node itself
    let toolData = node.data?.tool || 
                   node.data?.tool_call ||
                   node.data?.execution ||
                   node.metadata?.tool ||
                   {};

    let toolName = toolData.name || 
                   toolData.tool_name ||
                   node.data?.name ||
                   node.data?.tool_name;

    let toolArgs = toolData.arguments || 
                   toolData.args ||
                   toolData.parameters ||
                   node.data?.arguments ||
                   node.data?.args;

    console.log('🔍 [ToolDetails] Initial extraction:', { toolName, toolArgs, toolData });

    // Try to extract from rawToolCalls if available (LangSmith data)
    if (!toolName && node.rawToolCalls && Array.isArray(node.rawToolCalls) && node.rawToolCalls.length > 0) {
      console.log('🔍 [ToolDetails] Examining rawToolCalls structure:', node.rawToolCalls);
      
      // Collect all tools used, not just the first one
      const allTools = [];
      const allArgs = {};
      
      for (const toolCall of node.rawToolCalls) {
        console.log('🔍 [ToolDetails] Examining tool call:', toolCall);
        
        const currentToolName = toolCall?.name || 
                               toolCall?.tool_name || 
                               toolCall?.function?.name ||
                               toolCall?.tool?.name;
                               
        let currentToolArgs = toolCall?.arguments || 
                             toolCall?.args || 
                             toolCall?.function?.arguments ||
                             toolCall?.tool?.arguments ||
                             toolCall?.parameters;
        
        // If arguments is a string, try to parse it as JSON
        if (typeof currentToolArgs === 'string') {
          try {
            currentToolArgs = JSON.parse(currentToolArgs);
          } catch (e) {
            console.log('🔍 [ToolDetails] Could not parse arguments as JSON:', currentToolArgs);
          }
        }
        
        if (currentToolName) {
          allTools.push(currentToolName);
          if (currentToolArgs && typeof currentToolArgs === 'object') {
            Object.assign(allArgs, currentToolArgs);
          }
        }
      }
      
      if (allTools.length > 0) {
        // Show multiple tools if more than one
        if (allTools.length === 1) {
          toolName = allTools[0];
          toolArgs = allArgs;
        } else {
          toolName = `${allTools.length} Tools`;
          // Show the most important arguments from all tools
          toolArgs = allArgs;
        }
        console.log('🔍 [ToolDetails] Found tools in rawToolCalls:', { toolName, toolArgs, allTools });
      }
    }

    // If not found in node, try to find it in related nodes or graph data
    if (!toolName && graphData) {
      // Look for execute_tool node that might have the tool details
      const executeNode = graphData.nodes?.find(n => n.id === 'execute_tool');
      if (executeNode) {
        toolName = executeNode.data?.tool_name || executeNode.data?.name;
        toolArgs = executeNode.data?.arguments || executeNode.data?.args;
      }

      // Also check graph metadata for tool information
      if (!toolName && graphData.metadata?.tools) {
        const firstTool = Array.isArray(graphData.metadata.tools) ? graphData.metadata.tools[0] : graphData.metadata.tools;
        toolName = firstTool?.name || firstTool?.tool_name;
        toolArgs = firstTool?.arguments || firstTool?.args;
      }
    }

    // Format arguments for display - better formatting for detail nodes
    let argsDisplay = '';
    let detailArgsDisplay = '';
    
    if (toolArgs && typeof toolArgs === 'object') {
      const argEntries = Object.entries(toolArgs);
      if (argEntries.length > 0) {
        // Short version for secondary text
        argsDisplay = argEntries
          .slice(0, 2) // Show first 2 arguments
          .map(([key, value]) => {
            const valueStr = String(value);
            return `${key}: ${valueStr.length > 8 ? valueStr.substring(0, 6) + '...' : valueStr}`;
          })
          .join(', ');
        
        // Longer version for detail text (multi-line friendly)
        detailArgsDisplay = argEntries
          .slice(0, 4) // Show more arguments in detail
          .map(([key, value]) => {
            const valueStr = String(value);
            return `${key}: ${valueStr.length > 15 ? valueStr.substring(0, 12) + '...' : valueStr}`;
          })
          .join(', ');
        
        if (argEntries.length > 2) {
          argsDisplay += ` +${argEntries.length - 2}`;
        }
        if (argEntries.length > 4) {
          detailArgsDisplay += `, +${argEntries.length - 4} more`;
        }
      }
    }

    // Smart tool display - only show args if they're meaningful and different
    const finalToolName = toolName || 'Tool';
    
    // Only show arguments as secondary if they exist and are meaningful
    const hasMeaningfulArgs = argsDisplay && argsDisplay !== 'Execution' && argsDisplay.length > 0;
    const hasDistinctDetail = detailArgsDisplay && detailArgsDisplay !== argsDisplay && detailArgsDisplay !== 'Tool args';
    
    return {
      primary: finalToolName,
      secondary: hasMeaningfulArgs ? argsDisplay : null,
      detail: hasDistinctDetail ? detailArgsDisplay : null
    };
  } catch (error) {
    console.error('Error extracting tool details:', error);
    return {
      primary: 'Tool Error',
      secondary: 'Error',
      detail: 'Failed to extract tool details'
    };
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