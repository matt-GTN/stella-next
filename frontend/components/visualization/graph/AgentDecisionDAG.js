"use client";

import React from "react";
import { motion } from "motion/react";

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

function Node({ x, y, w, h, title, subtitle, highlighted = false, type = "default", index = 0, icon = null, isUnused = false, extraInfo = null }) {
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
        height={extraInfo ? h + 20 : h} 
        fill={style.fill}
        stroke={style.stroke} 
        strokeWidth={2}
        strokeDasharray={style.strokeDasharray || "none"}
        opacity={style.opacity || 1}
        whileHover={{ strokeWidth: 3 }}
        transition={{ duration: 0.2 }}
      />
      {/* Icon */}
      {icon && (
        <text x={x + w/2} y={y + 25} fontSize={16} textAnchor="middle" opacity={isUnused ? 0.5 : 1}>
          {icon}
        </text>
      )}
      
      {/* Title */}
      <text x={x + w/2} y={icon ? y + 45 : y + 30} fontSize={13} fontWeight="600" fill={style.textColor} textAnchor="middle">
        {title.length > 15 ? title.substring(0, 15) + "..." : title}
      </text>
      
      {/* Subtitle */}
      {subtitle && (
        <text x={x + w/2} y={icon ? y + 60 : y + 48} fontSize={10} fill={style.textColor} opacity="0.7" textAnchor="middle">
          {subtitle.length > 22 ? subtitle.substring(0, 22) + "..." : subtitle}
        </text>
      )}

      {/* Extra Info */}
      {extraInfo && (
        <text x={x + w/2} y={y + (subtitle ? 75 : icon ? 75 : 65)} fontSize={9} fill={style.textColor} opacity="0.6" textAnchor="middle">
          {extraInfo.length > 25 ? extraInfo.substring(0, 25) + "..." : extraInfo}
        </text>
      )}
    </motion.g>
  );
}

