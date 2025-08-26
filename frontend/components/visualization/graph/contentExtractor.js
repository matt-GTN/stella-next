/**
 * Content Extraction Utilities for Graph Visualization
 * 
 * This module provides functions to extract meaningful content from tool calls,
 * thread context, and workflow data to display actual content instead of generic labels.
 */

/**
 * Extract user query from tool call arguments and thread context
 * @param {Array} toolCalls - Array of tool calls
 * @param {string} threadId - Thread ID or context
 * @param {Object} langsmithData - LangSmith data if available
 * @returns {Object} Extracted query information
 */
export function extractUserQuery(toolCalls, threadId, langsmithData = null) {
  try {
    // Try to extract from LangSmith data first
    if (langsmithData?.thread_id) {
      const firstToolCall = langsmithData.tool_calls?.[0];
      if (firstToolCall?.arguments?.ticker) {
        return {
          primary: `Analyze ${firstToolCall.arguments.ticker}`,
          secondary: `Financial Analysis`,
          detail: `Query: ${firstToolCall.arguments.ticker}`,
          source: 'langsmith_tool_args'
        };
      }
      if (firstToolCall?.arguments?.symbol) {
        return {
          primary: `Analyze ${firstToolCall.arguments.symbol}`,
          secondary: `Stock Analysis`,
          detail: `Symbol: ${firstToolCall.arguments.symbol}`,
          source: 'langsmith_tool_args'
        };
      }
    }

    // Extract from regular tool calls
    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      const firstTool = toolCalls[0];
      
      // Check for ticker/symbol in arguments
      if (firstTool?.arguments?.ticker) {
        return {
          primary: `Analyze ${firstTool.arguments.ticker}`,
          secondary: `Financial Analysis`,
          detail: `Ticker: ${firstTool.arguments.ticker}`,
          source: 'tool_args'
        };
      }
      
      if (firstTool?.arguments?.symbol) {
        return {
          primary: `Analyze ${firstTool.arguments.symbol}`,
          secondary: `Stock Analysis`, 
          detail: `Symbol: ${firstTool.arguments.symbol}`,
          source: 'tool_args'
        };
      }

      // Check for company name
      if (firstTool?.arguments?.company) {
        return {
          primary: `Analyze ${firstTool.arguments.company}`,
          secondary: `Company Analysis`,
          detail: `Company: ${firstTool.arguments.company}`,
          source: 'tool_args'
        };
      }

      // Check for query parameter
      if (firstTool?.arguments?.query) {
        return {
          primary: truncateText(firstTool.arguments.query, 25),
          secondary: `User Query`,
          detail: firstTool.arguments.query,
          source: 'tool_args'
        };
      }
    }

    // Extract from thread ID if it contains meaningful information
    if (threadId && typeof threadId === 'string') {
      // Check if thread ID contains ticker-like patterns (e.g., "AAPL_analysis_123")
      const tickerMatch = threadId.match(/([A-Z]{2,5})(?:_|$)/);
      if (tickerMatch) {
        return {
          primary: `Analyze ${tickerMatch[1]}`,
          secondary: `Financial Analysis`,
          detail: `From session: ${tickerMatch[1]}`,
          source: 'thread_id'
        };
      }

      // Generic thread-based query
      if (threadId.length > 10) {
        return {
          primary: truncateText(threadId, 20),
          secondary: `Session Query`,
          detail: threadId,
          source: 'thread_id'
        };
      }
    }

    // Default fallback
    return {
      primary: 'Financial Analysis',
      secondary: 'User Query',
      detail: 'General financial analysis request',
      source: 'default'
    };

  } catch (error) {
    console.warn('Error extracting user query:', error);
    return {
      primary: 'Financial Analysis',
      secondary: 'User Query',
      detail: 'Error extracting query details',
      source: 'error'
    };
  }
}

/**
 * Extract tool summary showing actual tool names and parameters
 * @param {Array} toolCalls - Array of tool calls
 * @param {Object} langsmithData - LangSmith data if available
 * @returns {Object} Tool summary information
 */
