"use client";

import { useState, useMemo, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import PlotlyChart from "@/components/modeling/PlotlyChart";
import ShapExplainer from "@/components/modeling/ShapExplainer";
import ConfidenceAnalyzer from "@/components/modeling/ConfidenceAnalyzer";
import { Brain, Play, RefreshCw, TrendingUp, Target } from "lucide-react";

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
    setIsModelTrained(false);
    setModelResults(null);
    setError(null);
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
        hyperparameters: hyperparams // Include hyperparameters for SHAP analysis
      };

      setModelResults(transformedResults);
      setIsModelTrained(true);

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
      [0, 'rgba(255, 255, 255, 0.1)'],
      [0.2, 'rgba(147, 51, 234, 0.3)'],
      [0.4, 'rgba(147, 51, 234, 0.5)'],
      [0.6, 'rgba(147, 51, 234, 0.7)'],
      [0.8, 'rgba(147, 51, 234, 0.9)'],
      [1, 'rgba(147, 51, 234, 1)']
    ];

    const total = cm.flat().reduce((sum, val) => sum + val, 0);
    const percentages = cm.map(row =>
      row.map(val => ((val / total) * 100).toFixed(1))
    );

    return [{
      z: cm,
      x: [
        language === 'fr' ? 'Classe 1 (Sur-perf.)' : 'Class 1 (Out-perf.)',
        language === 'fr' ? 'Classe 0 (Sous-perf.)' : 'Class 0 (Under-perf.)'
      ],
      y: [
        language === 'fr' ? 'Classe 1 (Sur-perf.)' : 'Class 1 (Out-perf.)',
        language === 'fr' ? 'Classe 0 (Sous-perf.)' : 'Class 0 (Under-perf.)'
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

  // Memoized feature importance data for Plotly
  const featureImportanceData = useMemo(() => {
    if (!modelResults?.feature_importances) return null;

    const features = modelResults.feature_importances.slice(0, 15);
    const colors = features.map((_, index) => {
      const intensity = 0.3 + (0.7 * (features.length - index) / features.length);
      return `rgba(147, 51, 234, ${intensity})`;
    });

    return [{
      x: features.map(f => f.importance),
      y: features.map(f => f.display_name || f.feature),
      type: 'bar',
      orientation: 'h',
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
          color={[0, 0, 0]}
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>

      <ChatNavbar />

      <div className="relative z-20 h-screen flex flex-col pt-24">
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
                <button
                  onClick={resetToOptimal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  {language === 'fr' ? 'Optimal' : 'Reset'}
                </button>
                <button
                  onClick={trainModel}
                  disabled={isTraining}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
                >
                  {isTraining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2" />
                      {language === 'fr' ? 'Entraînement...' : 'Training...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-2" />
                      {language === 'fr' ? 'Entraîner' : 'Train'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {!isModelTrained ? (
              // Configuration compacte
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-4">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {language === 'fr' ? 'Hyperparamètres' : 'Hyperparameters'}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'fr' ? 'Arbres' : 'Trees'}
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="500"
                          step="10"
                          value={hyperparams.n_estimators}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, n_estimators: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-600 mt-1">{hyperparams.n_estimators}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'fr' ? 'Profondeur' : 'Depth'}
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="30"
                          value={hyperparams.max_depth}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, max_depth: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-600 mt-1">{hyperparams.max_depth}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'fr' ? 'Min. échantillons' : 'Min. samples'}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={hyperparams.min_samples_leaf}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, min_samples_leaf: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-600 mt-1">{hyperparams.min_samples_leaf}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'fr' ? 'Features max.' : 'Max. features'}
                        </label>
                        <select
                          value={hyperparams.max_features}
                          onChange={(e) => setHyperparams(prev => ({ ...prev, max_features: e.target.value }))}
                          className="w-full p-2 bg-white/10 border border-white/20 rounded text-sm"
                        >
                          <option value="sqrt">sqrt</option>
                          <option value="log2">log2</option>
                          <option value={null}>None</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Dashboard des résultats
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Métriques principales */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
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
                          {(modelResults.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${modelResults.accuracy * 100}%` }}
                        />
                      </div>
                    </div>

                    {modelResults.classification_report && (
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
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
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
                          plot_bgcolor: 'rgba(1,0,0,0)',
                          font: { color: '#374151', size: 12 },
                          xaxis: { title: language === 'fr' ? 'Prédit' : 'Predicted' },
                          yaxis: { title: language === 'fr' ? 'Réel' : 'Actual' }
                        }}
                        config={{ displayModeBar: false }}
                      />
                    </div>
                  )}
                </div>



                {/* Graphique d'importance complet */}
                <div className="lg:col-span-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {language === 'fr' ? 'Importance des Caractéristiques' : 'Feature Importance'}
                  </h3>

                  {featureImportanceData && (
                    <div className="h-80">
                      <PlotlyChart
                        data={featureImportanceData}
                        layout={{
                          margin: { l: 200, r: 20, t: 20, b: 40 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#374151', size: 12 },
                          xaxis: { title: language === 'fr' ? 'Importance' : 'Importance' },
                          yaxis: { automargin: true }
                        }}
                        config={{ displayModeBar: false }}
                      />
                    </div>
                  )}
                </div>

                {/* Confidence Analysis Section */}
                <div className="lg:col-span-3">
                  <ConfidenceAnalyzer modelResults={modelResults} language={language} />
                </div>

                {/* SHAP Analysis Section */}
                <div className="lg:col-span-3">
                  <ShapExplainer modelResults={modelResults} language={language} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelingPage() {
  return <ModelingPageContent />;
}