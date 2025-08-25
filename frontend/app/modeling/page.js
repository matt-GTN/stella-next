"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ThreadsBackground from "@/components/backgrounds/ThreadsBackground";
import PlotlyChart from "@/components/modeling/PlotlyChart";
import Slider from "@/components/modeling/Slider";
import ModelMetrics from "@/components/modeling/ModelMetrics";
import { Brain, BarChart3, Settings, Zap, RefreshCw, Play, TrendingUp, AlertTriangle } from "lucide-react";
import ModelingErrorBoundary from "@/components/modeling/ModelingErrorBoundary";

// Lazy load heavy components for better performance
const ConfidenceAnalyzer = lazy(() => import("@/components/modeling/ConfidenceAnalyzer"));
const ShapExplainer = lazy(() => import("@/components/modeling/ShapExplainer"));

function ModelingPageContent() {
  const { language, t } = useLanguage();

  // Number formatting utilities
  const formatPercent = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return language === 'fr'
      ? `${(value * 100).toFixed(1).replace('.', ',')}%`
      : `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return language === 'fr'
      ? value.toLocaleString('fr-FR')
      : value.toLocaleString('en-US');
  };

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
  const [trainingProgress, setTrainingProgress] = useState('');

  // Enhanced error handling state
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [backendHealth, setBackendHealth] = useState('unknown');

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
    setLastError(null);
    setTrainingProgress('');
    setRetryCount(0);
  };

  // Enhanced error handling utilities
  const checkNetworkStatus = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/modeling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health-check' }),
        signal: AbortSignal.timeout(5000)
      });
      setBackendHealth(response.ok ? 'healthy' : 'unhealthy');
      return response.ok;
    } catch (err) {
      setBackendHealth('unreachable');
      return false;
    }
  };

  const getErrorType = (error) => {
    if (!error) return 'unknown';
    if (error.name === 'AbortError') return 'timeout';
    if (error.message && (error.message.includes('fetch') || error.message.includes('NetworkError'))) return 'network';
    if (error.message && (error.message.includes('500') || error.message.includes('Internal'))) return 'server';
    if (error.message && (error.message.includes('400') || error.message.includes('validation'))) return 'validation';
    return 'unknown';
  };

  const getErrorMessage = (error, errorType) => {
    const messages = {
      timeout: {
        fr: "L'entraînement a pris trop de temps. Essayez avec moins d'arbres ou vérifiez votre connexion.",
        en: "Training took too long. Try with fewer trees or check your connection."
      },
      network: {
        fr: "Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le backend est démarré.",
        en: "Cannot connect to server. Please check your internet connection and that the backend is running."
      },
      server: {
        fr: "Erreur interne du serveur. Le backend rencontre des difficultés techniques.",
        en: "Internal server error. The backend is experiencing technical difficulties."
      },
      validation: {
        fr: "Paramètres invalides. Vérifiez vos hyperparamètres et réessayez.",
        en: "Invalid parameters. Please check your hyperparameters and try again."
      },
      unknown: {
        fr: `Erreur inattendue: ${error?.message || 'Erreur inconnue'}`,
        en: `Unexpected error: ${error?.message || 'Unknown error'}`
      }
    };

    return messages[errorType]?.[language] || messages.unknown[language];
  };

  const shouldRetry = (errorType, currentRetryCount) => {
    const maxRetries = { timeout: 2, network: 3, server: 2, validation: 0, unknown: 1 };
    return currentRetryCount < (maxRetries[errorType] || 0);
  };

  const trainModel = useCallback(async (isRetry = false) => {
    // Pre-flight checks
    checkNetworkStatus();
    if (networkStatus === 'offline') {
      setError(language === 'fr'
        ? "Pas de connexion internet. Vérifiez votre connexion et réessayez."
        : "No internet connection. Please check your connection and try again.");
      return;
    }

    setIsTraining(true);
    setError(null);
    setLastError(null);

    if (!isRetry) {
      setRetryCount(0);
    }

    setTrainingProgress(language === 'fr' ? 'Initialisation...' : 'Initializing...');

    try {
      // Check backend health first
      setTrainingProgress(language === 'fr' ? 'Vérification du serveur...' : 'Checking server...');
      const isBackendHealthy = await checkBackendHealth();

      if (!isBackendHealthy && backendHealth === 'unreachable') {
        throw new Error('Backend unreachable');
      }

      // Update progress
      setTrainingProgress(language === 'fr' ? 'Chargement des données...' : 'Loading data...');

      // Call the real API endpoint with progressive timeout based on retry count
      const timeoutDuration = 60000 + (retryCount * 30000); // Increase timeout on retries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      setTrainingProgress(language === 'fr' ? 'Entraînement du modèle...' : 'Training model...');

      const response = await fetch('/api/modeling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hyperparameters: hyperparams,
          action: 'train',
          retry_count: retryCount
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      setTrainingProgress(language === 'fr' ? 'Traitement des résultats...' : 'Processing results...');

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.details || result.error || 'Training failed');
        error.status = response.status;
        throw error;
      }

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }

      // Transform backend response to match frontend expectations
      const transformedResults = {
        accuracy: result.data.accuracy,
        classification_report: result.data.classification_report,
        confusion_matrix: result.data.confusion_matrix,
        feature_importances: result.data.feature_importances || [],
        predictions: result.data.predictions || [],
        probabilities: result.data.probabilities || [],
        test_indices: result.data.test_indices || []
      };

      setTrainingProgress(language === 'fr' ? 'Terminé!' : 'Complete!');
      setModelResults(transformedResults);
      setIsModelTrained(true);
      setRetryCount(0); // Reset retry count on success

    } catch (err) {
      console.error('Training error:', err);
      setLastError(err);

      const errorType = getErrorType(err);
      const errorMessage = getErrorMessage(err, errorType);

      setError(errorMessage);

      // Auto-retry for certain error types if retry count allows
      if (shouldRetry(errorType, retryCount) && !isRetry) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 10000); // Exponential backoff, max 10s
        setTrainingProgress(language === 'fr'
          ? `Nouvelle tentative dans ${Math.ceil(retryDelay / 1000)}s... (${newRetryCount}/${shouldRetry(errorType, 0) ? 3 : 1})`
          : `Retrying in ${Math.ceil(retryDelay / 1000)}s... (${newRetryCount}/${shouldRetry(errorType, 0) ? 3 : 1})`);

        setTimeout(() => {
          trainModel(true);
        }, retryDelay);
        return;
      }

    } finally {
      if (!shouldRetry(getErrorType(lastError || {}), retryCount)) {
        setIsTraining(false);
        setTrainingProgress('');
      }
    }
  }, [hyperparams, language, networkStatus, backendHealth, retryCount, lastError]);

  const retryTraining = () => {
    setRetryCount(0); // Reset retry count for manual retry
    trainModel(false);
  };

  const handleEmergencyFallback = () => {
    // Provide mock data as fallback for demonstration purposes
    const mockResults = {
      accuracy: 0.73,
      classification_report: {
        '0': { precision: 0.71, recall: 0.68, 'f1-score': 0.69, support: 45 },
        '1': { precision: 0.75, recall: 0.78, 'f1-score': 0.76, support: 55 }
      },
      confusion_matrix: [[31, 14], [12, 43]],
      feature_importances: [
        { feature: 'revenuePerShare_YoY_Growth', importance: 0.15, display_name: 'Revenue Growth YoY' },
        { feature: 'operatingMargin', importance: 0.12, display_name: 'Operating Margin' },
        { feature: 'returnOnEquity', importance: 0.10, display_name: 'Return on Equity' }
      ],
      predictions: Array(100).fill(0).map(() => Math.round(Math.random())),
      probabilities: Array(100).fill(0).map(() => [Math.random(), Math.random()]),
      test_indices: Array(100).fill(0).map((_, i) => `demo_${i}`)
    };

    setModelResults(mockResults);
    setIsModelTrained(true);
    setError(null);
    setLastError(null);
    setIsTraining(false);
    setTrainingProgress('');
  };

  // Memoized confusion matrix data for Plotly with Stella's color scheme
  const confusionMatrixData = useMemo(() => {
    if (!modelResults?.confusion_matrix) return null;

    const cm = modelResults.confusion_matrix;

    // Custom color scale matching Stella's purple gradient theme
    const stellaColorScale = [
      [0, 'rgba(255, 255, 255, 0.1)'],
      [0.2, 'rgba(147, 51, 234, 0.3)'],
      [0.4, 'rgba(147, 51, 234, 0.5)'],
      [0.6, 'rgba(147, 51, 234, 0.7)'],
      [0.8, 'rgba(147, 51, 234, 0.9)'],
      [1, 'rgba(147, 51, 234, 1)']
    ];

    // Calculate percentages for better understanding
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
      colorbar: {
        title: {
          text: language === 'fr' ? 'Nombre de<br>Prédictions' : 'Number of<br>Predictions',
          font: { size: 12, color: 'rgba(75, 85, 99, 1)' }
        },
        tickfont: { color: 'rgba(75, 85, 99, 1)' },
        bgcolor: 'rgba(255, 255, 255, 0.1)',
        bordercolor: 'rgba(255, 255, 255, 0.2)',
        borderwidth: 1
      },
      text: cm.map((row, i) =>
        row.map((val, j) => `${val}<br>(${percentages[i][j]}%)`)
      ),
      texttemplate: "%{text}",
      textfont: {
        size: 14,
        color: 'white',
        family: 'Arial, sans-serif'
      },
      hovertemplate:
        '<b>' + (language === 'fr' ? 'Réel' : 'Actual') + ':</b> %{y}<br>' +
        '<b>' + (language === 'fr' ? 'Prédit' : 'Predicted') + ':</b> %{x}<br>' +
        '<b>' + (language === 'fr' ? 'Nombre' : 'Count') + ':</b> %{z}<br>' +
        '<b>' + (language === 'fr' ? 'Pourcentage' : 'Percentage') + ':</b> %{text}<br>' +
        '<extra></extra>',
      hoverlabel: {
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        bordercolor: 'rgba(147, 51, 234, 1)',
        font: { color: 'white', size: 12 }
      }
    }];
  }, [modelResults?.confusion_matrix, language]);

  // Memoized feature importance data for Plotly with enhanced styling
  const featureImportanceData = useMemo(() => {
    if (!modelResults?.feature_importances) return null;

    const features = modelResults.feature_importances.slice(0, 15); // Top 15 features

    // Create gradient colors for bars based on importance
    const colors = features.map((f, index) => {
      const intensity = 0.3 + (0.7 * (features.length - index) / features.length);
      return `rgba(147, 51, 234, ${intensity})`;
    });

    // Create meaningful display names
    const getDisplayName = (feature) => {
      const displayNames = {
        'revenuePerShare_YoY_Growth': language === 'fr' ? 'Croissance Revenus/Action YoY' : 'Revenue/Share YoY Growth',
        'operatingMargin': language === 'fr' ? 'Marge Opérationnelle' : 'Operating Margin',
        'returnOnEquity': language === 'fr' ? 'Rendement des Capitaux Propres' : 'Return on Equity',
        'debtToEquity': language === 'fr' ? 'Ratio Dette/Capitaux' : 'Debt to Equity',
        'priceToBook': language === 'fr' ? 'Ratio Prix/Valeur Comptable' : 'Price to Book',
        'priceToEarnings': language === 'fr' ? 'Ratio Prix/Bénéfices' : 'Price to Earnings',
        'currentRatio': language === 'fr' ? 'Ratio de Liquidité' : 'Current Ratio',
        'quickRatio': language === 'fr' ? 'Ratio de Liquidité Immédiate' : 'Quick Ratio',
        'grossMargin': language === 'fr' ? 'Marge Brute' : 'Gross Margin',
        'netMargin': language === 'fr' ? 'Marge Nette' : 'Net Margin',
        'assetTurnover': language === 'fr' ? 'Rotation des Actifs' : 'Asset Turnover',
        'inventoryTurnover': language === 'fr' ? 'Rotation des Stocks' : 'Inventory Turnover',
        'receivablesTurnover': language === 'fr' ? 'Rotation des Créances' : 'Receivables Turnover',
        'payablesTurnover': language === 'fr' ? 'Rotation des Dettes' : 'Payables Turnover',
        'workingCapital': language === 'fr' ? 'Fonds de Roulement' : 'Working Capital'
      };

      return displayNames[feature] || feature.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    };

    return [{
      x: features.map(f => f.importance),
      y: features.map(f => getDisplayName(f.feature)),
      type: 'bar',
      orientation: 'h',
      marker: {
        color: colors,
        line: {
          color: 'rgba(147, 51, 234, 0.8)',
          width: 1
        }
      },
      text: features.map(f => (f.importance * 100).toFixed(2) + '%'),
      textposition: 'auto',
      textfont: {
        color: 'white',
        size: 11,
        family: 'Arial, sans-serif'
      },
      hovertemplate:
        '<b>%{y}</b><br>' +
        (language === 'fr' ? 'Importance' : 'Importance') + ': %{x:.4f}<br>' +
        (language === 'fr' ? 'Pourcentage' : 'Percentage') + ': %{text}<br>' +
        '<extra></extra>',
      hoverlabel: {
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        bordercolor: 'rgba(147, 51, 234, 1)',
        font: { color: 'white', size: 12 }
      }
    }];
  }, [modelResults?.feature_importances, language])

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
            <div className="text-center mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-4 md:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-0 sm:mr-4">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('content.modeling.title')}
                  </h1>
                  <p className="text-gray-600 mt-1 md:mt-2 text-sm sm:text-base">
                    {t('content.modeling.subtitle')}
                  </p>
                </div>
              </div>

              <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
                  <h2 className="text-lg md:text-2xl font-semibold text-gray-800 mb-3 md:mb-4">
                    {t('content.modeling.strategy.title')}
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-lg mb-4 md:mb-6">
                    {t('content.modeling.strategy.description')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
                    <div className="backdrop-blur-sm bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold text-blue-800 mb-2 md:mb-3">
                        🎯 {t('content.modeling.strategy.traditional.title')}
                      </h3>
                      <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                        {t('content.modeling.strategy.traditional.description')}
                      </p>
                    </div>

                    <div className="backdrop-blur-sm bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold text-purple-800 mb-2 md:mb-3">
                        🛡️ {t('content.modeling.strategy.riskFiltering.title')}
                      </h3>
                      <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                        {t('content.modeling.strategy.riskFiltering.description')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="backdrop-blur-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
                  <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <span className="text-white text-xs md:text-sm font-bold">💡</span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800">
                      {t('content.modeling.strategy.educational.title')}
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                    {t('content.modeling.strategy.educational.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              {!isModelTrained ? (
                // Configuration Panel
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                  {/* Controls */}
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">

                    {/* Hyperparameters */}
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 ease-out">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                              {language === 'fr' ? 'Configuration des Hyperparamètres' : 'Hyperparameter Configuration'}
                            </h2>
                            <p className="text-xs md:text-sm text-gray-600">
                              {language === 'fr' ? 'Ajustez les paramètres pour optimiser les performances' : 'Adjust parameters to optimize performance'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={resetToOptimal}
                          className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 focus:from-purple-500/30 focus:to-pink-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-purple-700 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                          title={language === 'fr' ? 'Restaurer les valeurs optimales recherchées' : 'Restore researched optimal values'}
                          aria-label={language === 'fr' ? 'Restaurer les valeurs optimales des hyperparamètres' : 'Reset hyperparameters to optimal values'}
                        >
                          <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">{language === 'fr' ? 'Valeurs Optimales' : 'Reset to Optimal'}</span>
                          <span className="sm:hidden">{language === 'fr' ? 'Optimal' : 'Reset'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {/* Forest Structure */}
                        <div className="space-y-4 md:space-y-6">
                          <div className="flex items-center space-x-2 mb-3 md:mb-4">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">🌳</span>
                            </div>
                            <h3 className="text-base md:text-lg font-semibold text-gray-800">
                              {language === 'fr' ? 'Structure de la Forêt' : 'Forest Structure'}
                            </h3>
                          </div>

                          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
                            <Slider
                              label={language === 'fr' ? "Nombre d'arbres (n_estimators)" : "Number of trees (n_estimators)"}
                              value={hyperparams.n_estimators}
                              min={10}
                              max={500}
                              step={10}
                              onChange={(value) => setHyperparams(prev => ({ ...prev, n_estimators: value }))}
                              help={language === 'fr'
                                ? "Plus d'arbres améliorent la stabilité mais augmentent le temps de calcul. Valeur optimale: 134"
                                : "More trees improve stability but increase computation time. Optimal value: 134"
                              }
                            />
                          </div>

                          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
                            <Slider
                              label={language === 'fr' ? "Profondeur maximale (max_depth)" : "Maximum depth (max_depth)"}
                              value={hyperparams.max_depth}
                              min={3}
                              max={30}
                              onChange={(value) => setHyperparams(prev => ({ ...prev, max_depth: value }))}
                              help={language === 'fr'
                                ? "Contrôle la complexité de chaque arbre. Trop élevé = surapprentissage. Valeur optimale: 10"
                                : "Controls the complexity of each tree. Too high = overfitting. Optimal value: 10"
                              }
                            />
                          </div>
                        </div>

                        {/* Splitting Conditions */}
                        <div className="space-y-4 md:space-y-6">
                          <div className="flex items-center space-x-2 mb-3 md:mb-4">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">⚡</span>
                            </div>
                            <h3 className="text-base md:text-lg font-semibold text-gray-800">
                              {language === 'fr' ? 'Conditions de Division' : 'Splitting Conditions'}
                            </h3>
                          </div>

                          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
                            <Slider
                              label={language === 'fr' ? "Échantillons min. par feuille (min_samples_leaf)" : "Min. samples per leaf (min_samples_leaf)"}
                              value={hyperparams.min_samples_leaf}
                              min={1}
                              max={20}
                              onChange={(value) => setHyperparams(prev => ({ ...prev, min_samples_leaf: value }))}
                              help={language === 'fr'
                                ? "Évite les divisions sur de petits échantillons. Plus élevé = moins de surapprentissage. Valeur optimale: 1"
                                : "Prevents splits on small samples. Higher = less overfitting. Optimal value: 1"
                              }
                            />
                          </div>

                          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">
                                  {language === 'fr' ? 'Caractéristiques max. (max_features)' : 'Max. features (max_features)'}
                                </label>
                                <div className="group relative">
                                  <span className="text-xs text-gray-500 cursor-help">ℹ️</span>
                                  <div className="absolute right-0 top-6 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    {language === 'fr'
                                      ? "Nombre de caractéristiques considérées pour chaque division. 'log2' est optimal pour ce dataset."
                                      : "Number of features considered for each split. 'log2' is optimal for this dataset."
                                    }
                                  </div>
                                </div>
                              </div>
                              <select
                                value={hyperparams.max_features}
                                onChange={(e) => setHyperparams(prev => ({ ...prev, max_features: e.target.value }))}
                                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                aria-label={language === 'fr' ? 'Sélectionner le nombre maximum de caractéristiques' : 'Select maximum number of features'}
                              >
                                <option value="sqrt">sqrt - √(nombre de features)</option>
                                <option value="log2">log2 - log₂(nombre de features) ⭐</option>
                                <option value={null}>None - Toutes les features</option>
                              </select>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">
                                  {language === 'fr' ? 'Critère de division (criterion)' : 'Splitting criterion (criterion)'}
                                </label>
                                <div className="group relative">
                                  <span className="text-xs text-gray-500 cursor-help">ℹ️</span>
                                  <div className="absolute right-0 top-6 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    {language === 'fr'
                                      ? "Mesure de qualité des divisions. Entropy est optimal pour ce problème de classification."
                                      : "Measure of split quality. Entropy is optimal for this classification problem."
                                    }
                                  </div>
                                </div>
                              </div>
                              <select
                                value={hyperparams.criterion}
                                onChange={(e) => setHyperparams(prev => ({ ...prev, criterion: e.target.value }))}
                                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                aria-label={language === 'fr' ? 'Sélectionner le critère de division' : 'Select splitting criterion'}
                              >
                                <option value="gini">Gini - Impureté de Gini</option>
                                <option value="entropy">Entropy - Entropie de Shannon ⭐</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Parameter Summary */}
                      <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm space-y-3 sm:space-y-0">
                          <span className="text-gray-600 font-medium">
                            {language === 'fr' ? 'Configuration actuelle:' : 'Current configuration:'}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
                              Trees: {hyperparams.n_estimators}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                              Depth: {hyperparams.max_depth}
                            </span>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                              Min leaf: {hyperparams.min_samples_leaf}
                            </span>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg">
                              Features: {hyperparams.max_features}
                            </span>
                            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg">
                              Criterion: {hyperparams.criterion}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Train Button */}
                    <div className="text-center space-y-3 md:space-y-4">
                      <button
                        onClick={trainModel}
                        disabled={isTraining}
                        className={`inline-flex items-center space-x-2 md:space-x-3 px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-500 ease-out w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isTraining
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white cursor-not-allowed animate-pulse'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:from-purple-600 focus:to-pink-600 text-white transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-purple-500/30 active:scale-95'
                          }`}
                        aria-label={language === 'fr' ? 'Entraîner le modèle Random Forest avec les hyperparamètres actuels' : 'Train Random Forest model with current hyperparameters'}
                      >
                        {isTraining ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                            <span>{language === 'fr' ? 'Entraînement...' : 'Training...'}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 md:w-5 md:h-5" />
                            <span>{language === 'fr' ? 'Entraîner le Modèle' : 'Train Model'}</span>
                          </>
                        )}
                      </button>

                      {/* Training Progress */}
                      {isTraining && trainingProgress && (
                        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-3 md:p-4">
                          <div className="flex items-center justify-center space-x-2 md:space-x-3">
                            <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                            <span className="text-gray-700 font-medium text-sm md:text-base">{trainingProgress}</span>
                          </div>
                          <div className="mt-2 md:mt-3 w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 md:h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="space-y-4 md:space-y-6">
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                        {language === 'fr' ? 'Random Forest' : 'Random Forest'}
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
                        {language === 'fr'
                          ? "Un ensemble d'arbres de décision entraînés sur différents sous-ensembles de données et de caractéristiques."
                          : "An ensemble of decision trees trained on different subsets of data and features."
                        }
                      </p>

                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-gray-600">{language === 'fr' ? 'Arbres' : 'Trees'}</span>
                          <span className="font-mono text-blue-600">{hyperparams.n_estimators}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-gray-600">{language === 'fr' ? 'Profondeur' : 'Depth'}</span>
                          <span className="font-mono text-blue-600">{hyperparams.max_depth}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-gray-600">{language === 'fr' ? 'Min. feuille' : 'Min. leaf'}</span>
                          <span className="font-mono text-blue-600">{hyperparams.min_samples_leaf}</span>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="backdrop-blur-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4 md:p-6">
                        <div className="flex items-start space-x-2 md:space-x-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-red-800 font-semibold mb-2 text-sm md:text-base">
                              {language === 'fr' ? 'Erreur d\'entraînement' : 'Training Error'}
                            </h4>
                            <p className="text-red-700 text-xs md:text-sm mb-3 md:mb-4">{error}</p>

                            {/* System status indicators */}
                            <div className="mb-4 space-y-2">
                              <div className="flex items-center space-x-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-gray-600">
                                  {language === 'fr' ? 'Connexion' : 'Network'}: {networkStatus === 'online' ?
                                    (language === 'fr' ? 'En ligne' : 'Online') :
                                    (language === 'fr' ? 'Hors ligne' : 'Offline')}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${backendHealth === 'healthy' ? 'bg-green-500' :
                                  backendHealth === 'unhealthy' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></div>
                                <span className="text-gray-600">
                                  {language === 'fr' ? 'Serveur' : 'Backend'}: {
                                    backendHealth === 'healthy' ? (language === 'fr' ? 'Opérationnel' : 'Healthy') :
                                      backendHealth === 'unhealthy' ? (language === 'fr' ? 'Problème' : 'Issues') :
                                        backendHealth === 'unreachable' ? (language === 'fr' ? 'Inaccessible' : 'Unreachable') :
                                          (language === 'fr' ? 'Inconnu' : 'Unknown')
                                  }
                                </span>
                              </div>
                              {retryCount > 0 && (
                                <div className="flex items-center space-x-2 text-xs">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-gray-600">
                                    {language === 'fr' ? 'Tentatives' : 'Retry attempts'}: {retryCount}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={retryTraining}
                                disabled={isTraining}
                                className="inline-flex items-center justify-center space-x-2 px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                                aria-label={language === 'fr' ? 'Réessayer l\'entraînement du modèle' : 'Retry model training'}
                              >
                                <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${isTraining ? 'animate-spin' : ''}`} />
                                <span>{language === 'fr' ? 'Réessayer' : 'Retry'}</span>
                              </button>

                              {backendHealth === 'unreachable' && (
                                <button
                                  onClick={handleEmergencyFallback}
                                  className="inline-flex items-center justify-center space-x-2 px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white rounded-lg font-medium transition-all duration-200 text-xs md:text-sm"
                                  aria-label={language === 'fr' ? 'Utiliser les données de démonstration' : 'Use demo data'}
                                >
                                  <Play className="w-3 h-3 md:w-4 md:h-4" />
                                  <span>{language === 'fr' ? 'Mode Démo' : 'Demo Mode'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setError(null);
                                  setLastError(null);
                                  setRetryCount(0);
                                }}
                                className="inline-flex items-center justify-center space-x-2 px-3 md:px-4 py-2 bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-white rounded-lg font-medium transition-all duration-200 text-xs md:text-sm"
                                aria-label={language === 'fr' ? 'Fermer le message d\'erreur' : 'Dismiss error message'}
                              >
                                <span>{language === 'fr' ? 'Fermer' : 'Dismiss'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Results Display with smooth entrance animation
                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  {/* Comprehensive Performance Metrics */}
                  <ModelMetrics modelResults={modelResults} language={language} />

                  {/* Visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Enhanced Confusion Matrix */}
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
                      <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                            {language === 'fr' ? 'Matrice de Confusion' : 'Confusion Matrix'}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600">
                            {language === 'fr' ? 'Prédictions vs réalité' : 'Predictions vs reality'}
                          </p>
                        </div>
                      </div>

                      <PlotlyChart
                        data={confusionMatrixData}
                        layout={{
                          title: '',
                          xaxis: {
                            title: {
                              text: language === 'fr' ? 'Classe Prédite' : 'Predicted Class',
                              font: { size: 14, color: 'rgba(75, 85, 99, 1)' }
                            },
                            tickfont: { color: 'rgba(75, 85, 99, 1)', size: 11 },
                            gridcolor: 'rgba(255, 255, 255, 0.1)',
                            zeroline: false
                          },
                          yaxis: {
                            title: {
                              text: language === 'fr' ? 'Classe Réelle' : 'Actual Class',
                              font: { size: 14, color: 'rgba(75, 85, 99, 1)' }
                            },
                            tickfont: { color: 'rgba(75, 85, 99, 1)', size: 11 },
                            autorange: 'reversed',
                            gridcolor: 'rgba(255, 255, 255, 0.1)',
                            zeroline: false
                          },
                          height: 350,
                          margin: { l: 120, r: 80, t: 20, b: 80 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Arial, sans-serif' }
                        }}
                        config={{
                          displayModeBar: true,
                          displaylogo: false,
                          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'zoom2d'],
                          responsive: true
                        }}
                        className="w-full h-80 md:h-96"
                        ariaLabel={language === 'fr' ? 'Matrice de confusion montrant les prédictions correctes et incorrectes du modèle' : 'Confusion matrix showing correct and incorrect model predictions'}
                        ariaDescription={language === 'fr' ? 'Graphique en heatmap montrant la performance du modèle avec les vrais positifs sur la diagonale principale et les erreurs hors diagonale' : 'Heatmap chart showing model performance with true positives on the main diagonal and errors off-diagonal'}
                      />

                      {/* Matrix Interpretation */}
                      <div className="mt-3 md:mt-4 p-3 md:p-4 backdrop-blur-sm bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-green-500"></div>
                              <span className="font-medium text-gray-700">
                                {language === 'fr' ? 'Vrais Positifs' : 'True Positives'}
                              </span>
                            </div>
                            <p className="text-gray-600">
                              {language === 'fr' ? 'Diagonale principale' : 'Main diagonal'}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-red-500"></div>
                              <span className="font-medium text-gray-700">
                                {language === 'fr' ? 'Erreurs' : 'Errors'}
                              </span>
                            </div>
                            <p className="text-gray-600">
                              {language === 'fr' ? 'Hors diagonale' : 'Off diagonal'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Feature Importance */}
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
                      <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                            {language === 'fr' ? 'Importance des Variables' : 'Feature Importance'}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600">
                            {language === 'fr' ? 'Top 15 des facteurs les plus influents' : 'Top 15 most influential factors'}
                          </p>
                        </div>
                      </div>

                      <PlotlyChart
                        data={featureImportanceData}
                        layout={{
                          title: '',
                          xaxis: {
                            title: {
                              text: language === 'fr' ? 'Score d\'Importance' : 'Importance Score',
                              font: { size: 14, color: 'rgba(75, 85, 99, 1)' }
                            },
                            tickfont: { color: 'rgba(75, 85, 99, 1)', size: 11 },
                            gridcolor: 'rgba(255, 255, 255, 0.1)',
                            zeroline: false,
                            range: [0, Math.max(...(modelResults?.feature_importances?.slice(0, 15).map(f => f.importance) || [0])) * 1.1]
                          },
                          yaxis: {
                            title: '',
                            tickfont: { color: 'rgba(75, 85, 99, 1)', size: 10 },
                            gridcolor: 'rgba(255, 255, 255, 0.1)',
                            zeroline: false
                          },
                          margin: { l: 200, r: 50, t: 20, b: 60 },
                          height: 500,
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Arial, sans-serif' }
                        }}
                        config={{
                          displayModeBar: true,
                          displaylogo: false,
                          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'zoom2d'],
                          responsive: true
                        }}
                        className="w-full h-[400px] md:h-[500px]"
                        ariaLabel={language === 'fr' ? 'Graphique d\'importance des variables montrant les 15 facteurs les plus influents' : 'Feature importance chart showing the top 15 most influential factors'}
                        ariaDescription={language === 'fr' ? 'Graphique en barres horizontales classant les variables financières par ordre d\'importance décroissante pour les prédictions du modèle' : 'Horizontal bar chart ranking financial variables by decreasing importance for model predictions'}
                      />

                      {/* Feature Importance Insights */}
                      <div className="mt-3 md:mt-4 p-3 md:p-4 backdrop-blur-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
                        <div className="flex items-center space-x-2 mb-2 md:mb-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">💡</span>
                          </div>
                          <h4 className="text-xs md:text-sm font-semibold text-gray-800">
                            {language === 'fr' ? 'Interprétation' : 'Interpretation'}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {language === 'fr'
                            ? "Les variables avec les scores d'importance les plus élevés ont le plus d'influence sur les prédictions du modèle. Ces métriques financières sont cruciales pour identifier les actions à risque."
                            : "Features with the highest importance scores have the most influence on the model's predictions. These financial metrics are crucial for identifying risky stocks."
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence-Based Filtering Analysis */}
                  <Suspense fallback={
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        <span className="text-gray-600">
                          {language === 'fr' ? 'Chargement de l\'analyse de confiance...' : 'Loading confidence analysis...'}
                        </span>
                      </div>
                    </div>
                  }>
                    <ConfidenceAnalyzer
                      modelResults={modelResults}
                      language={language}
                    />
                  </Suspense>

                  {/* SHAP Explainability Analysis */}
                  <Suspense fallback={
                    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        <span className="text-gray-600">
                          {language === 'fr' ? 'Chargement de l\'analyse SHAP...' : 'Loading SHAP analysis...'}
                        </span>
                      </div>
                    </div>
                  }>
                    <ShapExplainer
                      modelResults={modelResults}
                      language={language}
                    />
                  </Suspense>

                  {/* Reset Button */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setIsModelTrained(false);
                        setModelResults(null);
                        setError(null);
                        setTrainingProgress('');
                      }}
                      className="inline-flex items-center space-x-2 md:space-x-3 px-4 md:px-6 py-2 md:py-3 bg-white/10 border border-white/20 hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-gray-700 rounded-xl font-medium transition-all duration-200 text-sm md:text-base w-full sm:w-auto"
                      aria-label={language === 'fr' ? 'Commencer un nouvel entraînement de modèle' : 'Start a new model training'}
                    >
                      <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
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

export default function ModelingPage() {
  const { language } = useLanguage();

  return (
    <ModelingErrorBoundary language={language}>
      <ModelingPageContent />
    </ModelingErrorBoundary>
  );
}