function Edge({ d, highlighted = false, dashed = false, index = 0, isUnused = false, isExecuted = false }) {
  const getEdgeStyle = () => {
    if (isUnused) {
      return {
        stroke: "#6b7280", // gray-500
        strokeOpacity: 1,
        strokeWidth: 2,
        strokeDasharray: "none"
      };
    } else if (isExecuted) {
      return {
        stroke: "#c084fc", // purple-400
        strokeOpacity: 1,
        strokeWidth: 3,
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

  const toolUniverse = useToolUniverse(toolCalls, allTools);

  // Layout constants for left-to-right layout (wider to match charts)
  const pad = 40;
  const nodeW = 160;
  const nodeH = 70;
  const stepX = 220; // horizontal spacing between nodes
  const toolRowY = 220; // Y position for tools row
  const mainFlowY = 80; // Y position for main flow

  // Build path nodes: either from graphData or legacy format
  const pathNodes = React.useMemo(() => {
    if (isLangSmithData) {
      // Use LangSmith graph structure
      console.log('🎨 [AgentDecisionDAG] Using LangSmith nodes:', graphData.nodes);
      
      return graphData.nodes
        .filter(node => !node.type || node.type !== 'tool_detail') // Exclude tool detail nodes from main flow
        .map(node => ({
          id: node.id,
          type: node.type || 'default',
          title: (node.label && typeof node.label === 'object') 
            ? (node.label[language] || node.label.en || node.label.fr || node.id)
            : (node.label || node.id),
          subtitle: node.icon || null,
          icon: node.icon,
          isActive: node.isActive,
          isExecuted: node.isExecuted,
          isExecuting: node.isExecuting,
          isUnused: node.isUnused
        }));
    } else {
      // Legacy format
      const list = [];
      list.push({ id: "start", type: "start", title: language === 'fr' ? 'Début' : 'Start', subtitle: null });
      list.push({ id: "agent", type: "agent", title: language === 'fr' ? "Agent" : 'Agent', subtitle: language === 'fr' ? "Analyse" : 'Analysis' });
      (Array.isArray(toolCalls) ? toolCalls : []).forEach((tc, i) => {
        const name = tc?.name || tc?.tool_name || 'tool';
        list.push({ id: `exec-${i}`, type: "execute", title: name, subtitle: language === 'fr' ? 'Exécution' : 'Execution' });
      });
      list.push({ id: "final", type: "final", title: language === 'fr' ? 'Fin' : 'Complete', subtitle: null });
      return list;
    }
  }, [graphData, toolCalls, language, isLangSmithData]);

  // Compute positions based on data type
  const positions = React.useMemo(() => {
    const pos = {};
    
    if (isLangSmithData) {
      // LangSmith layout - vertical workflow like your desired image
      console.log('🎨 [AgentDecisionDAG] Computing LangSmith layout for nodes:', pathNodes.map(n => n.id));
      
      const centerX = 400; // Center of the graph
      const minChartWidth = 800;
      
      // Define specific positions for LangSmith workflow nodes
      const nodePositions = {
        '__start__': { x: centerX - nodeW/2, y: 20 },
        'agent': { x: centerX - nodeW/2, y: 130 },
        'agent_query_detail': { x: centerX + nodeW + 40, y: 130 }, // À droite de l'agent
        'execute_tool': { x: centerX - nodeW/2, y: 260 },
        'execute_tool_detail': { x: centerX + nodeW + 40, y: 260 }, // À droite d'execute_tool
        
        // Preparation nodes in a row (wider spacing for better visibility)
        'generate_final_response': { x: 30, y: 390 },
        'handle_error': { x: 180, y: 390 },
        'prepare_chart_display': { x: 330, y: 390 },
        'prepare_data_display': { x: 480, y: 390 },
        'prepare_news_display': { x: 630, y: 390 },
        'prepare_profile_display': { x: 780, y: 390 },
        
        'cleanup_state': { x: centerX - nodeW/2, y: 520 },
        '__end__': { x: centerX - nodeW/2, y: 630 }
      };
      
      // Apply positions to all nodes
      pathNodes.forEach(node => {
        if (nodePositions[node.id]) {
          pos[node.id] = { 
            ...nodePositions[node.id], 
            w: nodeW, 
            h: nodeH 
          };
        } else {
          // Fallback position for unknown nodes
          pos[node.id] = { 
            x: centerX - nodeW/2, 
            y: 300, 
            w: nodeW, 
            h: nodeH 
          };
        }
      });
      
    } else {
      // Legacy horizontal layout
      const totalMainFlowWidth = pathNodes.length * stepX;
      const minChartWidth = 800;
      const availableWidth = Math.max(totalMainFlowWidth, minChartWidth);
      
      const flowStepX = pathNodes.length > 1 ? (availableWidth - 2 * pad - nodeW) / (pathNodes.length - 1) : stepX;
      
      pathNodes.forEach((n, idx) => {
        pos[n.id] = { 
          x: pad + idx * flowStepX, 
          y: mainFlowY, 
          w: nodeW, 
          h: nodeH 
        };
      });
      
      // Tools distributed across the full width below
      if (toolUniverse.length > 0) {
        const toolsWidth = availableWidth - 2 * pad;
        const toolSpacing = toolUniverse.length > 1 ? toolsWidth / (toolUniverse.length - 1) : toolsWidth / 2;
        
        toolUniverse.forEach((name, idx) => {
          const id = `tool:${name}`;
          pos[id] = { 
            x: pad + (toolUniverse.length === 1 ? toolsWidth / 2 - nodeW / 2 : idx * toolSpacing), 
            y: toolRowY, 
            w: nodeW, 
            h: nodeH 
          };
        });
      }
    }
    
    console.log('🎨 [AgentDecisionDAG] Computed positions:', pos);
    return pos;
  }, [pathNodes, toolUniverse, isLangSmithData]);

  // Build edges
  const edges = React.useMemo(() => {
    const list = [];
    
    if (isLangSmithData && graphData.edges) {
      // Use LangSmith edges with smart routing
      console.log('🎨 [AgentDecisionDAG] Using LangSmith edges:', graphData.edges);
      
      graphData.edges.forEach((edge, index) => {
        const fromPos = positions[edge.from];
        const toPos = positions[edge.to];
        
        if (!fromPos || !toPos) {
          console.warn('🎨 [AgentDecisionDAG] Missing position for edge:', edge.from, '->', edge.to);
          return;
        }
        
        // Smart edge routing based on node positions
        let d;
        
        // Check if it's a detail edge (horizontal connection to detail node)
        const isDetailEdge = edge.isDetailEdge;
        
        if (isDetailEdge) {
          // Horizontal connection to detail node
          const x0 = fromPos.x + fromPos.w;
          const y0 = fromPos.y + fromPos.h / 2;
          const x1 = toPos.x;
          const y1 = toPos.y + toPos.h / 2;
          
          // Simple horizontal line
          d = `M ${x0},${y0} L ${x1},${y1}`;
        } else {
          // Check if it's a vertical connection (same X or close)
          const isVertical = Math.abs((fromPos.x + fromPos.w/2) - (toPos.x + toPos.w/2)) < 50;
          
          if (isVertical) {
            // Vertical connection (straight down)
            const x = fromPos.x + fromPos.w / 2;
            const y0 = fromPos.y + fromPos.h;
            const y1 = toPos.y;
            d = `M ${x},${y0} L ${x},${y1}`;
          } else {
            // Branching connection (from execute_tool to preparation nodes)
            const x0 = fromPos.x + fromPos.w / 2;
            const y0 = fromPos.y + fromPos.h;
            const x1 = toPos.x + toPos.w / 2;
            const y1 = toPos.y;
            
            // Create a curved path that goes down then across
            const midY = y0 + (y1 - y0) * 0.3;
            d = `M ${x0},${y0} L ${x0},${midY} L ${x1},${midY} L ${x1},${y1}`;
          }
        }
        
        list.push({ 
          id: edge.id || `edge-${index}`, 
          d, 
          highlighted: edge.isActive !== false, 
          dashed: edge.condition === 'conditional',
          index 
        });
      });
    } else {
      // Legacy edge logic
      // Sequential path edges (horizontal)
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const a = positions[pathNodes[i].id];
        const b = positions[pathNodes[i + 1].id];
        if (!a || !b) continue;
        
        const x0 = a.x + a.w;
        const y0 = a.y + a.h / 2;
        const x1 = b.x;
        const y1 = b.y + b.h / 2;
        
        // Smooth horizontal bezier curve
        const controlOffset = 40;
        const d = `M ${x0},${y0} C ${x0 + controlOffset},${y0} ${x1 - controlOffset},${y1} ${x1},${y1}`;
        list.push({ id: `p-${i}`, d, highlighted: true, index: i });
      }
      
      // Execute -> Tool edges (vertical connections)
      (Array.isArray(toolCalls) ? toolCalls : []).forEach((tc, i) => {
        const exec = positions[`exec-${i}`];
        const name = tc?.name || tc?.tool_name;
        if (!exec || !name) return;
        
        const tool = positions[`tool:${name}`];
        if (!tool) return;
        
        const x0 = exec.x + exec.w / 2;
        const y0 = exec.y + exec.h;
        const x1 = tool.x + tool.w / 2;
        const y1 = tool.y;
        
        // Curved connection from execute to tool
        const d = `M ${x0},${y0} C ${x0},${y0 + 30} ${x1},${y1 - 30} ${x1},${y1}`;
        list.push({ id: `et-${i}`, d, highlighted: true, dashed: false, index: pathNodes.length + i });
      });
    }
    
    return list;
  }, [pathNodes, positions, toolUniverse, toolCalls, isLangSmithData, graphData]);

  // Calculate SVG dimensions
  const width = React.useMemo(() => {
    if (isLangSmithData) {
      return 1100; // Increased width for detail nodes
    }
    const maxX = Math.max(
      ...Object.values(positions).map(p => p.x + p.w),
      pad
    );
    return maxX + pad;
  }, [positions, isLangSmithData]);

  const height = React.useMemo(() => {
    if (isLangSmithData) {
      return 720; // Increased height for LangSmith layout with extra info
    }
    const maxY = Math.max(
      ...Object.values(positions).map(p => p.y + p.h),
      pad
    );
    return maxY + pad;
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
            index={e.index || i}
            markerEnd={e.isExecuted ? "url(#arrow-executed)" : e.highlighted ? "url(#arrow-hi)" : "url(#arrow)"} 
          />
        ))}

        {/* Main flow nodes */}
        {pathNodes.map((n, idx) => (
          <Node 
            key={n.id} 
            x={positions[n.id].x} 
            y={positions[n.id].y} 
            w={positions[n.id].w} 
            h={positions[n.id].h} 
            title={n.title} 
            subtitle={n.subtitle} 
            type={n.type}
            icon={n.icon}
            isUnused={n.isUnused}
            extraInfo={n.extraInfo}
            index={idx}
          />
        ))}
        
        {/* Tool nodes - only for legacy format */}
        {!isLangSmithData && toolUniverse.map((name, idx) => {
          const id = `tool:${name}`;
          const used = (toolCalls || []).some(tc => (tc?.name || tc?.tool_name) === name);
          return (
            <Node 
              key={id} 
              x={positions[id].x} 
              y={positions[id].y} 
              w={positions[id].w} 
              h={positions[id].h} 
              title={name} 
              subtitle={used ? (language === 'fr' ? '✓ Utilisé' : '✓ Used') : (language === 'fr' ? 'Disponible' : 'Available')}
              type={used ? 'tool-used' : 'tool-unused'}
              index={pathNodes.length + idx}
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

