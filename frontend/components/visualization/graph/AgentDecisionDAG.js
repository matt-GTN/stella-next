"use client";

import React from "react";
import { motion } from "motion/react";
import {
  generateCurvedPath,
  generateAllCurvedPaths
} from './curvedPathUtils';
import {
  deduplicateAndConsolidateEdges,
  validateConsolidation
} from './edgeConsolidationUtils';
import {
  debugExtractUserQuery,
  debugExtractToolSummary,
  debugExtractNodeContent,
  debugSafeExtraction,
  simpleCreateContent
} from './contentExtractor.debug';

function useToolUniverse(toolCalls, allTools) {
  return React.useMemo(() => {
    const names = new Set();

    // Normalize allTools into names
    if (allTools) {
      if (Array.isArray(allTools)) {
        for (const t of allTools) {
          if (typeof t === 'string') names.add(t);
          else if (t && typeof t === 'object') {
            const n = t.name || t.tool_name || t.id;
            if (n) names.add(n);
          }
        }
      } else if (typeof allTools === 'object') {
        // object map: { toolName: config }
        Object.keys(allTools).forEach(k => names.add(k));
      }
    }

    // Add from toolCalls too
    for (const tc of Array.isArray(toolCalls) ? toolCalls : []) {
      const n = tc?.name || tc?.tool_name;
      if (n) names.add(n);
    }

    return Array.from(names);
  }, [toolCalls, allTools]);
}

/**
 * Icon prioritization logic to select single most appropriate icon per node
 * Implements Requirements 4.1, 4.2, 4.3, 4.4 for single icon display system
 * 
 * @param {Object} node - Node object with id, type, and optional icon
 * @param {string} fallbackIcon - Optional fallback icon if node has no icon
 * @returns {string} Single emoji icon to display
 */
function prioritizeIcon(node, fallbackIcon = null) {
  // Priority order for icon selection:
  // 1. Explicit node icon (highest priority) - Requirement 4.1
  // 2. Fallback icon parameter - Requirement 4.2  
  // 3. Type-based default icons - Requirement 4.3
  // 4. Generic default based on node type - Requirement 4.3

  // If node has explicit icon, use it (Requirement 4.1)
  if (node?.icon && typeof node.icon === 'string') {
    return node.icon;
  }

  // If fallback icon provided, use it
  if (fallbackIcon && typeof fallbackIcon === 'string') {
    return fallbackIcon;
  }

  // Default icon fallback system based on node types (Requirement 4.3)
  const nodeType = node?.type || 'default';
  const nodeId = node?.id || '';

  // Type-based icon mapping
  const typeIconMap = {
    'start': '▶️',
    'agent': '🧠',
    'tool_execution': '🔧',
    'execute': '🔧',
    'preparation': '⚙️',
    'generate_final_response': '📊',
    'handle_error': '⚠️',
    'prepare_chart_display': '📈',
    'prepare_data_display': '📋',
    'prepare_news_display': '📰',
    'prepare_profile_display': '👤',
    'cleanup_state': '🧹',
    'end': '🏁',
    'final': '🏁',
    'tool-used': '🔧',
    'tool-unused': '🔧',
    'default': '⚪'
  };

  // Special handling for specific node IDs
  if (nodeId === '__start__') return '▶️';
  if (nodeId === '__end__') return '🏁';
  if (nodeId.includes('tool') || nodeId.includes('exec')) return '🔧';
  if (nodeId.includes('agent')) return '🧠';
  if (nodeId.includes('error')) return '⚠️';
  if (nodeId.includes('chart')) return '📈';
  if (nodeId.includes('data')) return '📋';
  if (nodeId.includes('news')) return '📰';
  if (nodeId.includes('profile')) return '👤';
  if (nodeId.includes('cleanup')) return '🧹';

  // Return type-based icon or default
  return typeIconMap[nodeType] || typeIconMap['default'];
}

