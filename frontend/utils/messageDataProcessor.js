/**
 * Message data processing utilities for backward compatibility
 * Ensures tool calls are properly formatted for the new graph visualization system
 */

/**
 * Normalize tool calls to ensure compatibility with both old and new visualization systems
 * @param {Array} toolCalls - Raw tool calls from various sources
 * @returns {Array} Normalized tool calls
 */
export function normalizeToolCalls(toolCalls = []) {
  // Ensure toolCalls is defined and is an array
  if (toolCalls === undefined || toolCalls === null) {
    return [];
  }
  
  if (!Array.isArray(toolCalls)) {
    console.warn('Tool calls is not an array:', toolCalls);
    return [];
  }

  // Create a new array to avoid any reference issues and temporal dead zone
  let toolCallsArray;
  try {
    toolCallsArray = Array.from(toolCalls);
  } catch (error) {
    console.error('Error creating array from toolCalls:', error);
    return [];
  }
  
  // Additional safety check
  if (!toolCallsArray || !Array.isArray(toolCallsArray)) {
    console.error('Failed to create safe array from toolCalls');
    return [];
  }
  
  return toolCallsArray.map((toolCall, index) => {
    if (!toolCall || typeof toolCall !== 'object') {
      console.warn(`Invalid tool call at index ${index}:`, toolCall);
      return {
        name: `unknown_tool_${index}`,
        args: {},
        status: 'error',
        error: 'Invalid tool call format'
      };
    }

    // Handle different formats from backend
    const normalized = {
      // Name handling - support multiple formats
      name: toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool || `unknown_tool_${index}`,
      
      // Arguments handling - support multiple formats
      args: toolCall.args || toolCall.arguments || toolCall.input || toolCall.parameters || {},
      
      // Status and execution info
      status: toolCall.status || (toolCall.error ? 'error' : 'completed'),
      error: toolCall.error || null,
      result: toolCall.result || toolCall.output || null,
      
      // Timing information
      executionTime: toolCall.executionTime || toolCall.execution_time || toolCall.duration || 0,
      timestamp: toolCall.timestamp || Date.now(),
      
      // Additional metadata
      index: index,
      sessionId: toolCall.sessionId || null
    };

    return normalized;
  });
}

/**
 * Validate message data for graph visualization compatibility
 * @param {Object} message - Message object
 * @returns {Object} Validation result with normalized data
 */
export function validateMessageForVisualization(message) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    normalizedMessage: { ...message }
  };

  // Validate message structure
  if (!message || typeof message !== 'object') {
    validation.isValid = false;
    validation.errors.push('Message is not a valid object');
    return validation;
  }

  // Normalize tool calls if present (handle both toolCalls and tool_calls formats)
  const toolCalls = message.toolCalls || message.tool_calls;
  if (toolCalls) {
    try {
      validation.normalizedMessage.toolCalls = normalizeToolCalls(toolCalls);
      
      // Check for any invalid tool calls
      const invalidCalls = validation.normalizedMessage.toolCalls.filter(tc => tc.status === 'error' && tc.error === 'Invalid tool call format');
      if (invalidCalls.length > 0) {
        validation.warnings.push(`${invalidCalls.length} tool calls had invalid format and were normalized`);
      }
    } catch (error) {
      validation.errors.push(`Error normalizing tool calls: ${error.message}`);
      validation.normalizedMessage.toolCalls = [];
    }
  }

  // Ensure each message has a unique ID for visualization
  if (!validation.normalizedMessage.id) {
    validation.normalizedMessage.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    validation.warnings.push('Message ID was missing, generated unique ID');
  }

  // Ensure sessionId is present for graph visualization - use message ID as unique identifier
  if (!validation.normalizedMessage.sessionId) {
    validation.normalizedMessage.sessionId = validation.normalizedMessage.id;
    validation.warnings.push('SessionId was missing, using message ID as unique session identifier');
  }

  return validation;
}

/**
 * Process message for backward compatibility with existing chat system
 * @param {Object} message - Raw message from API or storage
 * @returns {Object} Processed message ready for rendering
 */
export function processMessageForChat(message) {
  // Ensure message exists and has basic structure
  if (!message || typeof message !== 'object') {
    console.error('Invalid message provided to processMessageForChat:', message);
    return {
      id: 'error-' + Date.now(),
      type: 'assistant',
      content: '',
      toolCalls: [],
      initialContent: '',
      finalContent: '',
      timestamp: new Date(),
      hasVisualizationError: true,
      visualizationErrors: ['Invalid message object']
    };
  }
  
  const validation = validateMessageForVisualization(message);
  
  if (!validation.isValid) {
    console.error('Message validation failed:', validation.errors);
    // Return a safe fallback message
    return {
      ...message,
      toolCalls: [],
      initialContent: message.initialContent || '',
      finalContent: message.finalContent || '',
      hasVisualizationError: true,
      visualizationErrors: validation.errors
    };
  }

  if (validation.warnings.length > 0) {
    console.warn('Message processing warnings:', validation.warnings);
  }

  // Handle backward compatibility for old field names
  const normalizedMessage = { ...validation.normalizedMessage };
  
  // Convert old field names to new format
  if (message.role && !normalizedMessage.type) {
    normalizedMessage.type = message.role;
  }
  if (message.message && !normalizedMessage.content) {
    normalizedMessage.content = message.message;
  }
  if (message.tools && !normalizedMessage.toolCalls) {
    normalizedMessage.toolCalls = normalizeToolCalls(message.tools);
  }

  // Ensure critical fields are initialized
  const processedMessage = {
    ...normalizedMessage,
    toolCalls: normalizedMessage.toolCalls || [],
    initialContent: normalizedMessage.initialContent || '',
    finalContent: normalizedMessage.finalContent || '',
    // Ensure each message has a unique ID for trace visualization
    id: normalizedMessage.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId: normalizedMessage.sessionId || normalizedMessage.id || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  return processedMessage;
}

/**
 * Check if a message has agent activity (tool calls or reasoning content)
 * @param {Object} message - Message object
 * @param {number} messageIndex - Index of message in conversation (optional)
 * @returns {boolean} True if message has agent activity
 */
export function hasAgentActivity(message, messageIndex = null) {
  // Show agent decision path for all assistant messages except the first one
  if (!message || message.type !== 'assistant') {
    return false;
  }

  // Exclude the first assistant message (greeting) - use multiple indicators
  const isFirstAssistantMessage = messageIndex === 1 || // Second message overall (after user's first)
                                  messageIndex === 0 || // Could be first if no user message yet
                                  message.isInitialGreeting === true || // Explicit flag if backend sets it
                                  (!message.toolCalls || message.toolCalls.length === 0) && 
                                  (!message.initialContent && !message.finalContent) &&
                                  message.content && message.content.length < 200; // Short simple message
  
  // Additional check: if message has no tool calls and is very short, might be greeting
  const isLikelyGreeting = (!message.toolCalls || message.toolCalls.length === 0) &&
                           (!message.initialContent && !message.finalContent) &&
                           message.content && message.content.length < 150;

  // Only exclude if it's likely the first message AND looks like a greeting
  if ((messageIndex === 0 || messageIndex === 1) && isLikelyGreeting) {
    return false;
  }

  // Show for all other assistant messages to allow viewing the agent's decision path
  return true;
}
