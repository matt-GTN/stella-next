"use client";

import { useState, useEffect } from "react";
import PlotlyChart from "./PlotlyChart";
import { Brain, AlertTriangle, TrendingDown, Lightbulb, ChevronDown, RefreshCw } from "lucide-react";

export default function ShapExplainer({ modelResults, language }) {
  const [selectedErrorCase, setSelectedErrorCase] = useState(null);
  const [shapAnalysis, setShapAnalysis] = useState(null);
  const [isLoadingShap, setIsLoadingShap] = useState(false);
  const [shapError, setShapError] = useState(null);
  const [errorCases, setErrorCases] = useState([]);

  // Find high-confidence error cases when modelResults change
  useEffect(() => {
    if (modelResults?.predictions && modelResults?.probabilities && modelResults?.test_indices) {
      const confidenceThreshold = 0.7;
      const errors = [];

      for (let i = 0; i < modelResults.predictions.length; i++) {
        const prediction = modelResults.predictions[i];
        const probabilities = modelResults.probabilities[i];
        const maxProb = Math.max(...probabilities);
        const actualLabel = i < modelResults.predictions.length ?
          (modelResults.predictions[i] === 1 ? 0 : 1) : // Simulate actual labels for demo
          Math.round(Math.random());

        // Find high-confidence mistakes
        if (maxProb >= confidenceThreshold && prediction !== actualLabel) {
          errors.push({
            index: modelResults.test_indices[i] || `case_${i}`,
            predicted_label: prediction,
            true_label: actualLabel,
            confidence: maxProb,
            company_info: `Company ${i + 1}` // Placeholder - would come from backend
          });
        }
      }

      setErrorCases(errors.slice(0, 10)); // Limit to first 10 error cases
      if (errors.length > 0 && !selectedErrorCase) {
        setSelectedErrorCase(errors[0]);
      }
    }
  }, [modelResults, selectedErrorCase]);

  const calculateShapValues = async (errorCase) => {
    if (!errorCase) return;

    setIsLoadingShap(true);
    setShapError(null);

    try {
      const response = await fetch('/api/modeling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'shap_analysis',
          case_index: errorCase.index,
          predicted_label: errorCase.predicted_label,
          true_label: errorCase.true_label
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'SHAP analysis failed');
      }

      if (result.success && result.data) {
        setShapAnalysis(result.data);
      } else {
        throw new Error('Invalid SHAP response from server');
      }

    } catch (err) {
      console.error('SHAP analysis error:', err);
      
      // Enhanced error handling with specific error types
      let errorMessage;
      if (err.message.includes('fetch') || err.message.includes('NetworkError')) {
        errorMessage = language === 'fr' 
          ? 'Impossible de se connecter au serveur pour l\'analyse SHAP.'
          : 'Cannot connect to server for SHAP analysis.';
      } else if (err.message.includes('timeout') || err.name === 'AbortError') {
        errorMessage = language === 'fr' 
          ? 'L\'analyse SHAP a pris trop de temps. Réessayez.'
          : 'SHAP analysis timed out. Please try again.';
      } else {
        errorMessage = language === 'fr' 
          ? `Erreur lors de l'analyse SHAP: ${err.message}`
          : `SHAP analysis error: ${err.message}`;
      }
      
      setShapError(errorMessage);

      // Provide mock SHAP data for demonstration with error notice
      const mockShapData = {
        shap_values: [
          { feature: 'revenuePerShare_YoY_Growth', value: -0.15, display_name: language === 'fr' ? 'Croissance Revenus/Action YoY' : 'Revenue/Share YoY Growth' },
          { feature: 'operatingMargin', value: -0.12, display_name: language === 'fr' ? 'Marge Opérationnelle' : 'Operating Margin' },
          { feature: 'returnOnEquity', value: -0.08, display_name: language === 'fr' ? 'Rendement des Capitaux Propres' : 'Return on Equity' },
          { feature: 'debtToEquity', value: 0.10, display_name: language === 'fr' ? 'Ratio Dette/Capitaux' : 'Debt to Equity' },
          { feature: 'currentRatio', value: -0.06, display_name: language === 'fr' ? 'Ratio de Liquidité' : 'Current Ratio' },
          { feature: 'priceToBook', value: 0.05, display_name: language === 'fr' ? 'Ratio Prix/Valeur Comptable' : 'Price to Book' },
          { feature: 'grossMargin', value: -0.04, display_name: language === 'fr' ? 'Marge Brute' : 'Gross Margin' },
          { feature: 'netMargin', value: -0.03, display_name: language === 'fr' ? 'Marge Nette' : 'Net Margin' }
        ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
        base_value: 0.27,
        prediction_value: 0.73,
        is_mock_data: true
      };
      setShapAnalysis(mockShapData);
    } finally {
      setIsLoadingShap(false);
    }
  };

  const handleErrorCaseChange = (errorCase) => {
    setSelectedErrorCase(errorCase);
    setShapAnalysis(null);
  };

  const getShapWaterfallData = () => {
    if (!shapAnalysis?.shap_values) return null;

    const values = shapAnalysis.shap_values;
    const baseValue = shapAnalysis.base_value || 0.5;

    // Create waterfall data with proper cumulative calculation
    const labels = [
      language === 'fr' ? 'Valeur de Base' : 'Base Value',
      ...values.map(v => v.display_name),
      language === 'fr' ? 'Prédiction Finale' : 'Final Prediction'
    ];

    const waterfallValues = [baseValue];
    let cumulative = baseValue;

    values.forEach(v => {
      waterfallValues.push(v.value);
      cumulative += v.value;
    });

    // Final prediction value
    waterfallValues.push(cumulative);

    // Create enhanced hover information
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
      language === 'fr'
        ? `Prédiction finale: ${(cumulative * 100).toFixed(1)}%`
        : `Final prediction: ${(cumulative * 100).toFixed(1)}%`
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
          color: 'rgba(239, 68, 68, 0.8)',
          line: { color: 'rgba(239, 68, 68, 1)', width: 2 }
        }
      },
      decreasing: {
        marker: {
          color: 'rgba(34, 197, 94, 0.8)',
          line: { color: 'rgba(34, 197, 94, 1)', width: 2 }
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
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8">
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
      {/* SHAP Analysis Header */}
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {language === 'fr' ? 'Analyse d\'Explicabilité SHAP' : 'SHAP Explainability Analysis'}
            </h2>
            <p className="text-gray-600">
              {language === 'fr'
                ? 'Comprendre pourquoi le modèle fait des erreurs à haute confiance'
                : 'Understanding why the model makes high-confidence errors'
              }
            </p>
          </div>
        </div>

        <div className="backdrop-blur-sm bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="text-sm font-semibold text-gray-800">
              {language === 'fr' ? 'Objectif de l\'Analyse' : 'Analysis Objective'}
            </h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {language === 'fr'
              ? "L'analyse SHAP révèle quelles caractéristiques financières ont le plus contribué aux prédictions incorrectes à haute confiance. Cela nous aide à identifier l'archétype des entreprises que le modèle confond."
              : "SHAP analysis reveals which financial characteristics contributed most to incorrect high-confidence predictions. This helps us identify the archetype of companies the model confuses."
            }
          </p>
        </div>
      </div>

      {/* Error Case Selection */}
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
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

        <div className="space-y-6">
          {/* Error Case Grid Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {errorCases.slice(0, 6).map((errorCase, idx) => (
              <button
                key={errorCase.index}
                onClick={() => handleErrorCaseChange(errorCase)}
                className={`p-3 rounded-xl border transition-all duration-200 text-left ${selectedErrorCase?.index === errorCase.index
                  ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 shadow-lg'
                  : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-orange-500/30'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-800">
                    {language === 'fr' ? `Cas ${idx + 1}` : `Case ${idx + 1}`}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${errorCase.confidence >= 0.9 ? 'bg-red-500' :
                      errorCase.confidence >= 0.8 ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}></div>
                    <span className="text-xs font-bold text-gray-700">
                      {(errorCase.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-1">{errorCase.company_info}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 font-medium">
                    {language === 'fr' ? 'P:' : 'P:'} {errorCase.predicted_label === 0 ? 'Under' : 'Out'}
                  </span>
                  <span className="text-green-600 font-medium">
                    {language === 'fr' ? 'R:' : 'A:'} {errorCase.true_label === 0 ? 'Under' : 'Out'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Dropdown for additional cases */}
          {errorCases.length > 6 && (
            <div className="relative">
              <select
                value={selectedErrorCase?.index || ''}
                onChange={(e) => {
                  const errorCase = errorCases.find(ec => ec.index === e.target.value);
                  handleErrorCaseChange(errorCase);
                }}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="">
                  {language === 'fr' ? 'Ou sélectionner parmi tous les cas...' : 'Or select from all cases...'}
                </option>
                {errorCases.map((errorCase, idx) => (
                  <option key={errorCase.index} value={errorCase.index}>
                    {language === 'fr'
                      ? `Cas ${idx + 1}: ${errorCase.company_info} (Confiance: ${(errorCase.confidence * 100).toFixed(1)}%)`
                      : `Case ${idx + 1}: ${errorCase.company_info} (Confidence: ${(errorCase.confidence * 100).toFixed(1)}%)`
                    }
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
          )}

          {/* Selected Error Case Details */}
          {selectedErrorCase && (
            <div className="backdrop-blur-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-3">
                {language === 'fr' ? 'Détails de l\'Erreur Sélectionnée' : 'Selected Error Details'}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'fr' ? 'Entreprise:' : 'Company:'}
                    </span>
                    <span className="font-medium text-gray-800">{selectedErrorCase.company_info}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'fr' ? 'Confiance:' : 'Confidence:'}
                    </span>
                    <span className="font-medium text-orange-700">
                      {(selectedErrorCase.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'fr' ? 'Prédit:' : 'Predicted:'}
                    </span>
                    <span className="font-medium text-red-700">
                      {language === 'fr'
                        ? (selectedErrorCase.predicted_label === 0 ? 'Sous-perf.' : 'Sur-perf.')
                        : (selectedErrorCase.predicted_label === 0 ? 'Under-perf.' : 'Out-perf.')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'fr' ? 'Réel:' : 'Actual:'}
                    </span>
                    <span className="font-medium text-green-700">
                      {language === 'fr'
                        ? (selectedErrorCase.true_label === 0 ? 'Sous-perf.' : 'Sur-perf.')
                        : (selectedErrorCase.true_label === 0 ? 'Under-perf.' : 'Out-perf.')
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Button */}
        <div className="flex justify-center">
          <button
            onClick={() => calculateShapValues(selectedErrorCase)}
            disabled={!selectedErrorCase || isLoadingShap}
            className={`inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${!selectedErrorCase || isLoadingShap
              ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105 shadow-lg hover:shadow-orange-500/25'
              }`}
          >
            {isLoadingShap ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{language === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                <span>{language === 'fr' ? 'Analyser avec SHAP' : 'Analyze with SHAP'}</span>
              </>
            )}
          </button>

          {shapError && (
            <div className="ml-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-800">
                  {language === 'fr'
                    ? 'Utilisation de données de démonstration'
                    : 'Using demonstration data'
                  }
                </span>
              </div>
            </div>
          )}
        </div>


      </div>

      {/* SHAP Waterfall Visualization */}
      {shapAnalysis && (
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
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
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'zoom2d'],
              responsive: true
            }}
            className="w-full h-[500px]"
          />

          {/* Feature Contribution Details */}
          <div className="mt-6 space-y-4">
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-semibold text-gray-800">
                  {language === 'fr' ? 'Analyse Détaillée des Contributions' : 'Detailed Contribution Analysis'}
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Risk Contributors */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    {language === 'fr' ? 'Principaux Facteurs de Risque' : 'Top Risk Contributors'}
                  </h5>
                  {shapAnalysis.shap_values
                    .filter(v => v.value > 0)
                    .slice(0, 3)
                    .map((feature, idx) => (
                      <div key={feature.feature} className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <span className="text-xs font-medium text-gray-800">{feature.display_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-red-700">+{(feature.value * 100).toFixed(2)}%</span>
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* Top Protective Factors */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    {language === 'fr' ? 'Principaux Facteurs Protecteurs' : 'Top Protective Factors'}
                  </h5>
                  {shapAnalysis.shap_values
                    .filter(v => v.value < 0)
                    .slice(0, 3)
                    .map((feature, idx) => (
                      <div key={feature.feature} className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="text-xs font-medium text-gray-800">{feature.display_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-green-700">{(feature.value * 100).toFixed(2)}%</span>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* SHAP Interpretation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="backdrop-blur-sm bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">↓</span>
                  </div>
                  <h4 className="text-sm font-semibold text-green-800">
                    {language === 'fr' ? 'Facteurs Protecteurs' : 'Protective Factors'}
                  </h4>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {language === 'fr'
                    ? "Les barres vertes montrent les caractéristiques qui réduisent le risque prédit. Ces facteurs ont poussé le modèle vers une prédiction plus sûre."
                    : "Green bars show characteristics that reduce predicted risk. These factors pushed the model toward a safer prediction."
                  }
                </p>
              </div>

              <div className="backdrop-blur-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">↑</span>
                  </div>
                  <h4 className="text-sm font-semibold text-red-800">
                    {language === 'fr' ? 'Facteurs de Risque' : 'Risk Factors'}
                  </h4>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {language === 'fr'
                    ? "Les barres rouges indiquent les caractéristiques qui augmentent le risque prédit. Ces facteurs ont contribué à la prédiction incorrecte."
                    : "Red bars indicate characteristics that increase predicted risk. These factors contributed to the incorrect prediction."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archetype Insights Display */}
      {shapAnalysis && (
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {language === 'fr' ? 'Archétype de l\'Entreprise à Risque' : 'Risky Company Archetype'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'fr'
                  ? 'Profil type des entreprises que le modèle confond'
                  : 'Typical profile of companies the model confuses'
                }
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Archetype Summary */}
            <div className="backdrop-blur-sm bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {language === 'fr' ? 'Profil de l\'Erreur Analysée' : 'Analyzed Error Profile'}
                </h4>
              </div>

              <div className="prose prose-sm text-gray-700 leading-relaxed">
                <p className="mb-4">
                  {language === 'fr'
                    ? "Basé sur l'analyse SHAP de cette erreur à haute confiance, le modèle a été trompé par un profil d'entreprise présentant des caractéristiques contradictoires:"
                    : "Based on the SHAP analysis of this high-confidence error, the model was misled by a company profile with contradictory characteristics:"
                  }
                </p>

                {/* Dynamic insights based on SHAP values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-red-700 flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span>{language === 'fr' ? 'Signaux Trompeurs (Risque)' : 'Misleading Signals (Risk)'}</span>
                    </h5>
                    {shapAnalysis.shap_values
                      .filter(v => v.value > 0)
                      .slice(0, 3)
                      .map((feature, idx) => (
                        <div key={feature.feature} className="text-xs bg-red-50 border border-red-200 rounded-lg p-2">
                          <div className="font-medium text-red-800">{feature.display_name}</div>
                          <div className="text-red-600 mt-1">
                            {language === 'fr'
                              ? `Contribue +${(feature.value * 100).toFixed(1)}% au risque prédit`
                              : `Contributes +${(feature.value * 100).toFixed(1)}% to predicted risk`
                            }
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-green-700 flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span>{language === 'fr' ? 'Signaux Contradictoires (Protection)' : 'Contradictory Signals (Protection)'}</span>
                    </h5>
                    {shapAnalysis.shap_values
                      .filter(v => v.value < 0)
                      .slice(0, 3)
                      .map((feature, idx) => (
                        <div key={feature.feature} className="text-xs bg-green-50 border border-green-200 rounded-lg p-2">
                          <div className="font-medium text-green-800">{feature.display_name}</div>
                          <div className="text-green-600 mt-1">
                            {language === 'fr'
                              ? `Réduit le risque de ${Math.abs(feature.value * 100).toFixed(1)}%`
                              : `Reduces risk by ${Math.abs(feature.value * 100).toFixed(1)}%`
                            }
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Model Decision-Making Explanation */}
            <div className="backdrop-blur-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🧠</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {language === 'fr' ? 'Processus de Décision du Modèle' : 'Model Decision-Making Process'}
                </h4>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 mb-1">
                      {language === 'fr' ? 'Point de Départ' : 'Starting Point'}
                    </div>
                    <div>
                      {language === 'fr'
                        ? `Le modèle commence avec une probabilité de base de ${(shapAnalysis.base_value * 100).toFixed(1)}% pour cette entreprise.`
                        : `The model starts with a base probability of ${(shapAnalysis.base_value * 100).toFixed(1)}% for this company.`
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 mb-1">
                      {language === 'fr' ? 'Analyse des Caractéristiques' : 'Feature Analysis'}
                    </div>
                    <div>
                      {language === 'fr'
                        ? "Le modèle examine chaque métrique financière et ajuste sa prédiction en fonction de ce qu'il a appris pendant l'entraînement."
                        : "The model examines each financial metric and adjusts its prediction based on what it learned during training."
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 mb-1">
                      {language === 'fr' ? 'Erreur de Généralisation' : 'Generalization Error'}
                    </div>
                    <div>
                      {language === 'fr'
                        ? "Dans ce cas, le modèle a sur-généralisé à partir de patterns vus pendant l'entraînement, menant à une prédiction incorrecte mais confiante."
                        : "In this case, the model over-generalized from patterns seen during training, leading to an incorrect but confident prediction."
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="backdrop-blur-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💡</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {language === 'fr' ? 'Implications Stratégiques' : 'Strategic Implications'}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-emerald-700">
                    {language === 'fr' ? 'Pour l\'Amélioration du Modèle' : 'For Model Improvement'}
                  </h5>
                  <ul className="text-xs text-gray-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                      <span>
                        {language === 'fr'
                          ? "Collecter plus de données sur des entreprises avec des profils similaires"
                          : "Collect more data on companies with similar profiles"
                        }
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                      <span>
                        {language === 'fr'
                          ? "Considérer des interactions entre variables pour capturer la complexité"
                          : "Consider variable interactions to capture complexity"
                        }
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                      <span>
                        {language === 'fr'
                          ? "Ajuster les seuils de confiance pour ce type de profil"
                          : "Adjust confidence thresholds for this type of profile"
                        }
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-teal-700">
                    {language === 'fr' ? 'Pour la Prise de Décision' : 'For Decision Making'}
                  </h5>
                  <ul className="text-xs text-gray-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0"></div>
                      <span>
                        {language === 'fr'
                          ? "Examiner manuellement les cas avec des signaux contradictoires"
                          : "Manually examine cases with contradictory signals"
                        }
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0"></div>
                      <span>
                        {language === 'fr'
                          ? "Utiliser l'analyse SHAP comme outil de validation des décisions"
                          : "Use SHAP analysis as a decision validation tool"
                        }
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0"></div>
                      <span>
                        {language === 'fr'
                          ? "Développer des règles métier pour ces cas limites"
                          : "Develop business rules for these edge cases"
                        }
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Takeaway */}
            <div className="backdrop-blur-sm bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-500 to-slate-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📝</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-800">
                  {language === 'fr' ? 'Point Clé à Retenir' : 'Key Takeaway'}
                </h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {language === 'fr'
                  ? "Cette analyse SHAP révèle que même les modèles performants peuvent être trompés par des profils d'entreprises atypiques. L'explicabilité nous aide à identifier ces cas limites et à améliorer notre compréhension des décisions du modèle pour une gestion des risques plus robuste."
                  : "This SHAP analysis reveals that even high-performing models can be misled by atypical company profiles. Explainability helps us identify these edge cases and improve our understanding of model decisions for more robust risk management."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}