function Node({ x, y, w, h, content, index = 0, icon = null, isUnused = false, type = 'default', node = null }) {
  // Different colors and styles based on node type and usage
  const getNodeStyle = () => {
    // If node is unused, apply gray styling
    if (isUnused) {
      return {
        fill: "#6b7280", // gray-500
        stroke: "#9ca3af", // gray-400
        textColor: "#ffffff",
        opacity: 1,
        strokeDasharray: "none"
      };
    }

    // Executed nodes get lighter purple styling (purple-400)
    return {
      fill: "#a855f7", // purple-500
      stroke: "#c084fc", // purple-400
      textColor: "#ffffff",
      opacity: 1,
      strokeDasharray: "none"
    };
  };

  const style = getNodeStyle();

  // Apply single icon prioritization logic (Requirement 4.1, 4.2, 4.3)
  const prioritizedIcon = prioritizeIcon(
    node || { type, icon, id: `node-${index}` },
    icon
  );

  // Use content object or fallback to legacy props
  const displayContent = content || {
    primary: 'Unknown',
    secondary: null,
    detail: null,
    source: 'fallback'
  };

  // Use the content directly since it's already truncated by debug functions
  const truncatedContent = displayContent;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.05
      }}
    >
      <motion.rect
        x={x}
        y={y}
        rx={16}
        ry={16}
        width={w}
        height={truncatedContent.detail ? h + 20 : h}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={2}
        strokeDasharray={style.strokeDasharray || "none"}
        opacity={style.opacity || 1}
        whileHover={{ strokeWidth: 3 }}
        transition={{ duration: 0.2 }}
      />

      {/* Single Icon Display with consistent sizing and positioning (Requirement 4.4) */}
      {prioritizedIcon && (
        <text
          x={x + w / 2}
          y={y + 25}
          fontSize={16}
          textAnchor="middle"
          opacity={isUnused ? 0.5 : 1}
          style={{
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {prioritizedIcon}
        </text>
      )}

      {/* Primary Content (Main Title) */}
      <text x={x + w / 2} y={prioritizedIcon ? y + 45 : y + 30} fontSize={13} fontWeight="600" fill={style.textColor} textAnchor="middle">
        {truncatedContent.primary}
      </text>

      {/* Secondary Content (Subtitle) */}
      {truncatedContent.secondary && (
        <text x={x + w / 2} y={prioritizedIcon ? y + 60 : y + 48} fontSize={10} fill={style.textColor} opacity="0.7" textAnchor="middle">
          {truncatedContent.secondary}
        </text>
      )}

      {/* Detail Content (Extra Info) */}
      {truncatedContent.detail && (
        <text x={x + w / 2} y={y + (truncatedContent.secondary ? 75 : prioritizedIcon ? 75 : 65)} fontSize={9} fill={style.textColor} opacity="0.6" textAnchor="middle">
          {truncatedContent.detail}
        </text>
      )}

      {/* Tooltip for full content on hover */}
      {content?.originalContent && (
        <title>
          {`${content.originalContent.primary}\n${content.originalContent.secondary || ''}\n${content.originalContent.detail || ''}`}
        </title>
      )}
    </motion.g>
  );
}

function Edge({ d, index = 0, isUnused = false, isExecuted = false, isConsolidated = false, originalCount = 1 }) {
  const getEdgeStyle = () => {
    if (isUnused) {
      return {
        stroke: "#6b7280", // gray-500
        strokeOpacity: 1,
        strokeWidth: 2,
        strokeDasharray: "none"
      };
    } else if (isExecuted) {
      // Enhanced styling for consolidated executed edges (Requirement 5.4)
      const baseWidth = isConsolidated ? 4 : 3; // Slightly thicker for consolidated edges
      return {
        stroke: "#c084fc", // purple-400
        strokeOpacity: 1,
        strokeWidth: baseWidth,
        strokeDasharray: "none"
      };
    } else {
      return {
        stroke: "#9ca3af", // gray-400
        strokeOpacity: 0.7,
        strokeWidth: 2,
        strokeDasharray: "none"
      };
    }
  };

  const style = getEdgeStyle();

  return (
    <motion.g>
      <motion.path
        d={d}
        fill="none"
        stroke={style.stroke}
        strokeOpacity={style.strokeOpacity}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.8, ease: "easeInOut", delay: index * 0.1 },
          opacity: { duration: 0.3, delay: index * 0.1 }
        }}
      />

      {/* Visual indicator for consolidated edges (Requirement 5.4) */}
      {isConsolidated && originalCount > 1 && (
        <title>
          {`Consolidated edge (${originalCount} paths merged)`}
        </title>
      )}
    </motion.g>
  );
}

