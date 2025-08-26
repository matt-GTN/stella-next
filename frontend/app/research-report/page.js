"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  BookOpen,
  Loader2,
  Database,
  Settings,
  BarChart3,
  TrendingUp,
  Zap
} from "lucide-react";

export default function ResearchReportPage() {
  const { language } = useLanguage();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [hoveredSection, setHoveredSection] = useState(null);

  const pdfUrl = "https://drive.usercontent.google.com/download?id=1iuRySCgm_xMnWsFptM0Ip_g1hnSVOJdV&export=download&authuser=0&confirm=t";

  const handleDownload = async () => {
    setIsDownloading(true);
    window.open(pdfUrl, '_blank');
    setTimeout(() => setIsDownloading(false), 2000);
  };

  const sections = [
    {
      icon: Database,
      title: language === 'fr' ? 'Contexte' : 'Context',
      description: language === 'fr' ? 'Données fondamentales du Nasdaq' : 'Nasdaq fundamental data',
      color: 'from-blue-500 to-blue-600',
      page: 3
    },
    {
      icon: Settings,
      title: language === 'fr' ? 'Pré-processing' : 'Pre-processing',
      description: language === 'fr' ? 'Ingénierie des caractéristiques' : 'Feature engineering',
      color: 'from-green-500 to-green-600',
      page: 6
    },
    {
      icon: BarChart3,
      title: language === 'fr' ? 'Visualisation' : 'Visualization',
      description: language === 'fr' ? 'Analyse graphique des données' : 'Graphical data analysis',
      color: 'from-purple-500 to-purple-600',
      page: 14
    },
    {
      icon: TrendingUp,
      title: language === 'fr' ? 'Modélisation' : 'Technical Analysis',
      description: language === 'fr' ? 'Machine Learning en apprentissage supervisé' : 'Other exploration paths',
      color: 'from-orange-500 to-orange-600',
      page: 25
    },
    {
      icon: Zap,
      title: language === 'fr' ? 'Mise en Œuvre' : 'Implementation',
      description: language === 'fr' ? 'Agent LangGraph' : 'Deployment and results',
      color: 'from-violet-500 to-violet-600',
      page: 44
    }
  ];


  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <ThreadsBackground
          color={[0.6706, 0.2784, 0.7373]} // Light gray/purple threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>

      {/* Subtle background gradient */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Navbar */}
      <ChatNavbar />

      {/* Main content */}
      <div className="relative h-screen pt-8">
        <div className="px-4 h-full">
          <div className="max-w-7xl mx-auto w-full h-full pb-4 overflow-hidden flex flex-col">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Left Panel - Report Overview */}
              <motion.div
                className="lg:col-span-1 space-y-5 h-full overflow-y-auto"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="backdrop-blur-xs bg-white/20 border border-white/30 rounded-3xl p-6 shadow-lg"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.h2
                    className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    {language === 'fr' ? 'Résumé' : 'Summary'}
                  </motion.h2>


                  <div className="space-y-3">
                    {sections.map((section, index) => {
                      const Icon = section.icon;
                      return (
                        <motion.div
                          key={index}
                          className="group relative"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          onMouseEnter={() => setHoveredSection(index)}
                          onMouseLeave={() => setHoveredSection(null)}
                        >
                          <motion.div
                            className="flex items-start space-x-3 p-4 rounded-2xl bg-white/80 shadow-lg border-white/20"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                              animate={hoveredSection === index ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                                  p.{section.page}
                                </span>
                              </div>
                              <p className="text-gray-600 text-xs leading-relaxed">{section.description}</p>
                            </div>
                          </motion.div>

                          {/* Hover indicator */}
                          <AnimatePresence>
                            {hoveredSection === index && (
                              <motion.div
                                className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                exit={{ opacity: 0, scaleY: 0 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                >
                  <motion.button
                    onClick={handleDownload}
                    className="w-4/5 ml-10 flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl"
                    whileHover={{ 
                      scale: 1.02,
                      background: "linear-gradient(to right, #7c3aed, #be185d)",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span>
                      {isDownloading
                        ? (language === 'fr' ? 'Téléchargement...' : 'Downloading...')
                        : (language === 'fr' ? 'Télécharger le rapport' : 'Download report')
                      }
                    </span>
                  </motion.button>


                </motion.div>
              </motion.div>

              {/* Right Panel - PDF Viewer */}
              <motion.div
                className="lg:col-span-2 h-full"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div
                  className="backdrop-blur-xs bg-white/20 border border-white/30 rounded-3xl p-4 shadow-lg overflow-hidden h-full flex flex-col"
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* PDF Content */}
                  <div className="relative w-full flex-1 overflow-hidden">
                    {/* Loading state */}
                    <AnimatePresence>
                      {isPdfLoading && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-xs rounded-2xl z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="text-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mx-auto mb-3"
                            >
                              <Loader2 className="w-10 h-10 text-purple-600" />
                            </motion.div>
                            <p className="text-sm text-gray-700 font-medium">
                              {language === 'fr' ? 'Chargement du document...' : 'Loading document...'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <iframe
                      src="https://drive.google.com/file/d/1iuRySCgm_xMnWsFptM0Ip_g1hnSVOJdV/preview"
                      className="w-full h-full rounded-xl shadow-inner"
                      title={language === 'fr' ? 'Rapport de recherche Stella' : 'Stella Research Report'}
                      loading="lazy"
                      onLoad={() => setIsPdfLoading(false)}
                      style={{
                        border: 'none',
                        background: 'white'
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
