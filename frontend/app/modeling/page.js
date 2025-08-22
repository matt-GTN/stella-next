"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import PlotlyChart from "@/components/modeling/PlotlyChart";
import Slider from "@/components/modeling/Slider";
import { Brain, BarChart3, Settings, Zap, RefreshCw, Play } from "lucide-react";

export default function ModelingPage() {
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

  // Optimal parameters for reset
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

  const trainModel = async () => {
    setIsTraining(true);
    setError(null);
    
    try {
      // Simulation d'entraînement - dans l'implémentation réelle, cela ferait appel au backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results - dans l'implémentation réelle, ces données viendraient du backend
      const mockResults = {
        accuracy: 0.73,
        classification_report: {
          'Classe 0 (Sous-perf.)': { precision: 0.81, recall: 0.76, 'f1-score': 0.78 },
          'Classe 1 (Sur-perf.)': { precision: 0.65, recall: 0.70, 'f1-score': 0.67 },
          accuracy: 0.73
        },
        confusion_matrix: [[45, 12], [18, 25]], // [TN, FP], [FN, TP]
        feature_importances: [
          { feature: 'revenuePerShare_YoY_Growth', importance: 0.18 },
          { feature: 'roic', importance: 0.14 },
          { feature: 'debtToEquity', importance: 0.12 },
          { feature: 'marginProfit', importance: 0.11 },
          { feature: 'roe', importance: 0.10 },
          { feature: 'marketCap', importance: 0.09 },
          { feature: 'revenuePerShare', importance: 0.08 },
          { feature: 'earningsYield', importance: 0.07 },
          { feature: 'calendarYear', importance: 0.06 },
          { feature: 'autres', importance: 0.05 }
        ].slice(0, 8) // Top 8 features
      };
      
      setModelResults(mockResults);
      setIsModelTrained(true);
    } catch (err) {
      setError(language === 'fr' 
        ? "Erreur lors de l'entraînement du modèle. Veuillez réessayer."
        : "Error training the model. Please try again."
      );
    } finally {
      setIsTraining(false);
    }
  };

  // Prepare confusion matrix data for Plotly
  const getConfusionMatrixData = () => {
    if (!modelResults?.confusion_matrix) return null;
    
    const cm = modelResults.confusion_matrix;
    return [{
      z: cm,
      x: ['Classe 1 (Sur-perf.)', 'Classe 0 (Sous-perf.)'],
      y: ['Classe 1 (Sur-perf.)', 'Classe 0 (Sous-perf.)'],
      type: 'heatmap',
      colorscale: 'Blues',
      showscale: true,
      text: cm.map(row => row.map(val => val.toString())),
      texttemplate: "%{text}",
      textfont: { size: 16, color: 'white' }
    }];
  };

  // Prepare feature importance data for Plotly
  const getFeatureImportanceData = () => {
    if (!modelResults?.feature_importances) return null;
    
    const features = modelResults.feature_importances;
    return [{
      x: features.map(f => f.importance),
      y: features.map(f => f.feature),
      type: 'bar',
      orientation: 'h',
      marker: { color: 'rgba(59, 130, 246, 0.8)' },
      text: features.map(f => (f.importance * 100).toFixed(1) + '%'),
      textposition: 'inside',
      textfont: { color: 'white' }
    }];
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
      <div className="relative z-20 h-screen flex flex-col pt-24">
        <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mr-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {language === 'fr' ? 'Modélisation ML' : 'ML Modeling'}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {language === 'fr' ? 'Exploration interactive des modèles' : 'Interactive model exploration'}
                  </p>
                </div>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6">
                  <p className="text-gray-700 leading-relaxed">
                    {language === 'fr' 
                      ? "Explorez l'impact des hyperparamètres du Random Forest Classifier sur les performances. De la prédiction générale au filtrage de risque de haute précision."
                      : "Explore the impact of Random Forest Classifier hyperparameters on performance. From general prediction to high-precision risk filtering."
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {!isModelTrained ? (
                // Configuration Panel
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Controls */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Hyperparameters */}
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <Settings className="w-6 h-6 text-blue-600" />
                          <h2 className="text-xl font-semibold text-gray-800">
                            {language === 'fr' ? 'Hyperparamètres' : 'Hyperparameters'}
                          </h2>
                        </div>
                        <button
                          onClick={resetToOptimal}
                          className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/20 text-gray-700 rounded-xl font-medium transition-all duration-200"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{language === 'fr' ? 'Réinitialiser' : 'Reset'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Forest Structure */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                            {language === 'fr' ? 'Structure de la Forêt' : 'Forest Structure'}
                          </h3>
                          
                          <Slider
                            label={language === 'fr' ? "Nombre d'arbres" : "Number of trees"}
                            value={hyperparams.n_estimators}
                            min={10}
                            max={500}
                            step={10}
                            onChange={(value) => setHyperparams(prev => ({ ...prev, n_estimators: value }))}
                            help={language === 'fr' 
                              ? "Plus d'arbres réduit le surapprentissage"
                              : "More trees reduce overfitting"
                            }
                          />
                          
                          <Slider
                            label={language === 'fr' ? "Profondeur maximale" : "Maximum depth"}
                            value={hyperparams.max_depth}
                            min={3}
                            max={30}
                            onChange={(value) => setHyperparams(prev => ({ ...prev, max_depth: value }))}
                            help={language === 'fr' 
                              ? "Contrôle la complexité de chaque arbre"
                              : "Controls the complexity of each tree"
                            }
                          />
                        </div>

                        {/* Splitting Conditions */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                            {language === 'fr' ? 'Conditions de Division' : 'Splitting Conditions'}
                          </h3>
                          
                          <Slider
                            label={language === 'fr' ? "Échantillons min. par feuille" : "Min. samples per leaf"}
                            value={hyperparams.min_samples_leaf}
                            min={1}
                            max={20}
                            onChange={(value) => setHyperparams(prev => ({ ...prev, min_samples_leaf: value }))}
                            help={language === 'fr' 
                              ? "Nombre minimum d'échantillons par feuille"
                              : "Minimum number of samples per leaf"
                            }
                          />

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {language === 'fr' ? 'Caractéristiques max.' : 'Max. features'}
                            </label>
                            <select 
                              value={hyperparams.max_features}
                              onChange={(e) => setHyperparams(prev => ({ ...prev, max_features: e.target.value }))}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="sqrt">sqrt</option>
                              <option value="log2">log2</option>
                              <option value={null}>None</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {language === 'fr' ? 'Critère de division' : 'Splitting criterion'}
                            </label>
                            <select 
                              value={hyperparams.criterion}
                              onChange={(e) => setHyperparams(prev => ({ ...prev, criterion: e.target.value }))}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="gini">Gini</option>
                              <option value="entropy">Entropy</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Train Button */}
                    <div className="text-center">
                      <button
                        onClick={trainModel}
                        disabled={isTraining}
                        className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                          isTraining
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transform hover:scale-105 shadow-lg'
                        }`}
                      >
                        {isTraining ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>{language === 'fr' ? 'Entraînement...' : 'Training...'}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            <span>{language === 'fr' ? 'Entraîner le Modèle' : 'Train Model'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Info Panel */}
                  <div className="space-y-6">
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {language === 'fr' ? 'Random Forest' : 'Random Forest'}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {language === 'fr' 
                          ? "Un ensemble d'arbres de décision entraînés sur différents sous-ensembles de données et de caractéristiques."
                          : "An ensemble of decision trees trained on different subsets of data and features."
                        }
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{language === 'fr' ? 'Arbres' : 'Trees'}</span>
                          <span className="font-mono text-blue-600">{hyperparams.n_estimators}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{language === 'fr' ? 'Profondeur' : 'Depth'}</span>
                          <span className="font-mono text-blue-600">{hyperparams.max_depth}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{language === 'fr' ? 'Min. feuille' : 'Min. leaf'}</span>
                          <span className="font-mono text-blue-600">{hyperparams.min_samples_leaf}</span>
                        </div>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="backdrop-blur-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Results Display
                <div className="space-y-8">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {(modelResults.accuracy * 100).toFixed(1)}%
                      </h3>
                      <p className="text-gray-600">
                        {language === 'fr' ? 'Précision globale' : 'Overall accuracy'}
                      </p>
                    </div>
                    
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        {language === 'fr' ? 'Classe 0 (Sous-perf.)' : 'Class 0 (Under-perf.)'}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Précision:</span>
                          <span className="font-mono text-blue-600">81%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rappel:</span>
                          <span className="font-mono text-blue-600">76%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        {language === 'fr' ? 'Classe 1 (Sur-perf.)' : 'Class 1 (Out-perf.)'}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Précision:</span>
                          <span className="font-mono text-purple-600">65%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rappel:</span>
                          <span className="font-mono text-purple-600">70%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Confusion Matrix */}
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        {language === 'fr' ? 'Matrice de Confusion' : 'Confusion Matrix'}
                      </h3>
                      <PlotlyChart
                        data={getConfusionMatrixData()}
                        layout={{
                          title: '',
                          xaxis: { title: language === 'fr' ? 'Prédite' : 'Predicted' },
                          yaxis: { title: language === 'fr' ? 'Réelle' : 'Actual', autorange: 'reversed' },
                          height: 300
                        }}
                        className="w-full h-80"
                      />
                    </div>

                    {/* Feature Importance */}
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        {language === 'fr' ? 'Importance des Variables' : 'Feature Importance'}
                      </h3>
                      <PlotlyChart
                        data={getFeatureImportanceData()}
                        layout={{
                          title: '',
                          xaxis: { title: language === 'fr' ? 'Importance' : 'Importance' },
                          yaxis: { title: '' },
                          margin: { l: 150, r: 50, t: 20, b: 50 },
                          height: 300
                        }}
                        className="w-full h-80"
                      />
                    </div>
                  </div>

                  {/* Strategy Insight */}
                  <div className="backdrop-blur-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-3xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                      {language === 'fr' ? 'Filtrage par la Confiance' : 'Confidence-Based Filtering'}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {language === 'fr' 
                        ? "Notre stratégie : transformer un modèle de prédiction générale en filtre de risque de haute précision. En ne conservant que les prédictions à haute confiance, nous obtenons une précision drastiquement améliorée pour identifier les actions à risque."
                        : "Our strategy: transform a general prediction model into a high-precision risk filter. By keeping only high-confidence predictions, we achieve drastically improved accuracy for identifying risky stocks."
                      }
                    </p>
                  </div>

                  {/* Reset Button */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setIsModelTrained(false);
                        setModelResults(null);
                      }}
                      className="inline-flex items-center space-x-3 px-6 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-gray-700 rounded-xl font-medium transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Nouvel entraînement' : 'New training'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