export function extractToolSummary(toolCalls, langsmithData = null) {
  try {
    // Use LangSmith data if available
    const tools = langsmithData?.tool_calls || toolCalls;
    
    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return {
        primary: 'No Tools',
        secondary: 'No Execution',
        detail: 'No tools were executed',
        source: 'empty'
      };
    }

    // Get tool names
    const toolNames = tools.map(tc => tc.name || tc.tool_name || 'unknown').filter(Boolean);
    const uniqueToolNames = [...new Set(toolNames)];

    // Get main argument (ticker, symbol, etc.)
    const firstTool = tools[0];
    const mainArg = firstTool?.arguments?.ticker || 
                   firstTool?.arguments?.symbol || 
                   firstTool?.arguments?.company ||
                   firstTool?.arguments?.query;

    // Create summary based on number of tools
    if (tools.length === 1) {
      const toolName = toolNames[0] || 'Tool';
      return {
        primary: formatToolName(toolName),
        secondary: mainArg ? `Target: ${mainArg}` : 'Single Tool',
        detail: `Executed: ${toolName}${mainArg ? ` (${mainArg})` : ''}`,
        source: 'single_tool'
      };
    } else if (tools.length <= 3) {
      const toolList = uniqueToolNames.slice(0, 2).map(formatToolName).join(', ');
      const remaining = uniqueToolNames.length > 2 ? ` +${uniqueToolNames.length - 2}` : '';
      return {
        primary: `${tools.length} Tools: ${toolList}${remaining}`,
        secondary: mainArg ? `Target: ${mainArg}` : `${tools.length} executions`,
        detail: `Tools: ${uniqueToolNames.join(', ')}${mainArg ? ` | Target: ${mainArg}` : ''}`,
        source: 'multiple_tools'
      };
    } else {
      const mainTools = uniqueToolNames.slice(0, 2).map(formatToolName).join(', ');
      return {
        primary: `${tools.length} Tools: ${mainTools} +${uniqueToolNames.length - 2}`,
        secondary: mainArg ? `Target: ${mainArg}` : `${tools.length} executions`,
        detail: `${tools.length} tools executed | Main: ${uniqueToolNames.slice(0, 3).join(', ')}${mainArg ? ` | Target: ${mainArg}` : ''}`,
        source: 'many_tools'
      };
    }

  } catch (error) {
    console.warn('Error extracting tool summary:', error);
    return {
      primary: 'Tool Execution',
      secondary: 'Error',
      detail: 'Error extracting tool details',
      source: 'error'
    };
  }
}

/**
 * Extract content for workflow nodes based on their type and context
 * @param {Object} node - Node object
 * @param {Array} toolCalls - Tool calls array
 * @param {Object} langsmithData - LangSmith data if available
 * @param {string} threadId - Thread ID
 * @returns {Object} Node content information
 */
