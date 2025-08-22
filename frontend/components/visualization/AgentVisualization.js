"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Loader2,
  Eye,
  X,
  Download
} from "lucide-react";

const ANIMATION_SPEEDS = [
  { value: 0.5, label: "2x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "0.75x" },
  { value: 2, label: "0.5x" },
  { value: 3, label: "0.33x" }
];

export default function AgentVisualization({ sessionId, isOpen, onClose }) {
  const { language } = useLanguage();
  
  // Animation state
  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Playback controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playbackTimeout, setPlaybackTimeout] = useState(null);

  // Load animation frames from API
  const loadFrames = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/animation-frames/${sessionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setFrames(data.frames || []);
      setCurrentFrame(0);
      
    } catch (err) {
      console.error('Failed to load animation frames:', err);
      setError(language === 'fr' 
        ? `Impossible de charger l'animation : ${err.message}`
        : `Failed to load animation: ${err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, language]);

  // Load frames when component opens
  useEffect(() => {
    if (isOpen && sessionId) {
      loadFrames();
    }
  }, [isOpen, sessionId, loadFrames]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      if (currentFrame < frames.length - 1) {
        const timeout = setTimeout(() => {
          setCurrentFrame(prev => prev + 1);
        }, speed * 1000);
        setPlaybackTimeout(timeout);
      } else {
        setIsPlaying(false);
      }
    }
    
    return () => {
      if (playbackTimeout) {
        clearTimeout(playbackTimeout);
      }
    };
  }, [isPlaying, currentFrame, frames.length, speed]);

  // Control functions
  const handlePlay = () => {
    if (currentFrame === frames.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
    }
  };

  const handlePrevious = () => {
    if (currentFrame > 0) {
      setCurrentFrame(currentFrame - 1);
    }
  };

  const handleNext = () => {
    if (currentFrame < frames.length - 1) {
      setCurrentFrame(currentFrame + 1);
    }
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
    }
  };

  const handleDownload = () => {
    if (frames[currentFrame]) {
      const link = document.createElement('a');
      link.href = frames[currentFrame].image_base64;
      link.download = `stella-agent-step-${currentFrame + 1}.png`;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative max-w-5xl w-full max-h-[90vh] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-black/10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-6 h-6 text-purple-600" />
                {language === 'fr' ? 'Visualisation de l\'agent' : 'Agent Visualization'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'fr' 
                  ? 'Découvrez le processus de réflexion de Stella étape par étape'
                  : 'Discover Stella\'s reasoning process step by step'
                }
              </p>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-600">
                  {language === 'fr' 
                    ? 'Génération de l\'animation...' 
                    : 'Generating animation...'
                  }
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
              >
                <p className="text-red-800 mb-4">{error}</p>
                <motion.button
                  onClick={loadFrames}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {language === 'fr' ? 'Réessayer' : 'Retry'}
                </motion.button>
              </motion.div>
            )}

            {/* Animation Display */}
            {frames.length > 0 && !isLoading && (
              <div className="space-y-6">
                {/* Current Frame Display */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="text-center mb-4">
                    <motion.h3 
                      key={currentFrame}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl font-semibold text-gray-900 mb-2"
                    >
                      {frames[currentFrame]?.description}
                    </motion.h3>
                    <p className="text-sm text-gray-600">
                      {language === 'fr' ? 'Étape' : 'Step'} {currentFrame + 1} / {frames.length}
                    </p>
                  </div>
                  
                  {/* Frame Image */}
                  <motion.div 
                    key={currentFrame}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <img
                      src={frames[currentFrame]?.image_base64}
                      alt={frames[currentFrame]?.description}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    
                    {/* Download button */}
                    <motion.button
                      onClick={handleDownload}
                      className="absolute top-3 right-3 p-2 bg-black/70 text-white rounded-full hover:bg-black/90 transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentFrame + 1) / frames.length) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-gray-50 rounded-2xl p-4">
                  {/* Navigation Controls */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={handleReset}
                      disabled={currentFrame === 0 && !isPlaying}
                      className="p-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      onClick={handlePrevious}
                      disabled={currentFrame === 0}
                      className="p-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SkipBack className="w-4 h-4" />
                    </motion.button>
                    
                    {!isPlaying ? (
                      <motion.button
                        onClick={handlePlay}
                        disabled={currentFrame === frames.length - 1}
                        className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handlePause}
                        className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Pause className="w-5 h-5" />
                      </motion.button>
                    )}
                    
                    <motion.button
                      onClick={handleNext}
                      disabled={currentFrame === frames.length - 1}
                      className="p-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SkipForward className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Speed Control */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">
                      {language === 'fr' ? 'Vitesse:' : 'Speed:'}
                    </span>
                    <div className="flex gap-1">
                      {ANIMATION_SPEEDS.map((speedOption) => (
                        <motion.button
                          key={speedOption.value}
                          onClick={() => setSpeed(speedOption.value)}
                          className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 ${
                            speed === speedOption.value
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {speedOption.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frame Thumbnails */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {language === 'fr' ? 'Aperçu des étapes' : 'Step Overview'}
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {frames.map((frame, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setCurrentFrame(index)}
                        className={`relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentFrame
                            ? 'border-purple-500 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={frame.image_base64}
                          alt={`Step ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === currentFrame && (
                          <motion.div
                            layoutId="frame-indicator"
                            className="absolute inset-0 bg-purple-500/20"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {frames.length === 0 && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'fr' 
                    ? 'Aucune animation disponible' 
                    : 'No animation available'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {language === 'fr' 
                    ? 'Assurez-vous d\'avoir eu une conversation avec Stella récemment.'
                    : 'Make sure you\'ve had a recent conversation with Stella.'
                  }
                </p>
                <motion.button
                  onClick={loadFrames}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {language === 'fr' ? 'Réessayer' : 'Try Again'}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
