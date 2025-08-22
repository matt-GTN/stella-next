"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import { Download, FileText, ExternalLink } from "lucide-react";

export default function ResearchReportPage() {
  const { language } = useLanguage();

  const pdfUrl = "https://drive.usercontent.google.com/download?id=1iuRySCgm_xMnWsFptM0Ip_g1hnSVOJdV&export=download&authuser=0&confirm=t";

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  const sections = [
    {
      title: language === 'fr' ? 'Résumé exécutif' : 'Executive summary',
      description: language === 'fr' ? 'Vue d\'ensemble des objectifs et résultats clés' : 'Overview of objectives and key results'
    },
    {
      title: language === 'fr' ? 'Méthodologie' : 'Methodology', 
      description: language === 'fr' ? 'Approche scientifique et techniques utilisées' : 'Scientific approach and techniques used'
    },
    {
      title: language === 'fr' ? 'Modèles ML' : 'ML Models',
      description: language === 'fr' ? 'Architecture et performance des modèles' : 'Model architecture and performance'
    },
    {
      title: language === 'fr' ? 'Conclusions' : 'Conclusions',
      description: language === 'fr' ? 'Insights et recommandations futures' : 'Insights and future recommendations'
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
          <div className="max-w-7xl mx-auto w-full h-full">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mr-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {language === 'fr' ? 'Documentation' : 'Documentation'}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {language === 'fr' ? 'Rapport de recherche technique' : 'Technical research report'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              {/* Left Panel - Report Overview */}
              <div className="lg:col-span-1 space-y-6">
                <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {language === 'fr' ? 'Vue d\'ensemble' : 'Overview'}
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {language === 'fr' 
                      ? "Documentation complète du projet d'analyse financière par intelligence artificielle."
                      : "Complete documentation of the AI-powered financial analysis project."
                    }
                  </p>
                  
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h3 className="font-medium text-gray-800 text-sm">{section.title}</h3>
                          <p className="text-gray-600 text-xs mt-1">{section.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    <span>
                      {language === 'fr' ? 'Télécharger le rapport' : 'Download report'}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="w-full flex items-center justify-center space-x-3 backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/15 text-gray-800 font-medium py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>
                      {language === 'fr' ? 'Ouvrir dans un nouvel onglet' : 'Open in new tab'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Panel - PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-4 h-full">
                  <div className="relative w-full h-full" style={{ minHeight: '600px' }}>
                    <iframe 
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                      className="w-full h-full rounded-2xl"
                      title={language === 'fr' ? 'Rapport de recherche' : 'Research Report'}
                      loading="lazy"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
