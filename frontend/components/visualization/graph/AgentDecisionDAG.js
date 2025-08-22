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

function Node({ x, y, w, h, title, subtitle, highlighted = false, type = "default", index = 0 }) {
  // Different colors and styles based on node type
  const getNodeStyle = () => {
    switch(type) {
      case 'start':
        return { fill: "#f0fdf4", stroke: "#22c55e", textColor: "#14532d" };
      case 'agent':
        return { fill: "#fef3c7", stroke: "#f59e0b", textColor: "#78350f" };
      case 'execute':
        return { fill: "#fce7f3", stroke: "#ec4899", textColor: "#831843" };
      case 'final':
        return { fill: "#ede9fe", stroke: "#8b5cf6", textColor: "#4c1d95" };
      case 'tool-used':
        return { fill: "#dcfce7", stroke: "#4ade80", textColor: "#14532d" };
      case 'tool-unused':
        return { fill: "#f3f4f6", stroke: "#d1d5db", textColor: "#6b7280" };
      default:
        return { fill: "#ffffff", stroke: highlighted ? "#a855f7" : "#E5E7EB", textColor: "#111827" };
    }
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
        height={h} 
        fill={style.fill}
        stroke={style.stroke} 
        strokeWidth={2}
        whileHover={{ strokeWidth: 3 }}
        transition={{ duration: 0.2 }}
      />
      <text x={x + w/2} y={y + 30} fontSize={15} fontWeight="600" fill={style.textColor} textAnchor="middle">
        {title.length > 15 ? title.substring(0, 15) + "..." : title}
      </text>
      {subtitle ? (
        <text x={x + w/2} y={y + 52} fontSize={12} fill={style.textColor} opacity="0.7" textAnchor="middle">
          {subtitle.length > 20 ? subtitle.substring(0, 20) + "..." : subtitle}
        </text>
      ) : null}
    </motion.g>
  );
}

function Edge({ d, highlighted = false, dashed = false, index = 0 }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={highlighted ? "#8b5cf6" : "#cbd5e1"}
      strokeOpacity={highlighted ? 1 : 0.5}
      strokeWidth={highlighted ? 2.5 : 1.5}
      strokeDasharray={dashed ? "5,5" : "none"}
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
 */
export default function AgentDecisionDAG({ toolCalls = [], allTools = [], language = "en" }) {
  const toolUniverse = useToolUniverse(toolCalls, allTools);

  // Layout constants for left-to-right layout (wider to match charts)
  const pad = 40;
  const nodeW = 160;
  const nodeH = 70;
  const stepX = 220; // horizontal spacing between nodes
  const toolRowY = 220; // Y position for tools row
  const mainFlowY = 80; // Y position for main flow

  // Build path nodes: Start -> Agent -> Execute steps -> Final
  const pathNodes = React.useMemo(() => {
    const list = [];
    list.push({ id: "start", type: "start", title: language === 'fr' ? 'Début' : 'Start', subtitle: null });
    list.push({ id: "agent", type: "agent", title: language === 'fr' ? "Agent" : 'Agent', subtitle: language === 'fr' ? "Analyse" : 'Analysis' });
    (Array.isArray(toolCalls) ? toolCalls : []).forEach((tc, i) => {
      const name = tc?.name || tc?.tool_name || 'tool';
      list.push({ id: `exec-${i}`, type: "execute", title: name, subtitle: language === 'fr' ? 'Exécution' : 'Execution' });
    });
    list.push({ id: "final", type: "final", title: language === 'fr' ? 'Fin' : 'Complete', subtitle: null });
    return list;
  }, [toolCalls, language]);

  // Compute positions for left-to-right layout
  const positions = React.useMemo(() => {
    const pos = {};
    
    // Calculate available width for better horizontal distribution
    const totalMainFlowWidth = pathNodes.length * stepX;
    const minChartWidth = 800; // Minimum width to match chart containers
    const availableWidth = Math.max(totalMainFlowWidth, minChartWidth);
    
    // Distribute main flow nodes across full width
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
    
    return pos;
  }, [pathNodes, toolUniverse]);

  // Build edges (no arrows from agent to tools)
  const edges = React.useMemo(() => {
    const list = [];
    
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
    
    return list;
  }, [pathNodes, positions, toolUniverse, toolCalls]);

  // Calculate SVG dimensions
  const width = React.useMemo(() => {
    const maxX = Math.max(
      ...Object.values(positions).map(p => p.x + p.w),
      pad
    );
    return maxX + pad;
  }, [positions]);

  const height = React.useMemo(() => {
    const maxY = Math.max(
      ...Object.values(positions).map(p => p.y + p.h),
      pad
    );
    return maxY + pad;
  }, [positions]);

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
            <path d="M 0 0 L 8 3 L 0 6 z" fill="#cbd5e1" />
          </marker>
          <marker id="arrow-hi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M 0 0 L 8 3 L 0 6 z" fill="url(#grad-purple)" />
          </marker>
        </defs>

        {/* Edges rendered first (behind nodes) */}
        {edges.map((e, i) => (
          <Edge 
            key={e.id} 
            d={e.d} 
            highlighted={e.highlighted} 
            dashed={e.dashed}
            index={e.index || i}
            markerEnd={e.highlighted ? "url(#arrow-hi)" : "url(#arrow)"} 
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
            index={idx}
          />
        ))}
        
        {/* Tool nodes */}
        {toolUniverse.map((name, idx) => {
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
      </svg>
    </motion.div>
  );
}

