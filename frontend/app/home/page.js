"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import { Brain, FileText, PlayCircle, MessageSquare } from "lucide-react";

export default function HomePage() {
  const { language, translations } = useLanguage();

  const features = [
    {
      id: 'stella',
      icon: MessageSquare,
      title: {
        fr: 'Stella Assistant',
        en: 'Stella Assistant'
      },
      description: {
        fr: "Interface conversationnelle avec l'IA pour l'analyse financière approfondie et la prédiction de risques.",
        en: "Conversational AI interface for in-depth financial analysis and risk prediction."
      },
      details: {
        fr: ["Analyse fondamentale", "Prédiction de risques", "Comparaisons d'actions"],
        en: ["Fundamental analysis", "Risk prediction", "Stock comparisons"]
      },
      href: '/',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'modeling',
      icon: Brain,
      title: {
        fr: 'Modélisation ML',
        en: 'ML Modeling'
      },
      description: {
        fr: "Explorer et ajuster les paramètres du Random Forest Classifier pour optimiser les prédictions.",
        en: "Explore and adjust Random Forest Classifier parameters to optimize predictions."
      },
      details: {
        fr: ["Hyperparamètres", "Métriques de performance", "Analyse SHAP"],
        en: ["Hyperparameters", "Performance metrics", "SHAP analysis"]
      },
      href: '/modeling',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'visualization',
      icon: PlayCircle,
      title: {
        fr: 'Visualisation Agent',
        en: 'Agent Visualization'
      },
      description: {
        fr: "Replay visuel des processus de décision de l'agent IA étape par étape.",
        en: "Visual replay of AI agent decision processes step by step."
      },
      details: {
        fr: ["Replay interactif", "Flux de décision", "Traçabilité"],
        en: ["Interactive replay", "Decision flow", "Traceability"]
      },
      href: '/agent-visualization',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'report',
      icon: FileText,
      title: {
        fr: 'Documentation',
        en: 'Documentation'
      },
      description: {
        fr: "Accédez au rapport de recherche complet et à la documentation technique du projet.",
        en: "Access the complete research report and technical documentation of the project."
      },
      details: {
        fr: ["Rapport PDF", "Méthodologie", "Résultats"],
        en: ["PDF Report", "Methodology", "Results"]
      },
      href: '/research-report',
      gradient: 'from-amber-500 to-orange-500'
    }
  ];

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
      <div className="relative z-20 h-screen flex flex-col pt-24">
        <div className="flex-1 px-4 md:px-8 lg:px-12 py-8">
          <div className="max-w-6xl mx-auto w-full h-full">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Stella Platform
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {language === 'fr' 
                  ? "Plateforme d'analyse financière alimentée par l'intelligence artificielle"
                  : "AI-powered financial analysis platform"
                }
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Link key={feature.id} href={feature.href} className="group">
                    <div className="h-full backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 cursor-pointer">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">
                        {feature.title[language]}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {feature.description[language]}
                      </p>
                      
                      <div className="space-y-1">
                        {feature.details[language].map((detail, idx) => (
                          <div key={idx} className="flex items-center text-xs text-gray-500">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {language === 'fr' ? 'Commencer l\'exploration' : 'Start exploring'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {language === 'fr' 
                    ? "Sélectionnez un module pour débuter votre analyse financière avec Stella"
                    : "Select a module to begin your financial analysis with Stella"
                  }
                </p>
                <Link href="/">
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    {language === 'fr' ? 'Parler avec Stella' : 'Chat with Stella'}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
