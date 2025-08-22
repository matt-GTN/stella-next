"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Brain, Tool, Sparkles, Zap, Check, Clock, ArrowRight, BarChart3, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import AgentGraphPanel from "./AgentGraphPanel";

// Tool icons mapping
const toolIcons = {
  'analyze_fundamentals': '📊',
  'calculate_risk_score': '⚡',
  'compare_companies': '🏢',
  'compare_to_index': '📈',
  'fetch_company_news': '📰',
  'fetch_company_profile': '🏭',
  'predict_risk': '🎯',
  'search_ticker': '🔍',
  'visualize_prediction': '📉',
  'calculate_technical_indicators': '📐',
  'analyze_sentiment': '💭',
  'generate_report': '📄'
};

// Tool descriptions mapping
const toolDescriptions = {
  'analyze_fundamentals': {
    fr: 'Analyse des données fondamentales',
    en: 'Analyzing fundamental data'
  },
  'calculate_risk_score': {
    fr: 'Calcul du score de risque',
    en: 'Calculating risk score'
  },
  'compare_companies': {
    fr: 'Comparaison avec d\'autres entreprises',
    en: 'Comparing with other companies'
  },
  'compare_to_index': {
    fr: 'Comparaison avec les indices',
    en: 'Comparing with indices'
  },
  'fetch_company_news': {
    fr: 'Récupération des actualités',
    en: 'Fetching company news'
  },
  'fetch_company_profile': {
    fr: 'Chargement du profil d\'entreprise',
    en: 'Loading company profile'
  },
  'predict_risk': {
    fr: 'Prédiction du risque',
    en: 'Predicting risk'
  },
  'search_ticker': {
    fr: 'Recherche du ticker',
    en: 'Searching ticker'
  },
  'visualize_prediction': {
    fr: 'Création de la visualisation',
    en: 'Creating visualization'
  },
  'calculate_technical_indicators': {
    fr: 'Calcul des indicateurs techniques',
    en: 'Calculating technical indicators'
  },
  'analyze_sentiment': {
    fr: 'Analyse du sentiment',
    en: 'Analyzing sentiment'
  },
  'generate_report': {
    fr: 'Génération du rapport',
    en: 'Generating report'
  }
};