/**
 * AgentDecisionDAG
 * Renders a clean left-to-right DAG with:
 * - Start -> Agent -> Execute steps -> Final (horizontal flow)
 * - Tools universe displayed above/below the main flow
 * - Edges between sequential path nodes and from Execute -> Tool used
 * 
 * Supports both legacy format (toolCalls, allTools) and new graphData format
 */
export default function AgentDecisionDAG({
  toolCalls = [],
  allTools = [],
  graphData = null,
  language = "en"
}) {
  // Determine if we're using new graphData format or legacy format
  const isLangSmithData = graphData && graphData.nodes && graphData.edges;

  console.log('🎨 [AgentDecisionDAG] Rendering with:', {
    isLangSmithData,
    graphDataNodes: graphData?.nodes?.length || 0,
    graphDataEdges: graphData?.edges?.length || 0,
    legacyToolCalls: toolCalls?.length || 0,
    graphData: graphData
  });

  // Add error boundary logging
  React.useEffect(() => {
    console.log('🎨 [AgentDecisionDAG] Component mounted/updated');
  });

  const toolUniverse = useToolUniverse(toolCalls, allTools);

  // Helper functions for improved spacing calculations
  const calculateContentBasedSpacing = React.useCallback((content) => {
    if (!content || typeof content !== 'object') return 0;

    // Calculate additional spacing based on content length
    const primaryLength = content.primary ? content.primary.length : 0;
    const secondaryLength = content.secondary ? content.secondary.length : 0;
    const totalLength = primaryLength + secondaryLength;

    // Apply content length factor with maximum adjustment limit
    const adjustment = Math.min(
      totalLength * layoutConfig.contentLengthFactor,
      layoutConfig.maxContentAdjustment
    );

    return adjustment;
  }, []);

  const calculateHorizontalSpacing = React.useCallback((nodes, isPreparationLayer = false) => {
    if (!nodes || nodes.length <= 1) return layoutConfig.minHorizontalSpacing;

    // Use specific spacing for preparation layer (Requirement 3.1)
    const baseSpacing = isPreparationLayer
      ? layoutConfig.preparationLayerSpacing
      : layoutConfig.minHorizontalSpacing;

    // Calculate average content-based adjustment for all nodes
    const avgContentAdjustment = nodes.reduce((sum, node) => {
      return sum + calculateContentBasedSpacing(node.content);
    }, 0) / nodes.length;

    return baseSpacing + avgContentAdjustment;
  }, [calculateContentBasedSpacing]);

  const calculateVerticalSpacing = React.useCallback((fromLayer, toLayer) => {
    // Dynamic vertical spacing between workflow layers (Requirement 3.2)
    const baseSpacing = layoutConfig.minVerticalSpacing;

    // Add specific spacing for all 6-layer transitions
    if (fromLayer === 'start' && toLayer === 'agent') {
      return layoutConfig.layerVerticalSpacing;
    }
    if (fromLayer === 'agent' && toLayer === 'execute') {
      return layoutConfig.layerVerticalSpacing;
    }
    if (fromLayer === 'execute' && toLayer === 'preparation') {
      return layoutConfig.layerVerticalSpacing + 20; // Extra space before preparation layer
    }
    if (fromLayer === 'preparation' && toLayer === 'cleanup') {
      return layoutConfig.layerVerticalSpacing;
    }
    if (fromLayer === 'cleanup' && toLayer === 'end') {
      return layoutConfig.layerVerticalSpacing;
    }

    return baseSpacing;
  }, []);

  const calculateDetailNodePosition = React.useCallback((parentPos, detailIndex = 0) => {
    // Detail node positioning system with proper offsets (Requirement 3.3)
    return {
      x: parentPos.x + layoutConfig.nodeWidth + layoutConfig.detailNodeOffset,
      y: parentPos.y + (detailIndex * (layoutConfig.nodeHeight + 20)), // Stack multiple details vertically
      w: layoutConfig.nodeWidth,
      h: layoutConfig.nodeHeight
    };
  }, []);

  // Enhanced layout configuration with improved spacing calculations
  const layoutConfig = {
    // Base dimensions
    nodeWidth: 160,
    nodeHeight: 70,
    padding: 40,

    // Horizontal spacing improvements (Requirement 3.1)
    minHorizontalSpacing: 200, // Minimum space between nodes
    preparationLayerSpacing: 180, // Specific spacing for preparation layer
    detailNodeOffset: 60, // Offset for detail nodes from parent

    // Vertical spacing improvements (Requirement 3.2)
    minVerticalSpacing: 120, // Minimum space between workflow layers
    layerVerticalSpacing: 130, // Standard vertical spacing between layers
    toolRowOffset: 140, // Offset for tool row from main flow

    // Dynamic spacing adjustments (Requirement 3.4)
    contentLengthFactor: 0.8, // Factor for adjusting spacing based on content length
    maxContentAdjustment: 40, // Maximum additional spacing for long content

    // Legacy layout positions
    mainFlowY: 80,
    toolRowY: 220
  };

  // Build path nodes: either from graphData or legacy format
  const pathNodes = React.useMemo(() => {
    if (isLangSmithData) {
      // Use LangSmith graph structure with enhanced content extraction
      console.log('🎨 [AgentDecisionDAG] Using LangSmith nodes:', graphData.nodes);

      return graphData.nodes
        .filter(node => !node.type || node.type !== 'tool_detail') // Exclude tool detail nodes from main flow
        .map(node => {
          // Extract actual content for this node using debug version
          const nodeContent = debugSafeExtraction(
            () => debugExtractNodeContent(node),
            simpleCreateContent(
              (node.label && typeof node.label === 'object')
                ? (node.label[language] || node.label.en || node.label.fr || node.id)
                : (node.label || node.id),
              null,
              null
            )
          );

          return {
            id: node.id,
            type: node.type || 'default',
            content: nodeContent,
            icon: node.icon,
            isActive: node.isActive,
            isExecuted: node.isExecuted,
            isExecuting: node.isExecuting,
            isUnused: node.isUnused
          };
        });
    } else {
      // Legacy format with enhanced content extraction
      const list = [];

      // Start node
      list.push({
        id: "start",
        type: "start",
        content: simpleCreateContent(
          language === 'fr' ? 'Début' : 'Start',
          null,
          'Workflow start'
        ),
        icon: '▶️'
      });

      // Agent node with user query extraction using debug version
      const agentContent = debugSafeExtraction(
        () => debugExtractUserQuery(toolCalls),
        simpleCreateContent(
          language === 'fr' ? 'Agent' : 'Agent',
          language === 'fr' ? 'Analyse' : 'Analysis',
          'LLM decision making'
        )
      );

      list.push({
        id: "agent",
        type: "agent",
        content: agentContent,
        icon: '🧠'
      });

      // Tool execution nodes with actual tool information
      (Array.isArray(toolCalls) ? toolCalls : []).forEach((tc, i) => {
        const toolContent = debugSafeExtraction(
          () => debugExtractToolSummary([tc]),
          simpleCreateContent(
            tc?.name || tc?.tool_name || 'Tool',
            language === 'fr' ? 'Exécution' : 'Execution',
            `Tool execution ${i + 1}`
          )
        );

        list.push({
          id: `exec-${i}`,
          type: "execute",
          content: toolContent,
          icon: '🔧'
        });
      });

      // Final node
      list.push({
        id: "final",
        type: "final",
        content: simpleCreateContent(
          language === 'fr' ? 'Fin' : 'Complete',
          null,
          'Workflow complete'
        ),
        icon: '🏁'
      });

      return list;
    }
  }, [graphData, toolCalls, language, isLangSmithData]);

  // Debug pathNodes
  React.useEffect(() => {
    console.log('🎨 [AgentDecisionDAG] PathNodes created:', pathNodes);
  }, [pathNodes]);

  // Compute positions with enhanced spacing calculations
  const positions = React.useMemo(() => {
    const pos = {};

    if (isLangSmithData) {
      // Enhanced LangSmith layout with improved spacing
      console.log('🎨 [AgentDecisionDAG] Computing enhanced LangSmith layout for nodes:', pathNodes.map(n => n.id));

      const centerX = 400;

      // Identify preparation layer nodes for special spacing treatment
      const preparationNodes = pathNodes.filter(node =>
        ['generate_final_response', 'handle_error', 'prepare_chart_display',
          'prepare_data_display', 'prepare_news_display', 'prepare_profile_display'].includes(node.id)
      );

      // Calculate enhanced horizontal spacing for preparation layer (Requirement 3.1)
      const preparationSpacing = calculateHorizontalSpacing(preparationNodes, true);

      // Calculate dynamic vertical spacing between all 6 layers (Requirement 3.2)
      const startToAgentSpacing = calculateVerticalSpacing('start', 'agent');
      const agentToExecuteSpacing = calculateVerticalSpacing('agent', 'execute');
      const executeToPreparationSpacing = calculateVerticalSpacing('execute', 'preparation');
      const preparationToCleanupSpacing = calculateVerticalSpacing('preparation', 'cleanup');
      const cleanupToEndSpacing = calculateVerticalSpacing('cleanup', 'end');

      // Calculate Y positions for all 6 layers
      const layer1Y = 20; // __start__
      const layer2Y = layer1Y + layoutConfig.nodeHeight + startToAgentSpacing; // agent
      const layer3Y = layer2Y + layoutConfig.nodeHeight + agentToExecuteSpacing; // execute_tool
      const layer4Y = layer3Y + layoutConfig.nodeHeight + executeToPreparationSpacing; // generate_final_response + prepare_* + handle_error
      const layer5Y = layer4Y + layoutConfig.nodeHeight + preparationToCleanupSpacing; // cleanup_state
      const layer6Y = layer5Y + layoutConfig.nodeHeight + cleanupToEndSpacing; // __end__

      // Define enhanced positions with proper 6-layer spacing
      const basePositions = {
        '__start__': {
          x: centerX - layoutConfig.nodeWidth / 2,
          y: layer1Y
        },
        'agent': {
          x: centerX - layoutConfig.nodeWidth / 2,
          y: layer2Y
        },
        'execute_tool': {
          x: centerX - layoutConfig.nodeWidth / 2,
          y: layer3Y
        },
        'cleanup_state': {
          x: centerX - layoutConfig.nodeWidth / 2,
          y: layer5Y
        },
        '__end__': {
          x: centerX - layoutConfig.nodeWidth / 2,
          y: layer6Y
        }
      };

      // Position preparation nodes (layer 4) with enhanced horizontal spacing (Requirement 3.1)
      const preparationY = layer4Y;
      const preparationStartX = 30;

      preparationNodes.forEach((node, index) => {
        // Add content-based spacing adjustment (Requirement 3.4)
        const contentAdjustment = calculateContentBasedSpacing(node.content);
        const xPosition = preparationStartX + index * (preparationSpacing + contentAdjustment);

        basePositions[node.id] = {
          x: xPosition,
          y: preparationY
        };
      });

      // Apply base positions to all main nodes
      pathNodes.forEach(node => {
        if (basePositions[node.id]) {
          pos[node.id] = {
            ...basePositions[node.id],
            w: layoutConfig.nodeWidth,
            h: layoutConfig.nodeHeight
          };
        } else {
          // Fallback position for unknown nodes
          pos[node.id] = {
            x: centerX - layoutConfig.nodeWidth / 2,
            y: 300,
            w: layoutConfig.nodeWidth,
            h: layoutConfig.nodeHeight
          };
        }
      });

      // Position detail nodes with proper offsets (Requirement 3.3)
      const detailNodes = pathNodes.filter(node => node.id.includes('_detail'));
      detailNodes.forEach(detailNode => {
        // Handle different detail node naming patterns
        let parentId;
        if (detailNode.id === 'agent_query_detail') {
          parentId = 'agent'; // Special case for agent_query_detail
        } else if (detailNode.id.includes('execute_tool_detail')) {
          parentId = 'execute_tool'; // Special case for execute_tool_detail
        } else {
          // General case: remove _detail suffix
          parentId = detailNode.id.replace('_detail', '');
        }

        const parentPos = pos[parentId];

        if (parentPos) {
          // Calculate detail index for this parent (in case of multiple details per parent)
          const siblingsForThisParent = detailNodes.filter(n => {
            if (n.id === 'agent_query_detail') return parentId === 'agent';
            if (n.id.includes('execute_tool_detail')) return parentId === 'execute_tool';
            return n.id.startsWith(parentId + '_');
          });
          const detailIndex = siblingsForThisParent.indexOf(detailNode);

          pos[detailNode.id] = calculateDetailNodePosition(parentPos, detailIndex);

          console.log(`🎨 [Detail Node] Positioned ${detailNode.id} relative to parent ${parentId}:`, pos[detailNode.id]);
        } else {
          console.warn(`🎨 [Detail Node] Parent ${parentId} not found for detail node ${detailNode.id}`);
        }
      });

    } else {
      // Enhanced legacy horizontal layout with improved spacing
      const horizontalSpacing = calculateHorizontalSpacing(pathNodes, false);
      const totalMainFlowWidth = pathNodes.length * horizontalSpacing;
      const minChartWidth = 800;
      const availableWidth = Math.max(totalMainFlowWidth, minChartWidth);

      // Calculate dynamic spacing between nodes (Requirement 3.4)
      const flowStepX = pathNodes.length > 1 ?
        (availableWidth - 2 * layoutConfig.padding - layoutConfig.nodeWidth) / (pathNodes.length - 1) :
        horizontalSpacing;

      pathNodes.forEach((n, idx) => {
        // Add content-based spacing adjustment
        const contentAdjustment = calculateContentBasedSpacing(n.content);

        pos[n.id] = {
          x: layoutConfig.padding + idx * (flowStepX + contentAdjustment * 0.5),
          y: layoutConfig.mainFlowY,
          w: layoutConfig.nodeWidth,
          h: layoutConfig.nodeHeight
        };
      });

      // Enhanced tool positioning with improved spacing
      if (toolUniverse.length > 0) {
        const toolsWidth = availableWidth - 2 * layoutConfig.padding;
        const toolSpacing = toolUniverse.length > 1 ?
          Math.max(toolsWidth / (toolUniverse.length - 1), layoutConfig.minHorizontalSpacing) :
          toolsWidth / 2;

        toolUniverse.forEach((name, idx) => {
          const id = `tool:${name}`;
          pos[id] = {
            x: layoutConfig.padding + (toolUniverse.length === 1 ?
              toolsWidth / 2 - layoutConfig.nodeWidth / 2 :
              idx * toolSpacing),
            y: layoutConfig.mainFlowY + layoutConfig.nodeHeight + layoutConfig.toolRowOffset,
            w: layoutConfig.nodeWidth,
            h: layoutConfig.nodeHeight
          };
        });
      }
    }

    console.log('🎨 [AgentDecisionDAG] Enhanced positions computed:', pos);
    console.log('🎨 [AgentDecisionDAG] PathNodes for positions:', pathNodes.map(n => n.id));
    return pos;
  }, [pathNodes, toolUniverse, isLangSmithData, calculateHorizontalSpacing, calculateVerticalSpacing, calculateContentBasedSpacing, calculateDetailNodePosition]);

  /**
   * Edge deduplication and consolidation logic using utility functions
   * Implements Requirements 5.1, 5.2, 5.3, 5.4 for eliminating duplicate paths
   * 
   * @param {Array} rawEdges - Array of raw edge objects before deduplication
   * @returns {Array} Array of consolidated edges with duplicates removed
   */
  const consolidateEdges = React.useCallback((rawEdges) => {
    if (!rawEdges || rawEdges.length === 0) return [];

    // Use the dedicated edge consolidation utility (Requirements 5.1, 5.2, 5.3, 5.4)
    const consolidatedEdges = deduplicateAndConsolidateEdges(rawEdges);

    // Validate consolidation results for debugging
    const validation = validateConsolidation(rawEdges, consolidatedEdges);

    if (!validation.isValid) {
      console.warn('🔗 [Edge Consolidation] Validation failed:', validation);
      if (validation.lostConnections.length > 0) {
        console.warn('🔗 [Edge Consolidation] Lost connections:', validation.lostConnections);
      }
    } else {
      console.log('🔗 [Edge Consolidation] Validation passed:', {
        duplicatesRemoved: validation.duplicatesRemoved,
        finalCount: validation.consolidatedCount
      });
    }

    return consolidatedEdges;
  }, []);

  // Build edges with curved paths and deduplication
  const edges = React.useMemo(() => {
    const rawEdges = [];

    if (isLangSmithData && graphData.edges) {
      // Use LangSmith edges with curved path generation
      console.log('🎨 [AgentDecisionDAG] Using LangSmith edges with curved paths:', graphData.edges);

      // Generate all curved paths at once for better performance
      const edgesWithPaths = generateAllCurvedPaths(graphData.edges, positions, {
        verticalThreshold: 50,
        horizontalThreshold: 30
      });

      edgesWithPaths.forEach((edge, index) => {
        if (!edge.d) {
          console.warn('🎨 [AgentDecisionDAG] Failed to generate path for edge:', edge.from, '->', edge.to);
          return;
        }

        rawEdges.push({
          id: edge.id || `edge-${index}`,
          from: edge.from,
          to: edge.to,
          fromId: edge.from, // Ensure consistent property names for deduplication
          toId: edge.to,
          d: edge.d,
          curveType: edge.curveType,
          highlighted: edge.isActive !== false,
          dashed: edge.condition === 'conditional',
          isUnused: edge.isUnused,
          isExecuted: edge.isExecuted,
          isActive: edge.isActive,
          condition: edge.condition,
          isDetailEdge: edge.isDetailEdge,
          index
        });
      });
    } else {
      // Legacy edge logic with curved paths
      // Sequential path edges (horizontal curves)
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const fromPos = positions[pathNodes[i].id];
        const toPos = positions[pathNodes[i + 1].id];
        if (!fromPos || !toPos) continue;

        // Generate horizontal curve for sequential connections
        const x0 = fromPos.x + fromPos.w;
        const y0 = fromPos.y + fromPos.h / 2;
        const x1 = toPos.x;
        const y1 = toPos.y + toPos.h / 2;

        const d = generateCurvedPath(x0, y0, x1, y1, {
          forceCurveType: 'horizontal'
        });

        rawEdges.push({
          id: `p-${i}`,
          from: pathNodes[i].id,
          to: pathNodes[i + 1].id,
          fromId: pathNodes[i].id,
          toId: pathNodes[i + 1].id,
          d,
          curveType: 'horizontal',
          highlighted: true,
          isExecuted: true,
          isActive: true,
          condition: 'sequential',
          index: i
        });
      }

      // Execute -> Tool edges (vertical/branching curves)
      (Array.isArray(toolCalls) ? toolCalls : []).forEach((tc, i) => {
        const execPos = positions[`exec-${i}`];
        const name = tc?.name || tc?.tool_name;
        if (!execPos || !name) return;

        const toolPos = positions[`tool:${name}`];
        if (!toolPos) return;

        // Generate curved connection from execute to tool
        const x0 = execPos.x + execPos.w / 2;
        const y0 = execPos.y + execPos.h;
        const x1 = toolPos.x + toolPos.w / 2;
        const y1 = toolPos.y;

        const d = generateCurvedPath(x0, y0, x1, y1, {
          forceCurveType: 'branching'
        });

        rawEdges.push({
          id: `et-${i}`,
          from: `exec-${i}`,
          to: `tool:${name}`,
          fromId: `exec-${i}`,
          toId: `tool:${name}`,
          d,
          curveType: 'branching',
          highlighted: true,
          dashed: false,
          isExecuted: true,
          isActive: true,
          condition: 'tool_execution',
          index: pathNodes.length + i
        });
      });
    }

    // Apply edge deduplication and consolidation (Requirements 5.1, 5.2, 5.3, 5.4)
    // This eliminates duplicate paths between same nodes while preserving
    // the most relevant edge properties and maintaining visual consistency
    const consolidatedEdges = consolidateEdges(rawEdges);

    // Ensure visual consistency for consolidated edges (Requirement 5.4)
    return consolidatedEdges.map(edge => ({
      id: edge.id,
      d: edge.d,
      curveType: edge.curveType,
      highlighted: edge.highlighted,
      dashed: edge.dashed,
      isUnused: edge.isUnused,
      isExecuted: edge.isExecuted,
      index: edge.index,
      isConsolidated: edge.isConsolidated,
      originalCount: edge.originalCount
    }));
  }, [pathNodes, positions, toolUniverse, toolCalls, isLangSmithData, graphData, consolidateEdges]);

  // Calculate SVG dimensions with enhanced spacing considerations
  const width = React.useMemo(() => {
    if (isLangSmithData) {
      // Calculate width based on actual node positions and detail node offsets
      const maxX = Math.max(
        ...Object.values(positions).map(p => p.x + p.w),
        layoutConfig.padding
      );
      return Math.max(maxX + layoutConfig.padding, 1100); // Ensure minimum width for detail nodes
    }

    // Legacy layout with dynamic width calculation
    const maxX = Math.max(
      ...Object.values(positions).map(p => p.x + p.w),
      layoutConfig.padding
    );
    return maxX + layoutConfig.padding;
  }, [positions, isLangSmithData]);

  const height = React.useMemo(() => {
    if (isLangSmithData) {
      // Calculate height based on actual node positions and vertical spacing
      const maxY = Math.max(
        ...Object.values(positions).map(p => p.y + p.h),
        layoutConfig.padding
      );
      return Math.max(maxY + layoutConfig.padding, 720); // Ensure minimum height
    }

    // Legacy layout with dynamic height calculation
    const maxY = Math.max(
      ...Object.values(positions).map(p => p.y + p.h),
      layoutConfig.padding
    );
    return maxY + layoutConfig.padding;
  }, [positions, isLangSmithData]);

  return (
    <motion.div
      className="w-full bg-gradient-to-br from-gray-50 to-white rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
        <defs>
          {/* Gradient definitions for more visual appeal */}
          <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#a855f7", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="grad-gray" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#e5e7eb", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#d1d5db", stopOpacity: 1 }} />
          </linearGradient>

          {/* Arrow markers */}
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M 0 0 L 8 3 L 0 6 z" fill="#6b7280" />
          </marker>
          <marker id="arrow-hi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M 0 0 L 8 3 L 0 6 z" fill="#4b5563" />
          </marker>
          <marker id="arrow-executed" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M 0 0 L 8 3 L 0 6 z" fill="#c084fc" />
          </marker>
        </defs>

        {/* Edges rendered first (behind nodes) */}
        {edges.map((e, i) => (
          <Edge
            key={e.id}
            d={e.d}
            highlighted={e.highlighted}
            dashed={e.dashed}
            isUnused={e.isUnused}
            isExecuted={e.isExecuted}
            isConsolidated={e.isConsolidated}
            originalCount={e.originalCount}
            index={e.index || i}
            markerEnd={e.isExecuted ? "url(#arrow-executed)" : e.highlighted ? "url(#arrow-hi)" : "url(#arrow)"}
          />
        ))}

        {/* Main flow nodes */}
        {pathNodes.map((n, idx) => {
          console.log('🎨 [AgentDecisionDAG] Rendering node:', n.id, positions[n.id], n.content);
          return (
            <Node
              key={n.id}
              x={positions[n.id]?.x || 0}
              y={positions[n.id]?.y || 0}
              w={positions[n.id]?.w || 160}
              h={positions[n.id]?.h || 70}
              content={n.content}
              type={n.type}
              icon={n.icon}
              isUnused={n.isUnused}
              index={idx}
              node={n} // Pass full node object for icon prioritization
            />
          );
        })}

        {/* Tool nodes - only for legacy format */}
        {!isLangSmithData && toolUniverse.map((name, idx) => {
          const id = `tool:${name}`;
          const used = (toolCalls || []).some(tc => (tc?.name || tc?.tool_name) === name);

          // Create content for tool universe nodes
          const toolContent = simpleCreateContent(
            name,
            used ? (language === 'fr' ? '✓ Utilisé' : '✓ Used') : (language === 'fr' ? 'Disponible' : 'Available'),
            `Tool: ${name}`
          );

          // Create node object for icon prioritization
          const toolNode = {
            id,
            type: used ? 'tool-used' : 'tool-unused',
            icon: '🔧'
          };

          return (
            <Node
              key={id}
              x={positions[id].x}
              y={positions[id].y}
              w={positions[id].w}
              h={positions[id].h}
              content={toolContent}
              type={used ? 'tool-used' : 'tool-unused'}
              icon="🔧"
              isUnused={!used}
              index={pathNodes.length + idx}
              node={toolNode} // Pass node object for icon prioritization
            />
          );
        })}

        {/* Legend for LangSmith data */}
        {isLangSmithData && (
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="200" height="80" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" opacity="0.9" />
            <text x="10" y="20" fontSize="12" fontWeight="600" fill="#374151">Légende:</text>

            {/* Executed path */}
            <line x1="10" y1="35" x2="25" y2="35" stroke="#c084fc" strokeWidth="3" />
            <text x="30" y="39" fontSize="10" fill="#374151">Chemin exécuté</text>

            {/* Unused path */}
            <line x1="10" y1="50" x2="25" y2="50" stroke="#6b7280" strokeWidth="2" />
            <text x="30" y="54" fontSize="10" fill="#374151">Chemin non utilisé</text>

            {/* Detail connection */}
            <line x1="10" y1="65" x2="25" y2="65" stroke="#c084fc" strokeWidth="2" />
            <text x="30" y="69" fontSize="10" fill="#374151">Connexion détail</text>
          </g>
        )}
      </svg>
    </motion.div>
  );
}

