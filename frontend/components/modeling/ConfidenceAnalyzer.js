"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import Slider from "./Slider";
import PlotlyChart from "./PlotlyChart";

export default function ConfidenceAnalyzer({ modelResults, language = 'en', onConfidenceThresholdChange }) {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  
  // Handle threshold changes and notify parent
  const handleThresholdChange = (newThreshold) => {
    setConfidenceThreshold(newThreshold);
    if (onConfidenceThresholdChange) {
      onConfidenceThresholdChange(newThreshold);
    }
  };
  const [confidenceAnalysis, setConfidenceAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Use pre-computed confidence analysis when threshold changes
  useEffect(() => {
    console.log('ConfidenceAnalyzer - ModelResults keys:', Object.keys(modelResults || {}));
    console.log('Has confidence_analysis_by_threshold:', !!modelResults?.confidence_analysis_by_threshold);
    
    if (!modelResults?.confidence_analysis_by_threshold) {
      console.log('No pre-computed confidence analysis found, falling back to old method');
      // Fallback to old calculation if new structure not available
      if (!modelResults?.probabilities || !modelResults?.predictions) return;
    } else {
      console.log('Using pre-computed confidence analysis');
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Simulate analysis delay for better UX
    const timer = setTimeout(() => {
      try {
        let analysis;
        
        if (modelResults?.confidence_analysis_by_threshold) {
          // Use pre-computed confidence analysis
          const availableThresholds = Object.keys(modelResults.confidence_analysis_by_threshold)
            .map(t => parseFloat(t))
            .sort((a, b) => a - b);
          
          // Find the threshold that's closest to but not greater than the current threshold
          let selectedThreshold = availableThresholds[0];
          for (const threshold of availableThresholds) {
            if (threshold <= confidenceThreshold) {
              selectedThreshold = threshold;
            } else {
              break;
            }
          }
          
          analysis = modelResults.confidence_analysis_by_threshold[selectedThreshold.toString()];
          console.log(`Using pre-computed confidence analysis for threshold ${selectedThreshold} (requested: ${confidenceThreshold})`);
        } else {
          // Fallback to old calculation method
          console.log('Using fallback confidence analysis calculation');
          analysis = calculateConfidenceAnalysis(
            modelResults.probabilities,
            modelResults.predictions,
            modelResults.test_indices || [],
            confidenceThreshold,
            modelResults.true_labels || []
          );
        }
        
        setConfidenceAnalysis(analysis);
        setAnalysisError(null);
      } catch (error) {
        console.error('Confidence analysis error:', error);
        setAnalysisError(language === 'fr' 
          ? 'Erreur lors de l\'analyse de confiance. Données invalides.'
          : 'Error during confidence analysis. Invalid data.');
        setConfidenceAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [confidenceThreshold, modelResults, language]);

  const calculateConfidenceAnalysis = (probabilities, predictions, testIndices, threshold, trueLabels) => {
    if (!probabilities || !predictions || !trueLabels) return null;

    // Calculate confidence for each prediction (confidence in the actual prediction made)
    const confidences = probabilities.map((prob, idx) => prob[predictions[idx]]);
    
    // Filter high-confidence predictions
    const highConfidenceIndices = confidences
      .map((conf, idx) => ({ conf, idx }))
      .filter(item => item.conf >= threshold)
      .map(item => item.idx);

    const totalPredictions = predictions.length;
    const highConfidenceCount = highConfidenceIndices.length;
    
    if (highConfidenceCount === 0) {
      // Calculate overall accuracy even when no high-confidence predictions
      const overallCorrect = predictions.reduce((sum, pred, idx) => 
        sum + (pred === trueLabels[idx] ? 1 : 0), 0);
      const overallAccuracy = overallCorrect / totalPredictions;
      
      return {
        threshold,
        total_predictions: totalPredictions,
        high_confidence_count: 0,
        high_confidence_accuracy: 0,
        high_confidence_confusion_matrix: [[0, 0], [0, 0]],
        class_breakdown: {
          class_0: { correct: 0, total: 0, accuracy: 0 },
          class_1: { correct: 0, total: 0, accuracy: 0 }
        },
        coverage_percentage: 0,
        precision_improvement: 0,
        overall_accuracy: overallAccuracy
      };
    }

    // Use real ground truth labels from the backend
    const groundTruth = trueLabels;

    // Calculate high-confidence accuracy
    let correctHighConfidence = 0;
    const highConfidenceConfusionMatrix = [[0, 0], [0, 0]];
    const classBreakdown = {
      class_0: { correct: 0, total: 0 },
      class_1: { correct: 0, total: 0 }
    };

    highConfidenceIndices.forEach(idx => {
      const predicted = predictions[idx];
      const actual = groundTruth[idx];
      
      if (predicted === actual) {
        correctHighConfidence++;
      }
      
      // Update confusion matrix
      highConfidenceConfusionMatrix[actual][predicted]++;
      
      // Update class breakdown
      const classKey = `class_${actual}`;
      classBreakdown[classKey].total++;
      if (predicted === actual) {
        classBreakdown[classKey].correct++;
      }
    });

    // Calculate class accuracies
    Object.keys(classBreakdown).forEach(classKey => {
      const classData = classBreakdown[classKey];
      classData.accuracy = classData.total > 0 ? classData.correct / classData.total : 0;
    });

    const highConfidenceAccuracy = correctHighConfidence / highConfidenceCount;
    const coveragePercentage = (highConfidenceCount / totalPredictions) * 100;
    
    // Calculate overall accuracy for comparison
    const overallCorrect = predictions.reduce((sum, pred, idx) => 
      sum + (pred === groundTruth[idx] ? 1 : 0), 0);
    const overallAccuracy = overallCorrect / totalPredictions;
    const precisionImprovement = ((highConfidenceAccuracy - overallAccuracy) / overallAccuracy) * 100;

    return {
      threshold,
      total_predictions: totalPredictions,
      high_confidence_count: highConfidenceCount,
      high_confidence_accuracy: highConfidenceAccuracy,
      high_confidence_confusion_matrix: highConfidenceConfusionMatrix,
      class_breakdown: classBreakdown,
      coverage_percentage: coveragePercentage,
      precision_improvement: precisionImprovement,
      overall_accuracy: overallAccuracy
    };
  };

  // Prepare high-confidence confusion matrix data for Plotly
  const getHighConfidenceConfusionMatrixData = () => {
    if (!confidenceAnalysis?.high_confidence_confusion_matrix) return null;
    
    const cm = confidenceAnalysis.high_confidence_confusion_matrix;
    
    // Custom color scale matching Stella's purple gradient theme
    const stellaColorScale = [
      [0, '#B197FC'],  // lilac with enough depth for white
      [0.2, '#9D6CFA'], // soft purple
      [0.4, '#864CFA'], // medium purple
      [0.6, '#7137EB'], // strong purple
      [0.8, '#5B26D4'], // dark violet
      [1, '#3C1375']    // near violet-black
    ];
    
    // Calculate percentages for better understanding
    const total = cm.flat().reduce((sum, val) => sum + val, 0);
    const percentages = total > 0 ? cm.map(row => 
      row.map(val => ((val / total) * 100).toFixed(1))
    ) : [[0, 0], [0, 0]];
    
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
      colorbar: {
        title: {
          text: language === 'fr' ? 'Prédictions<br>Haute Confiance' : 'High-Confidence<br>Predictions',
          font: { size: 12, color: 'rgba(75, 85, 99, 1)' }
        },
        tickfont: { color: 'rgba(75, 85, 99, 1)' },
        bgcolor: 'rgba(255, 255, 255, 0.1)',
        bordercolor: 'rgba(255, 255, 255, 0.2)',
        borderwidth: 1
      },
      text: cm.map((row, i) => 
        row.map((val, j) => total > 0 ? `${val}<br>(${percentages[i][j]}%)` : '0<br>(0%)')
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
  };

  if (!modelResults?.probabilities) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {analysisError && (
        <div className="backdrop-blur-lg shadow-lg bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-800 font-semibold mb-2">
                {language === 'fr' ? 'Erreur d\'analyse' : 'Analysis Error'}
              </h4>
              <p className="text-red-700 text-sm">{analysisError}</p>
              <button
                onClick={() => setAnalysisError(null)}
                className="mt-3 inline-flex items-center space-x-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 text-sm"
              >
                <span>{language === 'fr' ? 'Fermer' : 'Dismiss'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Confidence Threshold */}
        <div className="backdrop-blur-lg shadow-lg bg-white/10 border border-white/20 rounded-3xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {language === 'fr' ? 'Seuil de Confiance' : 'Confidence Threshold'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'fr' ? 'Ajustement en temps réel' : 'Real-time adjustment'}
              </p>
            </div>
          </div>

          <div className="bg-gray-100 border border-white/10 rounded-2xl p-6">
            <Slider
              label={language === 'fr' ? "Seuil de confiance minimum" : "Minimum confidence threshold"}
              value={confidenceThreshold}
              min={0.5}
              max={1.0}
              step={0.01}
              onChange={handleThresholdChange}
              help={language === 'fr' 
                ? "Seules les prédictions avec une confiance supérieure à ce seuil seront conservées"
                : "Only predictions with confidence above this threshold will be kept"
              }
              formatValue={(value) => `${(value * 100).toFixed(0)}%`}
            />
          </div>
          {/* Comparison with Overall Performance */}
          {confidenceAnalysis && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="backdrop-blur-lg shadow-lg bg-gray-100 border border-blue-500/20 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    {language === 'fr' ? '📊 Performance Globale' : '📊 Overall Performance'}
                  </h4>
                  <p className="text-xs text-gray-700">
                    {language === 'fr' ? 'Précision:' : 'Accuracy:'} {' '}
                    <span className="font-mono text-blue-600">
                      {(confidenceAnalysis.overall_accuracy * 100).toFixed(1)}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {language === 'fr' ? 'Toutes les prédictions' : 'All predictions'}
                  </p>
                </div>
                
                <div className="backdrop-blur-lg shadow-lg bg-gray-100 border border-purple-500/20 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2">
                    {language === 'fr' ? '🎯 Performance Filtrée' : '🎯 Filtered Performance'}
                  </h4>
                  <p className="text-xs text-gray-700">
                    {language === 'fr' ? 'Précision:' : 'Accuracy:'} {' '}
                    <span className="font-mono text-purple-600">
                      {(confidenceAnalysis.high_confidence_accuracy * 100).toFixed(1)}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {language === 'fr' ? 'Haute confiance uniquement' : 'High confidence only'}
                  </p>
                </div>
              </div>
          )}
        </div>

        {/* High-Confidence Confusion Matrix */}
        {confidenceAnalysis && confidenceAnalysis.high_confidence_count > 0 && (
          <div className="backdrop-blur-lg shadow-lg bg-white/10 border border-white/20 rounded-3xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {language === 'fr' ? 'Matrice de Confusion - Haute Confiance' : 'High-Confidence Confusion Matrix'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? `Seuil: ${(confidenceThreshold * 100).toFixed(0)}% - ${confidenceAnalysis.high_confidence_count} prédictions`
                    : `Threshold: ${(confidenceThreshold * 100).toFixed(0)}% - ${confidenceAnalysis.high_confidence_count} predictions`
                  }
                </p>
              </div>
            </div>
            
            <PlotlyChart
              data={getHighConfidenceConfusionMatrixData()}
              layout={{
                title: '',
                xaxis: { 
                  title: {
                    text: language === 'fr' ? 'Classe Prédite (Haute Confiance)' : 'Predicted Class (High Confidence)',
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
                displayModeBar: false,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'zoom2d'],
                responsive: true
              }}
              className="w-full h-96"
            />
          </div>
        )}
      </div>
      {/* Real-time Metrics */}
      {confidenceAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-spans-2 gap-6">
          {/* High-Confidence Count */}
          <div className="backdrop-blur-lg shadow-lg bg-white/10 border border-white/20 rounded-3xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isAnalyzing ? (
                <div className="animate-pulse">...</div>
              ) : (
                confidenceAnalysis.high_confidence_count
              )}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'fr' ? 'Prédictions Haute Confiance' : 'High-Confidence Predictions'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr' ? 'sur' : 'out of'} {confidenceAnalysis.total_predictions}
            </p>
          </div>

          {/* Coverage Percentage */}
          <div className="backdrop-blur-lg shadow-lg bg-white/10 border border-white/20 rounded-3xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isAnalyzing ? (
                <div className="animate-pulse">...</div>
              ) : (
                `${confidenceAnalysis.coverage_percentage.toFixed(1)}%`
              )}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'fr' ? 'Couverture' : 'Coverage'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr' ? 'du dataset total' : 'of total dataset'}
            </p>
          </div>

          {/* High-Confidence Accuracy */}
          <div className="backdrop-blur-lg shadow-lg bg-white/10 border border-white/20 rounded-3xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isAnalyzing ? (
                <div className="animate-pulse">...</div>
              ) : (
                `${(confidenceAnalysis.high_confidence_accuracy * 100).toFixed(1)}%`
              )}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'fr' ? 'Précision Filtrée' : 'Filtered Accuracy'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr' ? 'haute confiance' : 'high confidence'}
            </p>
          </div>

          {/* Precision Improvement */}
          <div className="backdrop-blur-lg shadow-lg bg-white/10 border border-white/20 rounded-3xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isAnalyzing ? (
                <div className="animate-pulse">...</div>
              ) : (
                `+${confidenceAnalysis.precision_improvement.toFixed(1)}%`
              )}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'fr' ? 'Amélioration' : 'Improvement'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr' ? 'vs modèle global' : 'vs overall model'}
            </p>
          </div>
        </div>
      )}

      
        </div>
  );
}