export default function AgentSidePanel({ isOpen, onClose, toolCalls = [], initialContent, finalContent }) {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [container, setContainer] = useState(null);
  const [viewMode, setViewMode] = useState('graph'); // 'list' or 'graph'
  
  // Find the container element for the portal
  useEffect(() => {
    const containerElement = document.getElementById('agent-side-panel-container');
    setContainer(containerElement);
  }, []);

  // Auto-play animation
  useEffect(() => {
    if (isOpen && toolCalls.length > 0 && currentStep === -1) {
      // Start animation when panel opens
      setTimeout(() => {
        setCurrentStep(0);
        setIsPlaying(true);
      }, 500);
    }
  }, [isOpen, toolCalls]);

  // Animation progression
  useEffect(() => {
    if (isPlaying && currentStep >= 0 && currentStep < toolCalls.length + 2) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        if (currentStep >= toolCalls.length + 1) {
          setIsPlaying(false);
        }
      }, playSpeed);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, toolCalls.length, playSpeed]);

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep(-1);
        setIsPlaying(false);
      }, 300);
    }
  }, [isOpen]);

  const getToolDescription = (toolName) => {
    const cleanName = toolName.replace(/_/g, '_').toLowerCase();
    return toolDescriptions[cleanName]?.[language] || toolName;
  };

  const getToolIcon = (toolName) => {
    const cleanName = toolName.replace(/_/g, '_').toLowerCase();
    return toolIcons[cleanName] || '⚙️';
  };

  // If container is not available or panel is closed, don't render
  if (!container || !isOpen) {
    return null;
  }

  const panelContent = (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="h-full w-full bg-white/30 backdrop-blur-xl shadow-2xl flex flex-col rounded-3xl border border-white/20 overflow-hidden ml-4 mr-2 max-w-[580px]"
    >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/20">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
                >
                  <Brain className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'fr' ? 'Processus de Stella' : 'Stella\'s Process'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {language === 'fr' ? `${toolCalls.length} étapes` : `${toolCalls.length} steps`}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 backdrop-blur-sm transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* View Mode & Speed Control */}
            <div className="px-6 py-3 border-b border-white/10 bg-white/10 space-y-3">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'fr' ? 'Mode d\'affichage' : 'Display mode'}
                </span>
                <div className="flex gap-1 bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('graph')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      viewMode === 'graph'
                        ? 'bg-purple-500/30 text-purple-700 border border-purple-500/30'
                        : 'text-gray-600 hover:bg-white/30'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" />
                    {language === 'fr' ? 'Graphe' : 'Graph'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      viewMode === 'list'
                        ? 'bg-purple-500/30 text-purple-700 border border-purple-500/30'
                        : 'text-gray-600 hover:bg-white/30'
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    {language === 'fr' ? 'Liste' : 'List'}
                  </motion.button>
                </div>
              </div>

              {/* Speed Control */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'fr' ? 'Vitesse d\'animation' : 'Animation speed'}
                </span>
                <div className="flex gap-2">
                  {[500, 1000, 2000].map(speed => (
                    <motion.button
                      key={speed}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPlaySpeed(speed)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all backdrop-blur-sm ${
                        playSpeed === speed 
                          ? 'bg-purple-500/20 text-purple-700 border border-purple-500/30' 
                          : 'bg-white/30 text-gray-700 hover:bg-white/40 border border-white/20'
                      }`}
                    >
                      {speed === 500 ? '2x' : speed === 1000 ? '1x' : '0.5x'}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {viewMode === 'graph' ? (
                  <motion.div
                    key="graph-view"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full p-4 overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent hover:scrollbar-thumb-white/50"
                  >
                    <AgentGraphPanel 
                      toolCalls={toolCalls}
                      currentStep={currentStep}
                      isPlaying={isPlaying}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list-view"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-white/5 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent hover:scrollbar-thumb-white/50"
                  >
                    {/* Initial Thinking Phase */}
                    <AnimatePresence mode="wait">
                      {currentStep >= 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="relative"
                        >
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-transparent" />
                          
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative z-10 flex items-start gap-3"
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm ${
                              currentStep === 0 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                                : 'bg-white/40 border border-white/20'
                            }`}>
                              <Sparkles className={`w-6 h-6 ${
                                currentStep === 0 ? 'text-white' : 'text-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {language === 'fr' ? 'Analyse de la requête' : 'Analyzing request'}
                              </h3>
                              {initialContent && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                  {initialContent}
                                </p>
                              )}
                              {currentStep === 0 && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: playSpeed / 1000 }}
                                  className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"
                                />
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tool Calls */}
                    <div className="space-y-4">
                      {toolCalls.map((toolCall, index) => (
                        <AnimatePresence key={index} mode="wait">
                          {currentStep >= index + 1 && (
                            <motion.div
                              initial={{ opacity: 0, x: -50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 50 }}
                              transition={{ 
                                type: "spring",
                                duration: 0.5,
                                delay: 0.1
                              }}
                              className="relative"
                            >
                              {/* Connection line */}
                              {index < toolCalls.length - 1 && (
                                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent" />
                              )}
                              
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="relative z-10 flex items-start gap-3"
                              >
                                <motion.div
                                  initial={{ rotate: -180, scale: 0 }}
                                  animate={{ rotate: 0, scale: 1 }}
                                  transition={{ 
                                    type: "spring",
                                    duration: 0.6,
                                    delay: 0.2
                                  }}
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all backdrop-blur-sm ${
                                    currentStep === index + 1
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse' 
                                      : currentStep > index + 1
                                      ? 'bg-green-500/20 border border-green-500/30'
                                      : 'bg-white/40 border border-white/20'
                                  }`}
                                >
                                  <span className="text-2xl">
                                    {getToolIcon(toolCall.name || toolCall.tool_name)}
                                  </span>
                                </motion.div>
                                
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {getToolDescription(toolCall.name || toolCall.tool_name)}
                                    {currentStep > index + 1 && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", duration: 0.3 }}
                                      >
                                        <Check className="w-4 h-4 text-green-500" />
                                      </motion.div>
                                    )}
                                  </h3>
                                  
                                  {/* Tool arguments preview */}
                                  {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      transition={{ duration: 0.3, delay: 0.3 }}
                                      className="mt-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/10">
                                      <div className="text-xs text-gray-500 space-y-1">
                                        {Object.entries(toolCall.args).slice(0, 3).map(([key, value]) => (
                                          <div key={key} className="flex items-center gap-2">
                                            <span className="font-medium">{key}:</span>
                                            <span className="truncate">
                                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}

                                  {/* Progress bar for current step */}
                                  {currentStep === index + 1 && (
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: "100%" }}
                                      transition={{ duration: playSpeed / 1000, ease: "linear" }}
                                      className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"
                                    />
                                  )}
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ))}
                    </div>

                    {/* Final Response Phase */}
                    <AnimatePresence mode="wait">
                      {currentStep >= toolCalls.length + 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="relative"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative z-10 flex items-start gap-3"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {language === 'fr' ? 'Réponse finale' : 'Final response'}
                              </h3>
                              {finalContent && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                  {finalContent}
                                </p>
                              )}
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 font-medium"
                              >
                                <Zap className="w-3 h-3" />
                                {language === 'fr' ? 'Traitement terminé' : 'Processing complete'}
                              </motion.div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Replay Button */}
            <div className="p-6 border-t border-white/10 bg-white/20 backdrop-blur-sm">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentStep(0);
                  setIsPlaying(true);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                {language === 'fr' ? 'Rejouer l\'animation' : 'Replay animation'}
              </motion.button>
            </div>
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>{panelContent}</AnimatePresence>, 
    container
  );
}
