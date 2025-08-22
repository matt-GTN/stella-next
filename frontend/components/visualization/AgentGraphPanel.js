"use client";

import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Brain, 
  Settings, 
  Sparkles, 
  BarChart3, 
  FileText, 
  Globe, 
  Building,
  Zap,
  Clock,
  CheckCircle,
  Play,
  Circle
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";

// Outils disponibles dans Stella avec leurs icônes et descriptions
const AVAILABLE_TOOLS = {
  'search_ticker': {
    icon: '🔍',
    label: { fr: 'Recherche Ticker', en: 'Search Ticker' },
    description: { fr: 'Trouve le ticker boursier', en: 'Find stock ticker' }
  },
  'fetch_data': {
    icon: '📊',
    label: { fr: 'Récupération Données', en: 'Fetch Data' },
    description: { fr: 'Récupère les données financières', en: 'Fetch financial data' }
  },
  'preprocess_data': {
    icon: '🔧',
    label: { fr: 'Prétraitement', en: 'Preprocess' },
    description: { fr: 'Prépare les données', en: 'Prepare data' }
  },
  'analyze_risks': {
    icon: '🎯',
    label: { fr: 'Analyse Risques', en: 'Risk Analysis' },
    description: { fr: 'Prédit les risques', en: 'Predict risks' }
  },
  'get_stock_news': {
    icon: '📰',
    label: { fr: 'Actualités', en: 'Stock News' },
    description: { fr: 'Récupère les actualités', en: 'Get stock news' }
  },
  'get_company_profile': {
    icon: '🏢',
    label: { fr: 'Profil Entreprise', en: 'Company Profile' },
    description: { fr: 'Profil de l\'entreprise', en: 'Company profile' }
  },
  'display_price_chart': {
    icon: '📈',
    label: { fr: 'Graphique Prix', en: 'Price Chart' },
    description: { fr: 'Graphique des prix', en: 'Price chart' }
  },
  'compare_stocks': {
    icon: '⚖️',
    label: { fr: 'Comparaison', en: 'Compare Stocks' },
    description: { fr: 'Compare les actions', en: 'Compare stocks' }
  },
  'create_dynamic_chart': {
    icon: '📊',
    label: { fr: 'Graphique Dynamique', en: 'Dynamic Chart' },
    description: { fr: 'Crée un graphique', en: 'Create chart' }
  },
  'display_raw_data': {
    icon: '📋',
    label: { fr: 'Données Brutes', en: 'Raw Data' },
    description: { fr: 'Affiche données brutes', en: 'Display raw data' }
  },
  'display_processed_data': {
    icon: '📄',
    label: { fr: 'Données Traitées', en: 'Processed Data' },
    description: { fr: 'Affiche données traitées', en: 'Display processed data' }
  },
  'query_research': {
    icon: '🔬',
    label: { fr: 'Recherche Document', en: 'Research Query' },
    description: { fr: 'Recherche interne', en: 'Internal research' }
  }
};

