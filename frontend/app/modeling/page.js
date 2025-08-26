"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import PlotlyChart from "@/components/modeling/PlotlyChart";
import ShapExplainer from "@/components/modeling/ShapExplainer";
import ConfidenceAnalyzer from "@/components/modeling/ConfidenceAnalyzer";
import { Brain, Play, RefreshCw, TrendingUp, Target, TreePine, Layers, Users, Settings, ChevronDown } from "lucide-react";

function ModelingPageContent() {
  const { language } = useLanguage();

  // Hyperparameters state
  const [hyperparams, setHyperparams] = useState({
    n_estimators: 134,
    max_depth: 10,
    min_samples_leaf: 1,
    max_features: 'log2',
    criterion: 'entropy'
  });

  // Model state
  const [isTraining, setIsTraining] = useState(false);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [modelResults, setModelResults] = useState(null);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Confidence analysis state - shared between ConfidenceAnalyzer and ShapExplainer
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  // Optimal parameters
  const OPTIMAL_PARAMS = {
    n_estimators: 134,
    max_depth: 10,
    min_samples_leaf: 1,
    max_features: 'log2',
    criterion: 'entropy'
  };

  const resetToOptimal = () => {
    setHyperparams(OPTIMAL_PARAMS);
    setShowResults(false);
    setTimeout(() => {
      setIsModelTrained(false);
      setModelResults(null);
      setError(null);
    }, 500);
  };

  const trainModel = useCallback(async () => {
    setIsTraining(true);
    setError(null);

    try {
      const response = await fetch('/api/modeling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hyperparameters: hyperparams,
          action: 'train'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Training failed');
      }

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }

      const transformedResults = {
        accuracy: result.data.accuracy,
        classification_report: result.data.classification_report,
        confusion_matrix: result.data.confusion_matrix,
        feature_importances: result.data.feature_importances || [],
        predictions: result.data.predictions || [],
        probabilities: result.data.probabilities || [],
        test_indices: result.data.test_indices || [],
        true_labels: result.data.true_labels || [], // Include real ground truth labels
        error_cases_by_threshold: result.data.error_cases_by_threshold || {}, // Pre-computed error cases
        confidence_analysis_by_threshold: result.data.confidence_analysis_by_threshold || {}, // Pre-computed confidence analysis
        hyperparameters: hyperparams // Include hyperparameters for SHAP analysis
      };

      setModelResults(transformedResults);
      setIsModelTrained(true);
      // Reduced delay to show results with animation after training completes
      setTimeout(() => {
        setShowResults(true);
      }, 150);

    } catch (err) {
      console.error('Training error:', err);
      setError(err?.message || 'Une erreur est survenue');
    } finally {
      setIsTraining(false);
    }
  }, [hyperparams]);



  // Memoized confusion matrix data for Plotly
  const confusionMatrixData = useMemo(() => {
    if (!modelResults?.confusion_matrix) return null;

    const cm = modelResults.confusion_matrix;
    const stellaColorScale = [
      [0, '#B197FC'],  // lilac with enough depth for white
      [0.2, '#9D6CFA'], // soft purple
      [0.4, '#864CFA'], // medium purple
      [0.6, '#7137EB'], // strong purple
      [0.8, '#5B26D4'], // dark violet
      [1, '#3C1375']    // near violet-black
    ];

    const total = cm.flat().reduce((sum, val) => sum + val, 0);
    const percentages = cm.map(row =>
      row.map(val => ((val / total) * 100).toFixed(1))
    );

    // scikit-learn confusion_matrix returns rows/cols ordered by labels [0, 1]
    // so show axis tick labels in the same order to avoid inversion
    return [{
      z: cm,
      x: [
        language === 'fr' ? 'Classe 0' : 'Class 0 (Under-perf.)',
        language === 'fr' ? 'Classe 1' : 'Class 1 (Out-perf.)'
      ],
      y: [
        language === 'fr' ? 'Classe 0' : 'Class 0 (Under-perf.)',
        language === 'fr' ? 'Classe 1' : 'Class 1 (Out-perf.)'
      ],
      type: 'heatmap',
      colorscale: stellaColorScale,
      showscale: true,
      text: cm.map((row, i) =>
        row.map((val, j) => `${val}<br>(${percentages[i][j]}%)`)
      ),
      texttemplate: "%{text}",
      textfont: { size: 14, color: 'white' },
      hovertemplate:
        '<b>' + (language === 'fr' ? 'Réel' : 'Actual') + ':</b> %{y}<br>' +
        '<b>' + (language === 'fr' ? 'Prédit' : 'Predicted') + ':</b> %{x}<br>' +
        '<b>' + (language === 'fr' ? 'Nombre' : 'Count') + ':</b> %{z}<br>' +
        '<extra></extra>'
    }];
  }, [modelResults?.confusion_matrix, language]);

  // Memorized feature importance data for Plotly
  const featureImportanceData = useMemo(() => {
    if (!modelResults?.feature_importances) return null;

    const features = modelResults.feature_importances.slice(0, 15);
    const colors = features.map((_, index) => {
      const intensity = 0.3 + (0.7 * (features.length - index) / features.length);
      return `rgba(147, 51, 234, ${intensity})`;
    });

    return [{
      x: features.map(f => f.display_name || f.feature),
      y: features.map(f => f.importance),
      type: 'bar',
      orientation: 'v',
      marker: { color: colors },
      text: features.map(f => (f.importance * 100).toFixed(2) + '%'),
      textposition: 'auto',
      textfont: { color: 'white', size: 11 },
      hovertemplate:
        '<b>%{y}</b><br>' +
        (language === 'fr' ? 'Importance' : 'Importance') + ': %{x:.4f}<br>' +
        '<extra></extra>'
    }];
  }, [modelResults?.feature_importances, language]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <ThreadsBackground
          color={[0.6706, 0.2784, 0.7373]}
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>

      <ChatNavbar />

      <div className="relative z-20 h-screen flex flex-col pt-4">
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">

            {/* Header compact */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {language === 'fr' ? 'Modélisation ML' : 'ML Modeling'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {language === 'fr' ? 'Détection de risque par Random Forest' : 'Risk detection with Random Forest'}
                  </p>
                </div>
              </div>

              {/* Controls compacts */}
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={resetToOptimal}
                  className="px-4 py-2 bg-gray-100 w-36 h-10 text-gray-700 rounded-lg text-sm font-medium"
                  whileHover={{ backgroundColor: "#f3f4f6" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  {language === 'fr' ? 'Reset' : 'Reset'}
                </motion.button>
                <motion.button
                  onClick={trainModel}
                  disabled={isTraining}
                  className="px-6 py-2 w-36 h-10 bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 text-white rounded-lg font-medium"
                  whileHover={!isTraining ? { 
                    background: "linear-gradient(to right, #7c3aed, #be185d)",
                    scale: 1.02
                  } : {}}
                  whileTap={!isTraining ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {isTraining ? (
                    <>
                      <motion.div 
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      {language === 'fr' ? 'Entraînement...' : 'Training...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-2" />
                      {language === 'fr' ? 'Entraîner' : 'Train'}
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!isModelTrained ? (
                // Configuration étendue et améliorée
                <motion.div 
                  key="configuration"
                  className="grid grid-cols-1 gap-8"
                  initial={{ x: 0, opacity: 1 }}
                  animate={{ x: isTraining ? "-100%" : 0, opacity: isTraining ? 0 : 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                <div className="bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 rounded-2xl p-8">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {language === 'fr' ? 'Hyperparamètres du Random Forest' : 'Random Forest Hyperparameters'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {language === 'fr' ? 'Ajustez les paramètres pour optimiser les performances du modèle' : 'Adjust parameters to optimize model performance'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {/* Number of Estimators */}
                    <motion.div 
                      className="bg-white/5 border border-white/10 rounded-xl p-6"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <TreePine className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">
                            {language === 'fr' ? 'Nombre d\'arbres' : 'Number of Trees'}
                          </label>
                          <p className="text-xs text-gray-600">
                            {language === 'fr' ? 'Plus d\'arbres = plus stable' : 'More trees = more stable'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="10"
                          max="500"
                          step="10"
                          value={hyperparams.n_estimators}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, n_estimators: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((hyperparams.n_estimators - 10) / (500 - 10)) * 100}%, #e5e7eb ${((hyperparams.n_estimators - 10) / (500 - 10)) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>10</span>
                          <div className="bg-emerald-500/20 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                            {hyperparams.n_estimators}
                          </div>
                          <span>500</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Max Depth */}
                    <motion.div 
                      className="bg-white/5 border border-white/10 rounded-xl p-6"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">
                            {language === 'fr' ? 'Profondeur Max' : 'Max Depth'}
                          </label>
                          <p className="text-xs text-gray-600">
                            {language === 'fr' ? 'Contrôle la complexité' : 'Controls complexity'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="3"
                          max="30"
                          value={hyperparams.max_depth}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, max_depth: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((hyperparams.max_depth - 3) / (30 - 3)) * 100}%, #e5e7eb ${((hyperparams.max_depth - 3) / (30 - 3)) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>3</span>
                          <div className="bg-blue-500/20 text-blue-700 px-3 py-1 rounded-full font-semibold">
                            {hyperparams.max_depth}
                          </div>
                          <span>30</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Min Samples Leaf */}
                    <motion.div 
                      className="bg-white/5 border border-white/10 rounded-xl p-6"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">
                            {language === 'fr' ? 'Échantillons Min' : 'Min Samples'}
                          </label>
                          <p className="text-xs text-gray-600">
                            {language === 'fr' ? 'Évite le surapprentissage' : 'Prevents overfitting'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={hyperparams.min_samples_leaf}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, min_samples_leaf: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #f97316 0%, #f97316 ${((hyperparams.min_samples_leaf - 1) / (20 - 1)) * 100}%, #e5e7eb ${((hyperparams.min_samples_leaf - 1) / (20 - 1)) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>1</span>
                          <div className="bg-orange-500/20 text-orange-700 px-3 py-1 rounded-full font-semibold">
                            {hyperparams.min_samples_leaf}
                          </div>
                          <span>20</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Max Features - Custom Select */}
                    <motion.div 
                      className="bg-white/5 border border-white/10 rounded-xl p-6"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">
                            {language === 'fr' ? 'Features Max' : 'Max Features'}
                          </label>
                          <p className="text-xs text-gray-600">
                            {language === 'fr' ? 'Diversité des arbres' : 'Tree diversity'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <motion.select
                          value={hyperparams.max_features}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, max_features: e.target.value }))}
                          className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <option value="sqrt" className="bg-white text-gray-800">
                            sqrt {language === 'fr' ? '(Racine carrée)' : '(Square root)'}
                          </option>
                          <option value="log2" className="bg-white text-gray-800">
                            log2 {language === 'fr' ? '(Logarithme base 2)' : '(Logarithm base 2)'}
                          </option>
                        </motion.select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                      
                      <div className="mt-3">
                        <div className="bg-purple-500/20 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold text-center">
                          {hyperparams.max_features}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Model Info Section */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">
                          {language === 'fr' ? 'Configuration Actuelle' : 'Current Configuration'}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="bg-emerald-500/20 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <TreePine className="w-3 h-3" />
                            <span>{hyperparams.n_estimators} {language === 'fr' ? 'arbres' : 'trees'}</span>
                          </div>
                          <div className="bg-blue-500/20 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <Layers className="w-3 h-3" />
                            <span>{language === 'fr' ? 'prof.' : 'depth'} {hyperparams.max_depth}</span>
                          </div>
                          <div className="bg-orange-500/20 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{hyperparams.min_samples_leaf} {language === 'fr' ? 'min' : 'min'}</span>
                          </div>
                          <div className="bg-purple-500/20 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <Settings className="w-3 h-3" />
                            <span>{hyperparams.max_features}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Dashboard des résultats
              <div className="space-y-6">
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  initial={{ x: "100%", opacity: 0 }}
                  animate={showResults ? { x: 0, opacity: 1 } : { x: "100%", opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                {/* Métriques principales */}
                <motion.div 
                  className="flex flex-col gap-3"
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={showResults ? { x: 0, opacity: 1 } : { x: "-100%", opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                >
                  <div className="bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {language === 'fr' ? 'Performance' : 'Performance'}
                      </h3>
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">
                            {language === 'fr' ? 'Précision' : 'Accuracy'}
                          </span>
                          <span className="text-2xl font-bold text-purple-600">
                            {modelResults ? (modelResults.accuracy * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${modelResults ? modelResults.accuracy * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          />
                        </div>
                      </div>

                      {modelResults?.classification_report && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-800">
                              {(modelResults.classification_report['0']?.precision * 100 || 0).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">
                              {language === 'fr' ? 'Précision Classe 0' : 'Class 0 Precision'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-800">
                              {(modelResults.classification_report['1']?.precision * 100 || 0).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">
                              {language === 'fr' ? 'Précision Classe 1' : 'Class 1 Precision'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matrice de confusion */}
                  <div className="bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {language === 'fr' ? 'Matrice de Confusion' : 'Confusion Matrix'}
                      </h3>
                      <Target className="w-5 h-5 text-purple-500" />
                    </div>

                    {confusionMatrixData && (
                      <div className="h-64">
                        <PlotlyChart
                          data={confusionMatrixData}
                          layout={{
                            margin: { l: 60, r: 20, t: 20, b: 60 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            font: { color: '#374151', size: 12 },
                            xaxis: { title: language === 'fr' ? 'Prédit' : 'Predicted' },
                            yaxis: { title: language === 'fr' ? 'Réel' : 'Actual', autorange: 'reversed' }
                          }}
                          config={{ displayModeBar: false }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
                {/* Graphique d'importance complet */}
                <motion.div 
                  className="bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 rounded-xl p-6 flex flex-col"
                  initial={{ x: "100%", opacity: 0 }}
                  animate={showResults ? { x: 0, opacity: 1 } : { x: "100%", opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {language === 'fr' ? 'Importance des Caractéristiques' : 'Feature Importance'}
                  </h3>
                  
                  {featureImportanceData && (
                    <div className="flex-1 min-h-0"> {/* flex-1 takes remaining space, min-h-0 allows shrinking */}
                      <PlotlyChart
                        data={featureImportanceData}
                        layout={{
                          margin: { l: 40, r: 20, t: 20, b: 80 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#374151', size: 12 },
                          height: null, // Let Plotly use container height
                          autosize: true, // Enable autosizing
                          xaxis: { 
                            title: language === 'fr' ? 'Caractéristiques' : 'Features',
                            tickangle: -45,
                            automargin: true 
                          },
                          yaxis: { 
                            title: language === 'fr' ? 'Importance' : 'Importance' 
                          }
                        }}
                        config={{ 
                          displayModeBar: false,
                          responsive: true // Ensure responsiveness is enabled
                        }}
                        className="w-full h-full" // Make sure PlotlyChart uses full container size
                      />
                    </div>
                  )}
                </motion.div>
                </motion.div>

                {/* Confidence Analysis Section */}
                <motion.div 
                  className="w-full"
                  initial={{ y: 32, opacity: 0 }}
                  animate={showResults ? { y: 0, opacity: 1 } : { y: 32, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                >
                  <ConfidenceAnalyzer 
                    modelResults={modelResults} 
                    language={language}
                    onConfidenceThresholdChange={setConfidenceThreshold}
                  />
                </motion.div>

                {/* SHAP Analysis Section */}
                <motion.div 
                  className="w-full"
                  initial={{ y: 32, opacity: 0 }}
                  animate={showResults ? { y: 0, opacity: 1 } : { y: 32, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                >
                  <ShapExplainer 
                    modelResults={modelResults} 
                    language={language}
                    confidenceThreshold={confidenceThreshold}
                  />
                </motion.div>
              </div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelingPage() {
  return <ModelingPageContent />;
}