"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import { motion } from "motion/react";
import { Eye, Search, ArrowRight, MessageCircle, Sparkles } from "lucide-react";

export default function AgentVisualizationPage() {
  const { language } = useLanguage();
  const [sessionId, setSessionId] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionId.trim()) {
      // For demo purposes, we'll use a mock session ID
      // In real implementation, this would validate the session ID
      window.location.href = `/chat?visualize=${sessionId.trim()}`;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <ThreadsBackground
          color={[0, 0, 0]}
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>

      {/* Navbar */}
      <ChatNavbar />

      {/* Main content */}
      <div className="relative z-20 min-h-screen pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
              <Eye className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {language === 'fr' ? 'Visualisation de l\'agent' : 'Agent Visualization'}
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {language === 'fr' 
                ? 'Découvrez le processus de réflexion de Stella étape par étape'
                : 'Discover Stella\'s reasoning process step by step'
              }
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-sm bg-white/90 border border-gray-200/50 rounded-3xl p-8 shadow-xl mb-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {language === 'fr' 
                  ? 'Comment utiliser la visualisation'
                  : 'How to use visualization'
                }
              </h2>
              <p className="text-gray-600">
                {language === 'fr' 
                  ? 'La visualisation est intégrée directement dans vos conversations avec Stella'
                  : 'Visualization is integrated directly into your conversations with Stella'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'fr' ? '1. Conversez avec Stella' : '1. Chat with Stella'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'fr' 
                    ? 'Posez vos questions financières et laissez Stella analyser'
                    : 'Ask your financial questions and let Stella analyze'
                  }
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'fr' ? '2. Outils activés' : '2. Tools triggered'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'fr' 
                    ? 'Quand Stella utilise des outils, la visualisation devient disponible'
                    : 'When Stella uses tools, visualization becomes available'
                  }
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'fr' ? '3. Visualisez le processus' : '3. Visualize the process'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'fr' 
                    ? 'Cliquez sur le bouton de visualisation pour voir l\'animation'
                    : 'Click the visualization button to see the animation'
                  }
                </p>
              </motion.div>
            </div>

            <div className="text-center">
              <motion.a
                href="/chat"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                {language === 'fr' ? 'Commencer une conversation' : 'Start a conversation'}
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="backdrop-blur-sm bg-white/90 border border-gray-200/50 rounded-3xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {language === 'fr' ? 'Fonctionnalités' : 'Features'}
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  {language === 'fr' ? 'Animation étape par étape' : 'Step-by-step animation'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  {language === 'fr' ? 'Contrôles de vitesse' : 'Speed controls'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  {language === 'fr' ? 'Aperçu des étapes' : 'Step thumbnails'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  {language === 'fr' ? 'Téléchargement des frames' : 'Frame downloads'}
                </li>
              </ul>
            </div>

            <div className="backdrop-blur-sm bg-white/90 border border-gray-200/50 rounded-3xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {language === 'fr' ? 'Quand est-ce disponible ?' : 'When is it available?'}
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {language === 'fr' ? 'Analyses de données' : 'Data analysis'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {language === 'fr' ? 'Recherches financières' : 'Financial research'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {language === 'fr' ? 'Calculs complexes' : 'Complex calculations'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {language === 'fr' ? 'Génération de graphiques' : 'Chart generation'}
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