// Nœuds de workflow fixes - Représentation exacte du LangGraph backend
const WORKFLOW_NODES = {
  start: {
    id: 'start',
    type: 'start',
    position: { x: 50, y: 250 },
    icon: Play,
    label: { fr: 'Début', en: 'Start' },
    description: { fr: 'Point d\'entrée', en: 'Entry point' }
  },
  agent: {
    id: 'agent',
    type: 'decision',
    position: { x: 200, y: 250 },
    icon: Brain,
    label: { fr: 'Agent (LLM)', en: 'Agent (LLM)' },
    description: { fr: 'Décision du LLM sur l\'outil à utiliser', en: 'LLM decides which tool to use' }
  },
  execute_tool: {
    id: 'execute_tool',
    type: 'process',
    position: { x: 400, y: 250 },
    icon: Settings,
    label: { fr: 'Exécution Outil', en: 'Execute Tool' },
    description: { fr: 'Exécute l\'outil sélectionné', en: 'Execute selected tool' }
  },
  generate_final_response: {
    id: 'generate_final_response',
    type: 'output',
    position: { x: 600, y: 100 },
    icon: Sparkles,
    label: { fr: 'Réponse Finale', en: 'Final Response' },
    description: { fr: 'Génère la réponse finale avec graphique', en: 'Generate final response with chart' }
  },
  prepare_chart_display: {
    id: 'prepare_chart_display',
    type: 'output',
    position: { x: 600, y: 180 },
    icon: BarChart3,
    label: { fr: 'Préparer Graphique', en: 'Prepare Chart' },
    description: { fr: 'Prépare l\'affichage du graphique', en: 'Prepare chart display' }
  },
  prepare_data_display: {
    id: 'prepare_data_display',
    type: 'output',
    position: { x: 600, y: 260 },
    icon: FileText,
    label: { fr: 'Préparer Données', en: 'Prepare Data' },
    description: { fr: 'Prépare l\'affichage des données', en: 'Prepare data display' }
  },
  prepare_news_display: {
    id: 'prepare_news_display',
    type: 'output',
    position: { x: 600, y: 340 },
    icon: Globe,
    label: { fr: 'Préparer Actualités', en: 'Prepare News' },
    description: { fr: 'Prépare l\'affichage des actualités', en: 'Prepare news display' }
  },
  prepare_profile_display: {
    id: 'prepare_profile_display',
    type: 'output',
    position: { x: 600, y: 420 },
    icon: Building,
    label: { fr: 'Préparer Profil', en: 'Prepare Profile' },
    description: { fr: 'Prépare l\'affichage du profil', en: 'Prepare profile display' }
  },
  handle_error: {
    id: 'handle_error',
    type: 'error',
    position: { x: 400, y: 450 },
    icon: Zap,
    label: { fr: 'Gestion Erreur', en: 'Handle Error' },
    description: { fr: 'Gère les erreurs', en: 'Handle errors' }
  },
  cleanup_state: {
    id: 'cleanup_state',
    type: 'process',
    position: { x: 750, y: 250 },
    icon: Settings,
    label: { fr: 'Nettoyage', en: 'Cleanup' },
    description: { fr: 'Nettoie l\'état pour la prochaine interaction', en: 'Clean up state for next interaction' }
  },
  end: {
    id: 'end',
    type: 'end',
    position: { x: 850, y: 250 },
    icon: CheckCircle,
    label: { fr: 'Fin', en: 'End' },
    description: { fr: 'Fin du processus', en: 'Process complete' }
  }
};

// Connexions entre les nœuds - Basé sur le router() du backend
const GRAPH_EDGES = [
  // Point d'entrée
  { from: 'start', to: 'agent' },
  
  // De l'agent vers l'exécution ou la fin
  { from: 'agent', to: 'execute_tool', condition: 'tool_calls' },
  { from: 'agent', to: 'end', condition: 'no_tool_calls' },
  { from: 'agent', to: 'handle_error', condition: 'error' },
  
  // De l'exécution des outils vers les différents nœuds selon l'outil
  { from: 'execute_tool', to: 'agent', condition: 'chain_tools' },
  { from: 'execute_tool', to: 'generate_final_response', condition: 'analyze_risks' },
  { from: 'execute_tool', to: 'prepare_chart_display', condition: 'chart_tools' },
  { from: 'execute_tool', to: 'prepare_data_display', condition: 'data_display' },
  { from: 'execute_tool', to: 'prepare_news_display', condition: 'news' },
  { from: 'execute_tool', to: 'prepare_profile_display', condition: 'profile' },
  { from: 'execute_tool', to: 'handle_error', condition: 'error' },
  { from: 'execute_tool', to: 'end', condition: 'no_action' },
  
  // Gestion des erreurs
  { from: 'handle_error', to: 'cleanup_state' },
  
  // Tous les nœuds de préparation vont vers le nettoyage
  { from: 'generate_final_response', to: 'cleanup_state' },
  { from: 'prepare_chart_display', to: 'cleanup_state' },
  { from: 'prepare_data_display', to: 'cleanup_state' },
  { from: 'prepare_news_display', to: 'cleanup_state' },
  { from: 'prepare_profile_display', to: 'cleanup_state' },
  
  // Nettoyage vers la fin
  { from: 'cleanup_state', to: 'end' }
];

