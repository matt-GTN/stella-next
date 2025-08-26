"use client";

import { useState, useEffect } from "react";
import PlotlyChart from "./PlotlyChart";
import { Brain, AlertTriangle, TrendingDown, Lightbulb, ChevronDown, RefreshCw, CheckCircle, Building2, Gauge, TrendingUp } from "lucide-react";

/**
 * Composant d'explication SHAP pour analyser les erreurs de prédiction du modèle
 * @param {Object} modelResults - Résultats du modèle avec prédictions et probabilités
 * @param {string} language - Langue d'affichage
 * @param {number} confidenceThreshold - Seuil de confiance pour filtrer les erreurs
 */
export default function ShapExplainer({ modelResults, language, confidenceThreshold = 0.7 }) {
  const [selectedErrorCase, setSelectedErrorCase] = useState(null);
  const [shapAnalysis, setShapAnalysis] = useState(null);
  const [isLoadingShap, setIsLoadingShap] = useState(false);
  const [shapError, setShapError] = useState(null);
  const [errorCases, setErrorCases] = useState([]);

  // Trouver les cas d'erreur à haute confiance quand modelResults ou confidenceThreshold changent
  useEffect(() => {
    let errors = [];

    if (modelResults?.error_cases_by_threshold) {
      // Utiliser les cas d'erreur pré-calculés du backend
      const availableThresholds = Object.keys(modelResults.error_cases_by_threshold)
        .map(t => parseFloat(t))
        .sort((a, b) => a - b);

      // Trouver le seuil le plus proche mais pas supérieur au seuil actuel
      let selectedThreshold = availableThresholds[0];
      for (const threshold of availableThresholds) {
        if (threshold <= confidenceThreshold) {
          selectedThreshold = threshold;
        } else {
          break;
        }
      }

      errors = modelResults.error_cases_by_threshold[selectedThreshold.toString()] || [];
      setErrorCases(errors);
    } else if (modelResults?.predictions && modelResults?.probabilities && modelResults?.test_indices) {
      // Retour à l'ancienne méthode de calcul si la nouvelle structure n'est pas disponible
      for (let i = 0; i < modelResults.predictions.length; i++) {
        const prediction = modelResults.predictions[i];
        const probabilities = modelResults.probabilities[i];
        const predictionConfidence = probabilities[prediction];
        const actualLabel = modelResults.true_labels ? modelResults.true_labels[i] :
          (modelResults.predictions[i] === 1 ? 0 : 1);

        if (predictionConfidence >= confidenceThreshold && prediction !== actualLabel) {
          errors.push({
            index: i,
            predicted_label: prediction,
            true_label: actualLabel,
            confidence: predictionConfidence,
            company_info: modelResults.test_indices[i] || `Company ${i + 1}`
          });
        }
      }

      setErrorCases(errors.slice(0, 20));
    } else {
      setErrorCases([]);
    }

    // Reset selected error case if it's no longer valid with new threshold
    if (errors.length > 0) {
      const currentSelectedStillValid = selectedErrorCase &&
        errors.some(e => e.index === selectedErrorCase.index);

      if (!currentSelectedStillValid) {
        setSelectedErrorCase(errors[0]);
        // Clear previous SHAP analysis when switching to new error cases
        setShapAnalysis(null);
      }
    } else {
      setSelectedErrorCase(null);
      setShapAnalysis(null);
    }
  }, [modelResults, confidenceThreshold]);

  const calculateShapValues = async (errorCase) => {
    if (!errorCase) return;

    // Check if we already have pre-computed SHAP analysis
    if (errorCase.shap_analysis) {
      setShapAnalysis(errorCase.shap_analysis);
      return;
    }

    setIsLoadingShap(true);
    setShapError(null);

    try {
      // Get all error indices for batch analysis
      const allErrorIndices = errorCases.map(ec => ec.index); // Already integers, no need to parse

      const response = await fetch('/api/modeling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'shap-analysis',
          model_results: {
            ...modelResults,
            hyperparameters: modelResults.hyperparameters || modelResults.data_info?.hyperparameters
          },
          error_indices: allErrorIndices
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'SHAP analysis failed');
      }

      if (result.success && result.data) {
        // Find the specific case we're analyzing
        const selectedCaseData = result.data.error_cases?.find(
          case_data => case_data.index === errorCase.index.toString()
        );

        if (selectedCaseData) {
          setShapAnalysis({
            shap_values: selectedCaseData.shap_values,
            base_value: selectedCaseData.base_value,
            prediction_value: selectedCaseData.prediction_value,
            is_real_shap: selectedCaseData.is_real_shap,
            analysis_type: result.data.analysis_summary?.analysis_type
          });
        } else {
          // If specific case not found, use the first available case as fallback
          const firstCase = result.data.error_cases?.[0];
          if (firstCase) {
            setShapAnalysis({
              shap_values: firstCase.shap_values,
              base_value: firstCase.base_value,
              prediction_value: firstCase.prediction_value,
              is_real_shap: firstCase.is_real_shap,
              analysis_type: result.data.analysis_summary?.analysis_type
            });
          } else {
            throw new Error('No SHAP analysis results found');
          }
        }
      } else {
        throw new Error('Invalid SHAP response from server');
      }

    } catch (err) {
      console.error('SHAP analysis error:', err.message || err);

      // Enhanced error handling with specific error types
      let errorMessage;
      if (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
        errorMessage = language === 'fr'
          ? 'Impossible de se connecter au serveur pour l\'analyse SHAP.'
          : 'Cannot connect to server for SHAP analysis.';
      } else if (err.message && (err.message.includes('timeout') || err.name === 'AbortError')) {
        errorMessage = language === 'fr'
          ? 'L\'analyse SHAP a pris trop de temps. Réessayez.'
          : 'SHAP analysis timed out. Please try again.';
      } else {
        errorMessage = language === 'fr'
          ? `Erreur lors de l'analyse SHAP: ${err.message || 'Erreur inconnue'}`
          : `SHAP analysis error: ${err.message || 'Unknown error'}`;
      }

      setShapError(errorMessage);

      // Don't throw the error - just set the error state for display
    } finally {
      setIsLoadingShap(false);
    }
  };

  const handleErrorCaseChange = (errorCase) => {
    setSelectedErrorCase(errorCase);

    // Use pre-computed SHAP analysis if available
    if (errorCase.shap_analysis) {
      setShapAnalysis(errorCase.shap_analysis);
    } else {
      setShapAnalysis(null);
    }
  };

  const getShapWaterfallData = () => {
    if (!shapAnalysis?.shap_values) return null;

    const values = shapAnalysis.shap_values;
    const baseValue = shapAnalysis.base_value || 0.5;

    // Use the backend's prediction value - it represents class 1 probability
    const finalPrediction = shapAnalysis.prediction_value !== undefined
      ? shapAnalysis.prediction_value
      : baseValue + values.reduce((sum, v) => sum + v.value, 0);

    // Create waterfall data with proper cumulative calculation
    const labels = [
      language === 'fr' ? 'Valeur de Base' : 'Base Value',
      ...values.map(v => v.display_name),
      language === 'fr' ? 'Prédiction Finale' : 'Final Prediction'
    ];

    const waterfallValues = [baseValue];

    values.forEach(v => {
      waterfallValues.push(v.value);
    });

    // Final prediction value - should correctly reflect probability of class 1
    waterfallValues.push(finalPrediction);

    // Create enhanced hover information - always shows class 1 probability
    const predictionExplanation = language === 'fr' ?
      `Probabilité de sur-performance: ${(finalPrediction * 100).toFixed(1)}%` :
      `Probability of out-performance: ${(finalPrediction * 100).toFixed(1)}%`;

    const hoverTexts = [
      language === 'fr'
        ? `Probabilité de base du modèle: ${(baseValue * 100).toFixed(1)}%`
        : `Model's base probability: ${(baseValue * 100).toFixed(1)}%`,
      ...values.map(v => {
        const impact = v.value > 0
          ? (language === 'fr' ? 'augmente le risque' : 'increases risk')
          : (language === 'fr' ? 'diminue le risque' : 'decreases risk');
        return `${v.display_name}: ${impact} de ${Math.abs(v.value * 100).toFixed(2)}%`;
      }),
      predictionExplanation
    ];

    return [{
      x: labels,
      y: waterfallValues,
      type: 'waterfall',
      orientation: 'v',
      measure: ['absolute', ...values.map(() => 'relative'), 'total'],
      text: waterfallValues.map((val, idx) => {
        if (idx === 0) return `${(val * 100).toFixed(1)}%`;
        if (idx === labels.length - 1) return `${(val * 100).toFixed(1)}%`;
        return `${val >= 0 ? '+' : ''}${(val * 100).toFixed(2)}%`;
      }),
      textposition: 'auto',
      textfont: {
        color: 'white',
        size: 12,
        family: 'Arial, sans-serif',
        weight: 'bold'
      },
      connector: {
        line: {
          color: 'rgba(147, 51, 234, 0.6)',
          width: 3
        }
      },
      increasing: {
        marker: {
          color: 'rgba(34, 197, 94, 0.8)',
          line: { color: 'rgba(34, 197, 94, 1)', width: 2 }
        }
      },
      decreasing: {
        marker: {
          color: 'rgba(239, 68, 68, 0.8)',
          line: { color: 'rgba(239, 68, 68, 1)', width: 2 }
        }
      },
      totals: {
        marker: {
          color: 'rgba(147, 51, 234, 0.8)',
          line: { color: 'rgba(147, 51, 234, 1)', width: 2 }
        }
      },
      hovertemplate:
        '<b>%{x}</b><br>' +
        '%{customdata}<br>' +
        '<b>' + (language === 'fr' ? 'Valeur' : 'Value') + ':</b> %{text}<br>' +
        '<extra></extra>',
      customdata: hoverTexts,
      hoverlabel: {
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        bordercolor: 'rgba(147, 51, 234, 1)',
        borderwidth: 2,
        font: { color: 'white', size: 13, family: 'Arial, sans-serif' }
      }
    }];
  };

  if (!errorCases.length) {
    return (
      <div className="backdrop-blur-lg shadow-xl bg-white/10 border border-white/20 rounded-3xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {language === 'fr' ? 'Analyse SHAP Non Disponible' : 'SHAP Analysis Not Available'}
          </h3>
          <p className="text-gray-600">
            {language === 'fr'
              ? 'Aucune erreur à haute confiance trouvée pour l\'analyse SHAP.'
              : 'No high-confidence errors found for SHAP analysis.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Error Case Selection */}
      <div className="backdrop-blur-lg shadow-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {language === 'fr' ? 'Cas d\'Erreur à Analyser' : 'Error Case to Analyze'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'fr'
                  ? `${errorCases.length} erreurs à haute confiance trouvées`
                  : `${errorCases.length} high-confidence errors found`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Two-pane layout: compact grid of cases (left), large details (right) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Error Case Grid Selector */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {errorCases.slice(0, 8).map((errorCase, idx) => (
                <button
                  key={errorCase.index}
                  onClick={() => handleErrorCaseChange(errorCase)}
                  className={`group p-2 rounded-lg border transition-all duration-200 text-left ${selectedErrorCase?.index === errorCase.index
                    ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/40 shadow-lg'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-orange-500/30'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-700">
                      {language === 'fr' ? `Cas ${idx + 1}` : `Case ${idx + 1}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${errorCase.confidence >= 0.9 ? 'bg-red-500' : errorCase.confidence >= 0.8 ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-[10px] font-bold text-gray-700">
                        {(errorCase.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-800 truncate max-w-[70%]">{errorCase.company_info}</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 opacity-80" />
                  </div>
                </button>
              ))}
            </div>

            {/* Dropdown for all cases (always show if more than 8 cases) */}
            {errorCases.length > 8 && (
              <div className="relative mt-3">
                <div className="mb-2">
                  <span className="text-xs text-gray-600">
                    {language === 'fr'
                      ? `${errorCases.length} cas d'erreur au total - Sélectionnez dans la liste ci-dessous :`
                      : `${errorCases.length} total error cases - Select from list below:`
                    }
                  </span>
                </div>
                <select
                  value={selectedErrorCase?.index || ''}
                  onChange={(e) => {
                    const errorCase = errorCases.find(ec => String(ec.index) === e.target.value);
                    handleErrorCaseChange(errorCase);
                  }}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">
                    {language === 'fr' ? 'Tous les cas d\'erreur disponibles...' : 'All available error cases...'}
                  </option>
                  {errorCases.map((errorCase, idx) => {
                    const isInGrid = idx < 8;
                    const prefix = isInGrid
                      ? (language === 'fr' ? '★ ' : '★ ') // Star for grid items
                      : '   '; // Indent for dropdown-only items

                    return (
                      <option key={errorCase.index} value={String(errorCase.index)}>
                        {prefix}{language === 'fr'
                          ? `Cas ${idx + 1}: ${errorCase.company_info} (${(errorCase.confidence * 100).toFixed(1)}%)`
                          : `Case ${idx + 1}: ${errorCase.company_info} (${(errorCase.confidence * 100).toFixed(1)}%)`}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-[50px] -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Selected Error Case Details */}
          <div className="md:col-span-3">
            {selectedErrorCase ? (
              <div className="backdrop-blur-lg shadow-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-800">
                      {language === 'fr' ? 'Détails de l\'Erreur Sélectionnée' : 'Selected Error Details'}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">{language === 'fr' ? 'Confiance' : 'Confidence'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-700 border border-orange-500/30">
                      {(selectedErrorCase.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Building2 className="w-5 h-5 text-gray-700" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">{language === 'fr' ? 'Entreprise' : 'Company'}</div>
                      <div className="text-sm font-medium text-gray-800">{selectedErrorCase.company_info}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Gauge className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">{language === 'fr' ? 'Confiance' : 'Confidence'}</div>
                      <div className="text-sm font-medium text-orange-700">{(selectedErrorCase.confidence * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    {selectedErrorCase.predicted_label === 1 ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">{language === 'fr' ? 'Prédit' : 'Predicted'}</div>
                      <div className="text-sm font-medium text-red-700">
                        {language === 'fr' ? (selectedErrorCase.predicted_label === 0 ? 'Sous-perf.' : 'Sur-perf.') : (selectedErrorCase.predicted_label === 0 ? 'Under-perf.' : 'Out-perf.')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    {selectedErrorCase.true_label === 1 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">{language === 'fr' ? 'Réel' : 'Actual'}</div>
                      <div className="text-sm font-medium text-green-700">
                        {language === 'fr' ? (selectedErrorCase.true_label === 0 ? 'Sous-perf.' : 'Sur-perf.') : (selectedErrorCase.true_label === 0 ? 'Under-perf.' : 'Out-perf.')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analyze button inside details to emphasize flow */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => calculateShapValues(selectedErrorCase)}
                    disabled={!selectedErrorCase || isLoadingShap}
                    className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${!selectedErrorCase || isLoadingShap
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-orange-500/25'
                      }`}
                  >
                    {isLoadingShap ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{language === 'fr' ? 'Analyse en cours…' : 'Analyzing…'}</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        <span>{language === 'fr' ? 'Analyser avec SHAP' : 'Analyze with SHAP'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-white/20 bg-white/5 text-gray-600 text-sm">
                {language === 'fr' ? 'Sélectionnez un cas pour voir les détails.' : 'Select a case to view details.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SHAP Waterfall Visualization */}
      {shapAnalysis && (
        <div className="backdrop-blur-lg shadow-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {language === 'fr' ? 'Contributions des Caractéristiques' : 'Feature Contributions'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'fr'
                  ? 'Comment chaque variable a influencé cette prédiction incorrecte'
                  : 'How each variable influenced this incorrect prediction'
                }
              </p>
            </div>
          </div>

          <PlotlyChart
            data={getShapWaterfallData()}
            layout={{
              title: '',
              xaxis: {
                title: {
                  text: language === 'fr' ? 'Variables Financières' : 'Financial Variables',
                  font: { size: 14, color: 'rgba(75, 85, 99, 1)' }
                },
                tickfont: { color: 'rgba(75, 85, 99, 1)', size: 10 },
                tickangle: -45,
                gridcolor: 'rgba(255, 255, 255, 0.1)',
                zeroline: false
              },
              yaxis: {
                title: {
                  text: language === 'fr' ? 'Probabilité de Risque' : 'Risk Probability',
                  font: { size: 14, color: 'rgba(75, 85, 99, 1)' }
                },
                tickfont: { color: 'rgba(75, 85, 99, 1)', size: 11 },
                gridcolor: 'rgba(255, 255, 255, 0.1)',
                zeroline: true,
                zerolinecolor: 'rgba(255, 255, 255, 0.3)',
                tickformat: '.1%'
              },
              height: 500,
              margin: { l: 80, r: 50, t: 20, b: 120 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Arial, sans-serif' }
            }}
            config={{
              displayModeBar: false,
              displaylogo: false,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'zoom2d'],
              responsive: true
            }}
            className="w-full h-[500px]"
          />

          {/* Feature Contribution Details */}
          <div className="mt-6 space-y-4">
            <div className="backdrop-blur-lg shadow-xl bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-semibold text-gray-800">
                  {language === 'fr' ? 'Analyse Détaillée des Contributions' : 'Detailed Contribution Analysis'}
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Risk Contributors */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    {language === 'fr' ? 'Principaux Facteurs Protecteurs' : 'Top Risk Contributors'}
                  </h5>
                  {shapAnalysis.shap_values
                    .filter(v => v.value > 0)
                    .slice(0, 3)
                    .map((feature, idx) => (
                      <div key={feature.feature} className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="text-xs font-medium text-gray-800">{feature.display_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-green-700">+{(feature.value * 100).toFixed(2)}%</span>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* Top Protective Factors */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    {language === 'fr' ? 'Principaux Facteurs de Risque' : 'Top Protective Factors'}
                  </h5>
                  {shapAnalysis.shap_values
                    .filter(v => v.value < 0)
                    .slice(0, 3)
                    .map((feature, idx) => (
                      <div key={feature.feature} className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <span className="text-xs font-medium text-gray-800">{feature.display_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-red-700">{(feature.value * 100).toFixed(2)}%</span>
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}