export function extractNodeContent(node, toolCalls, langsmithData, threadId) {
  try {
    const nodeId = node.id;
    const nodeType = node.type;

    // Use node's raw data if available (from LangSmith)
    const nodeToolCalls = node.rawToolCalls || toolCalls;
    const nodeThreadId = node.rawThreadId || threadId;
    const nodeLangsmithData = langsmithData;

    // Handle different node types
    switch (nodeType) {
      case 'agent':
        if (nodeId === 'agent') {
          const queryInfo = extractUserQuery(nodeToolCalls, nodeThreadId, nodeLangsmithData);
          return {
            primary: queryInfo.primary,
            secondary: 'Agent Analysis',
            detail: queryInfo.detail,
            source: 'agent_query'
          };
        }
        break;

      case 'tool_execution':
        if (nodeId === 'execute_tool') {
          // Generic execute_tool node - don't show specific tool names
          const toolCount = nodeToolCalls ? nodeToolCalls.length : 0;
          return {
            primary: 'Execute Tools',
            secondary: toolCount > 0 ? `${toolCount} tool${toolCount > 1 ? 's' : ''}` : 'Tool execution',
            detail: 'Executing agent tools',
            source: 'tool_execution'
          };
        }
        break;

      case 'preparation':
        // Use actual node names for preparation nodes
        const preparationLabels = {
          'generate_final_response': { fr: 'Réponse Finale', en: 'Final Response' },
          'prepare_chart_display': { fr: 'Préparation Graphique', en: 'Chart Display' },
          'prepare_data_display': { fr: 'Préparation Données', en: 'Data Display' },
          'prepare_news_display': { fr: 'Préparation Actualités', en: 'News Display' },
          'prepare_profile_display': { fr: 'Préparation Profil', en: 'Profile Display' },
          'cleanup_state': { fr: 'Nettoyage', en: 'Cleanup State' },
          'handle_error': { fr: 'Gestion Erreur', en: 'Error Handler' }
        };

        const prepLabel = preparationLabels[nodeId];
        if (prepLabel) {
          return {
            primary: prepLabel.en, // Use English by default, can be localized later
            secondary: 'Preparation',
            detail: `Workflow step: ${nodeId}`,
            source: 'preparation_node'
          };
        }
        break;

      case 'info_detail':
        // Detail nodes show specific information
        console.log(`🔧 [ContentExtractor] Processing info_detail node: ${nodeId}`);
        if (nodeId === 'agent_query_detail') {
          const queryInfo = extractUserQuery(nodeToolCalls, nodeThreadId, nodeLangsmithData);
          return {
            primary: 'User Query',
            secondary: queryInfo.primary,
            detail: queryInfo.detail,
            source: 'query_detail'
          };
        }
        if (nodeId === 'execute_tool_detail' || nodeId.startsWith('execute_tool_detail_')) {
          // For individual tool nodes, extract specific tool information with arguments
          if (nodeId.startsWith('execute_tool_detail_')) {
            const toolIndex = parseInt(nodeId.split('_').pop());
            const specificToolCall = nodeToolCalls && nodeToolCalls[toolIndex] ? nodeToolCalls[toolIndex] : 
                                   (nodeToolCalls && nodeToolCalls[0] ? nodeToolCalls[0] : null);
            
            // Debug logging
            console.log(`🔧 [ContentExtractor] Processing ${nodeId}:`, {
              toolIndex,
              nodeToolCalls: nodeToolCalls?.length || 0,
              specificToolCall: specificToolCall ? {
                name: specificToolCall.name,
                arguments: specificToolCall.arguments,
                fullStructure: specificToolCall
              } : null
            });
            
            if (specificToolCall) {
              const toolName = specificToolCall.name || specificToolCall.tool_name || 'Tool';
              
              // Try different argument structures
              let args = specificToolCall.arguments || specificToolCall.args || {};
              
              // If arguments is a string, try to parse it
              if (typeof args === 'string') {
                try {
                  args = JSON.parse(args);
                } catch (e) {
                  console.log(`🔧 [ContentExtractor] Failed to parse arguments string:`, args);
                  args = {};
                }
              }
              
              // Extract key arguments to display
              const keyArgs = [];
              if (args.ticker) keyArgs.push(`ticker: ${args.ticker}`);
              if (args.symbol) keyArgs.push(`symbol: ${args.symbol}`);
              if (args.company) keyArgs.push(`company: ${args.company}`);
              if (args.query) keyArgs.push(`query: ${args.query}`);
              if (args.period) keyArgs.push(`period: ${args.period}`);
              if (args.limit) keyArgs.push(`limit: ${args.limit}`);
              
              // If no key args found, show first few args
              if (keyArgs.length === 0 && typeof args === 'object' && args !== null) {
                const argEntries = Object.entries(args).slice(0, 2);
                keyArgs.push(...argEntries.map(([key, value]) => `${key}: ${String(value).substring(0, 20)}`));
              }
              
              console.log(`🔧 [ContentExtractor] Extracted for ${nodeId}:`, {
                toolName,
                args,
                keyArgs
              });
              
              return {
                primary: formatToolName(toolName),
                secondary: keyArgs.length > 0 ? keyArgs.slice(0, 2).join(', ') : 'No arguments',
                detail: keyArgs.length > 0 ? keyArgs.join(' | ') : `Tool: ${toolName}`,
                source: 'individual_tool_detail'
              };
            } else {
              console.log(`🔧 [ContentExtractor] No tool call data for ${nodeId}`);
              return {
                primary: 'Tool',
                secondary: 'No data',
                detail: 'Tool execution',
                source: 'individual_tool_detail'
              };
            }
          } else {
            // Fallback for generic execute_tool_detail - should not show tool names anymore
            return {
              primary: 'Tool Execution',
              secondary: 'Multiple tools',
              detail: 'Tools executed successfully',
              source: 'tool_detail'
            };
          }
        }
        break;

      case 'start':
        return {
          primary: 'Start',
          secondary: null,
          detail: 'Workflow entry point',
          source: 'start_node'
        };

      case 'end':
        return {
          primary: 'End',
          secondary: null,
          detail: 'Workflow complete',
          source: 'end_node'
        };

      default:
        // Use existing label or node ID
        if (node.label && typeof node.label === 'object') {
          return {
            primary: node.label.en || node.label.fr || nodeId,
            secondary: nodeType,
            detail: `Node: ${nodeId}`,
            source: 'node_label'
          };
        }
        break;
    }

    // Fallback to existing node properties
    return {
      primary: node.label || nodeId,
      secondary: nodeType || 'Node',
      detail: `Workflow node: ${nodeId}`,
      source: 'fallback'
    };

  } catch (error) {
    console.warn('Error extracting node content:', error);
    return {
      primary: node.id || 'Unknown',
      secondary: 'Error',
      detail: 'Error extracting content',
      source: 'error'
    };
  }
}