// Styles pour les différents types de nœuds
const NODE_STYLES = {
  start: {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    ring: 'ring-green-200',
    text: 'text-green-700'
  },
  decision: {
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    ring: 'ring-purple-200',
    text: 'text-purple-700'
  },
  process: {
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    ring: 'ring-blue-200',
    text: 'text-blue-700'
  },
  output: {
    bg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    ring: 'ring-orange-200',
    text: 'text-orange-700'
  },
  error: {
    bg: 'bg-gradient-to-r from-red-500 to-pink-500',
    ring: 'ring-red-200',
    text: 'text-red-700'
  },
  end: {
    bg: 'bg-gradient-to-r from-gray-600 to-gray-800',
    ring: 'ring-gray-200',
    text: 'text-gray-700'
  }
};

export default function AgentGraphPanel({ 
  toolCalls = [], 
  currentStep = -1, 
  isPlaying = false 
}) {
  const { language } = useLanguage();
  const svgRef = useRef(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 950, height: 550 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  
  // Créer la structure dynamique du graphe basé sur les outils appelés
  const graphStructure = useMemo(() => {
    // Inclure tous les nœuds de workflow du LangGraph
    const nodes = { ...WORKFLOW_NODES };
    const edges = [...GRAPH_EDGES];
    
    // Déterminer quels nœuds de préparation sont actifs selon les outils appelés
    const activePreparationNodes = new Set();
    const hasError = false; // Pourrait être dérivé de l'état si disponible
    
    toolCalls.forEach((toolCall) => {
      const toolName = toolCall.name || toolCall.tool_name;
      
      // Déterminer quel nœud de préparation est activé selon l'outil
      if (toolName === 'analyze_risks') {
        activePreparationNodes.add('generate_final_response');
      } else if (['compare_stocks', 'display_price_chart', 'create_dynamic_chart'].includes(toolName)) {
        activePreparationNodes.add('prepare_chart_display');
      } else if (['display_raw_data', 'display_processed_data'].includes(toolName)) {
        activePreparationNodes.add('prepare_data_display');
      } else if (toolName === 'get_stock_news') {
        activePreparationNodes.add('prepare_news_display');
      } else if (toolName === 'get_company_profile') {
        activePreparationNodes.add('prepare_profile_display');
      }
    });
    
    // Marquer les nœuds de préparation non utilisés
    Object.keys(nodes).forEach(nodeId => {
      if (nodeId.startsWith('prepare_') || nodeId === 'generate_final_response') {
        if (!activePreparationNodes.has(nodeId) && nodeId !== 'cleanup_state') {
          nodes[nodeId].inactive = true;
        }
      }
    });
    
    // Si pas d'outils appelés, marquer execute_tool comme inactif
    if (toolCalls.length === 0) {
      nodes.execute_tool.inactive = true;
    }
    
    return { nodes, edges, activePreparationNodes };
  }, [toolCalls]);
  
  // Déterminer quels nœuds sont actifs dans le workflow
  const activeNodes = useMemo(() => {
    const active = new Set(['start', 'agent']);
    
    // Si des outils ont été appelés, activer execute_tool
    if (toolCalls.length > 0) {
      active.add('execute_tool');
      
      // Activer les nœuds de préparation correspondants
      graphStructure.activePreparationNodes.forEach(nodeId => {
        active.add(nodeId);
      });
      
      // Cleanup et End sont toujours actifs après l'exécution
      active.add('cleanup_state');
      active.add('end');
    } else if (currentStep >= 0) {
      // Si pas d'outils, l'agent va directement à la fin
      active.add('end');
    }
    
    return active;
  }, [currentStep, toolCalls, graphStructure.activePreparationNodes]);
  
  // Déterminer quelles arêtes sont actives
  const activeEdges = useMemo(() => {
    const active = new Set();
    
    graphStructure.edges.forEach(edge => {
      if (activeNodes.has(edge.from) && activeNodes.has(edge.to)) {
        active.add(`${edge.from}-${edge.to}`);
      }
    });
    
    return active;
  }, [activeNodes, graphStructure.edges]);

  // Calculer les chemins SVG pour les connexions - ENHANCED: clearer paths
  const getEdgePath = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Enhanced: Better bezier curves for clearer path visualization
    // Use cubic bezier for smoother, more understandable paths
    const controlOffset = Math.min(80, distance * 0.4);
    
    // Different curve strategies based on relative positions
    if (Math.abs(dy) < 50 && dx > 0) {
      // Nearly horizontal - use simple straight connection
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    } else if (dx > 0 && dy !== 0) {
      // Forward connections - use smooth cubic bezier
      const cp1x = from.x + dx * 0.3;
      const cp1y = from.y;
      const cp2x = to.x - dx * 0.3;
      const cp2y = to.y;
      return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
    } else {
      // Backward or vertical connections - use quadratic bezier with offset
      const midX = from.x + dx * 0.5;
      const midY = from.y + dy * 0.5;
      const offsetX = dx < 0 ? -controlOffset : 0;
      return `M ${from.x} ${from.y} Q ${midX + offsetX} ${midY - controlOffset} ${to.x} ${to.y}`;
    }
  };

  // Gestion du pan (glisser-déposer) - FIXED: inverted controls
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click only
      setIsPanning(true);
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());
      setStartPoint({ x: cursorPt.x, y: cursorPt.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Fixed: Correct pan direction (subtract current from start)
    setViewBox({
      ...viewBox,
      x: viewBox.x - (cursorPt.x - startPoint.x),
      y: viewBox.y - (cursorPt.y - startPoint.y)
    });
    
    setStartPoint({ x: cursorPt.x, y: cursorPt.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // Gestion du zoom avec la molette - FIXED: inverted zoom direction
  const handleWheel = (e) => {
    e.preventDefault();
    // Fixed: Correct zoom direction (deltaY < 0 = zoom in)
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.5, Math.min(3, scale * scaleFactor));
    
    // Calculer le nouveau viewBox pour zoomer sur la position de la souris
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    const newWidth = 950 / newScale;
    const newHeight = 550 / newScale;
    
    // Centrer le zoom sur la position de la souris
    const newX = cursorPt.x - (cursorPt.x - viewBox.x) * (newWidth / viewBox.width);
    const newY = cursorPt.y - (cursorPt.y - viewBox.y) * (newHeight / viewBox.height);
    
    setViewBox({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
    setScale(newScale);
  };

  // Fonction pour réinitialiser la vue
  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: 950, height: 550 });
    setScale(1);
  };

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      {/* Contrôles de navigation */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <motion.button
          onClick={resetView}
          className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-sm transition-all duration-150"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={language === 'fr' ? 'Réinitialiser la vue' : 'Reset view'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.button>
        <div className="px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm text-xs text-gray-600">
          {language === 'fr' ? 'Glissez pour naviguer • Molette pour zoomer' : 'Drag to pan • Scroll to zoom'}
        </div>
      </div>
      
      {/* Graphe SVG */}
      <div className="w-full h-full">
        <svg 
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            minHeight: '350px', 
            maxHeight: '400px',
            cursor: isPanning ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* Définitions pour les gradients et filtres */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <linearGradient id="activeEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8"/>
            </linearGradient>
            
            {/* Pattern de grille pour l'arrière-plan */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          
          {/* Arrière-plan avec grille subtile */}
          <rect 
            x={viewBox.x - 1000} 
            y={viewBox.y - 1000} 
            width={viewBox.width + 2000} 
            height={viewBox.height + 2000} 
            fill="url(#grid)" 
          />

          {/* Enhanced: Clearer edge rendering with better visibility */}
          {graphStructure.edges.map(edge => {
            const fromNode = graphStructure.nodes[edge.from];
            const toNode = graphStructure.nodes[edge.to];
            const edgeId = `${edge.from}-${edge.to}`;
            const isActive = activeEdges.has(edgeId);
            
            return (
              <g key={edgeId}>
                {/* Arrow marker for better path direction understanding */}
                {isActive && (
                  <defs>
                    <marker
                      id={`arrow-${edgeId}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path
                        d="M 0 0 L 10 5 L 0 10 z"
                        fill={isActive ? "#8b5cf6" : "#d1d5db"}
                      />
                    </marker>
                  </defs>
                )}
                
                {/* Shadow for better contrast */}
                <motion.path
                  d={getEdgePath(fromNode.position, toNode.position)}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={isActive ? "5" : "3"}
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: isActive ? 1 : 0.3, 
                    opacity: isActive ? 0.3 : 0.1 
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{ filter: "blur(2px)" }}
                />
                
                {/* Main path */}
                <motion.path
                  d={getEdgePath(fromNode.position, toNode.position)}
                  stroke={isActive ? "url(#activeEdge)" : "#d1d5db"}
                  strokeWidth={isActive ? "3" : "2"}
                  fill="none"
                  strokeDasharray={isActive ? "0" : "5,5"}
                  markerEnd={isActive ? `url(#arrow-${edgeId})` : ""}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: isActive ? 1 : 0.5, 
                    opacity: isActive ? 1 : 0.4 
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{ filter: isActive ? "url(#glow)" : "none" }}
                />
                
                {/* Path label for active edges */}
                {isActive && edge.condition && (
                  <text
                    x={(fromNode.position.x + toNode.position.x) / 2}
                    y={(fromNode.position.y + toNode.position.y) / 2 - 10}
                    textAnchor="middle"
                    className="text-xs font-medium fill-purple-600"
                    style={{ pointerEvents: 'none' }}
                  >
                    {edge.condition.replace('_', ' ')}
                  </text>
                )}
              </g>
            );
          })}

          {/* Particules de flux animées */}
          <AnimatePresence>
            {isPlaying && Array.from(activeEdges).map(edgeId => {
              const [fromId, toId] = edgeId.split('-');
              const fromNode = graphStructure.nodes[fromId];
              const toNode = graphStructure.nodes[toId];
              
              if (!fromNode || !toNode) return null;
              
              return (
                <motion.circle
                  key={`particle-${edgeId}`}
                  r="3"
                  fill="url(#activeEdge)"
                  initial={{ 
                    cx: fromNode.position.x, 
                    cy: fromNode.position.y,
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    cx: toNode.position.x, 
                    cy: toNode.position.y,
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0]
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  style={{ filter: "url(#glow)" }}
                />
              );
            })}
          </AnimatePresence>

          {/* Nœuds */}
          {Object.values(graphStructure.nodes).map(node => {
            const isActive = activeNodes.has(node.id);
            const isCurrent = currentStep >= 0 && (
              (node.id === 'agent' && currentStep === 0) ||
              (node.type === 'tool_used' && toolCalls.findIndex(tc => (tc.name || tc.tool_name) === node.id) === currentStep - 1) ||
              (node.id === 'end' && currentStep === toolCalls.length + 1)
            );
            
            // Déterminer le style selon le type de nœud
            let nodeColor = "#f3f4f6";
            let strokeColor = "#d1d5db";
            const isInactive = node.inactive;
            
            if (node.type === 'start') {
              nodeColor = isActive ? "#10b981" : "#f3f4f6";
              strokeColor = isActive ? "#059669" : "#d1d5db";
            } else if (node.type === 'decision') {
              nodeColor = isActive ? "url(#activeEdge)" : "#f3f4f6";
              strokeColor = isActive ? "#8b5cf6" : "#d1d5db";
            } else if (node.type === 'process') {
              nodeColor = isActive && !isInactive ? "#3b82f6" : "#f3f4f6";
              strokeColor = isActive && !isInactive ? "#2563eb" : "#d1d5db";
            } else if (node.type === 'output') {
              nodeColor = isActive && !isInactive ? "#f59e0b" : "#f3f4f6";
              strokeColor = isActive && !isInactive ? "#d97706" : "#d1d5db";
            } else if (node.type === 'error') {
              nodeColor = isActive ? "#ef4444" : "#f3f4f6";
              strokeColor = isActive ? "#dc2626" : "#d1d5db";
            } else if (node.type === 'end') {
              nodeColor = isActive ? "#10b981" : "#f3f4f6";
              strokeColor = isActive ? "#059669" : "#d1d5db";
            }
            
            if (isCurrent) {
              strokeColor = "#8b5cf6";
            }
            
            return (
              <g key={node.id}>
                {/* Cercle de fond du nœud */}
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={node.inactive ? "18" : "22"}
                  fill={nodeColor}
                  stroke={strokeColor}
                  strokeWidth={isCurrent ? "3" : "2"}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: isActive && !node.inactive ? 1.1 : (node.inactive ? 0.8 : 1), 
                    opacity: node.inactive ? 0.4 : (isActive ? 1 : 0.7) 
                  }}
                  transition={{ 
                    type: "spring", 
                    duration: 0.5,
                    scale: {
                      duration: 0.3,
                      ease: "easeOut"
                    }
                  }}
                  style={{ 
                    filter: isCurrent ? "url(#glow)" : "none",
                    transformOrigin: `${node.position.x}px ${node.position.y}px`
                  }}
                />
                
                {/* Animation de pulsation pour le nœud courant */}
                {isCurrent && (
                  <motion.circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r="28"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    opacity="0.6"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ transformOrigin: `${node.position.x}px ${node.position.y}px` }}
                  />
                )}

                {/* Icône du nœud */}
                {typeof node.icon === 'string' ? (
                  <text
                    x={node.position.x}
                    y={node.position.y + 2}
                    textAnchor="middle"
                    className="text-sm"
                    style={{ 
                      fontSize: node.inactive ? '14px' : '16px',
                      opacity: node.inactive ? 0.5 : 1
                    }}
                  >
                    {node.icon}
                  </text>
                ) : (
                  <foreignObject
                    x={node.position.x - 10}
                    y={node.position.y - 10}
                    width="20"
                    height="20"
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      {node.icon && (
                        <node.icon 
                          className={`w-4 h-4 ${node.inactive ? 'text-gray-400' : 'text-gray-700'}`}
                          style={{ opacity: node.inactive ? 0.5 : 1 }}
                        />
                      )}
                    </div>
                  </foreignObject>
                )}

                {/* Enhanced: Better label visibility with background */}
                <g>
                  {/* Label background for better readability */}
                  <rect
                    x={node.position.x - 40}
                    y={node.position.y + 28}
                    width="80"
                    height="20"
                    rx="4"
                    fill="white"
                    fillOpacity="0.9"
                    stroke={isActive && !node.inactive ? strokeColor : "transparent"}
                    strokeWidth="1"
                  />
                  <text
                    x={node.position.x}
                    y={node.position.y + 42}
                    textAnchor="middle"
                    className={`text-xs font-semibold transition-all duration-300 ${
                      isActive && !node.inactive ? 'fill-gray-900' : (node.inactive ? 'fill-gray-400' : 'fill-gray-600')
                    }`}
                    style={{ 
                      fontSize: node.inactive ? '10px' : '12px',
                      pointerEvents: 'none'
                    }}
                  >
                    {node.label[language]}
                  </text>
                </g>
                
                {/* Enhanced: Better text card visibility and positioning */}
                {node.description && isActive && !node.inactive && (
                  <motion.foreignObject
                    x={node.position.x - 60}
                    y={node.position.y + 50}
                    width="140"
                    height="auto"
                    initial={{ opacity: 0, scale: 0.8, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -5 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="bg-white/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl border border-gray-200">
                      <div className="text-xs font-medium text-gray-800 text-center">
                        {node.description[language]}
                      </div>
                    </div>
                  </motion.foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Status overlay */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-4 h-4 text-purple-600" />
                </motion.div>
                <span className="text-sm text-gray-700">
                  {language === 'fr' ? 'Exécution en cours...' : 'Execution in progress...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