/**
 * Truncate text with appropriate ellipsis handling
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} ellipsis - Ellipsis string (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, ellipsis = '...') {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (!maxLength || maxLength <= 0) {
    return text;
  }

  if (text.length <= maxLength) {
    return text;
  }

  // Ensure we have room for ellipsis
  const effectiveMaxLength = Math.max(1, maxLength - ellipsis.length);

  // Find a good break point (space, punctuation)
  const truncated = text.substring(0, effectiveMaxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastPunctuation = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf(','),
    truncated.lastIndexOf(';'),
    truncated.lastIndexOf(':')
  );

  // Use the best break point
  const breakPoint = Math.max(lastSpace, lastPunctuation);
  if (breakPoint > effectiveMaxLength * 0.7) { // Only use break point if it's not too early
    return truncated.substring(0, breakPoint) + ellipsis;
  }

  return truncated + ellipsis;
}

/**
 * Format tool name for display (convert snake_case to readable format)
 * @param {string} toolName - Raw tool name
 * @returns {string} Formatted tool name
 */
export function formatToolName(toolName) {
  if (!toolName || typeof toolName !== 'string') {
    return 'Tool';
  }

  // Convert snake_case to Title Case
  return toolName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Create content truncation system with smart truncation
 * @param {Object} content - Content object with primary, secondary, detail
 * @param {Object} limits - Length limits for each field
 * @returns {Object} Truncated content
 */
export function createTruncatedContent(content, limits = {}) {
  if (!content || typeof content !== 'object') {
    return {
      primary: 'Unknown',
      secondary: null,
      detail: null,
      source: 'invalid_content',
      originalContent: null
    };
  }

  const defaultLimits = {
    primary: 20,
    secondary: 25,
    detail: 40
  };

  const finalLimits = { ...defaultLimits, ...limits };

  return {
    primary: truncateText(content.primary, finalLimits.primary),
    secondary: truncateText(content.secondary, finalLimits.secondary),
    detail: truncateText(content.detail, finalLimits.detail),
    source: content.source || 'unknown',
    originalContent: content // Keep original for tooltips
  };
}

/**
 * Safe content extraction with error handling
 * @param {Function} extractorFn - Extractor function
 * @param {*} fallback - Fallback value
 * @returns {*} Extracted content or fallback
 */
export function safeContentExtraction(extractorFn, fallback) {
  try {
    return extractorFn();
  } catch (error) {
    console.warn('Content extraction failed:', error);
    return fallback || {
      primary: 'Unknown',
      secondary: 'Error',
      detail: 'Content extraction failed',
      source: 'error'
    };
  }
}