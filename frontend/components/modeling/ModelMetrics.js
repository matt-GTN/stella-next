"use client";

import { BarChart3, Target, TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";

export default function ModelMetrics({ modelResults, language = 'fr' }) {
  if (!modelResults || !modelResults.classification_report) {
    return null;
  }

  const { accuracy, classification_report } = modelResults;

  // Extract metrics for both classes
  const class0Metrics = classification_report['0'] || {};
  const class1Metrics = classification_report['1'] || {};
  const macroAvg = classification_report['macro avg'] || {};
  const weightedAvg = classification_report['weighted avg'] || {};

  // Format percentage
  const formatPercent = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Get metric icon and color based on performance
  const getMetricStyle = (value, type = 'default') => {
    if (typeof value !== 'number') return { color: 'gray', icon: AlertTriangle };

    const percentage = value * 100;
    if (type === 'accuracy') {
      if (percentage >= 80) return { color: 'emerald', icon: Award };
      if (percentage >= 70) return { color: 'blue', icon: Target };
      return { color: 'orange', icon: AlertTriangle };
    }

    if (percentage >= 85) return { color: 'emerald', icon: TrendingUp };
    if (percentage >= 75) return { color: 'blue', icon: Target };
    if (percentage >= 65) return { color: 'orange', icon: TrendingDown };
    return { color: 'red', icon: AlertTriangle };
  };

  const overallStyle = getMetricStyle(accuracy, 'accuracy');
  const class0PrecisionStyle = getMetricStyle(class0Metrics.precision);
  const class0RecallStyle = getMetricStyle(class0Metrics.recall);
  const class1PrecisionStyle = getMetricStyle(class1Metrics.precision);
  const class1RecallStyle = getMetricStyle(class1Metrics.recall);

  const OverallIcon = overallStyle.icon;
  const Class0PrecisionIcon = class0PrecisionStyle.icon;
  const Class0RecallIcon = class0RecallStyle.icon;
  const Class1PrecisionIcon = class1PrecisionStyle.icon;
  const Class1RecallIcon = class1RecallStyle.icon;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Overall Performance */}
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-${overallStyle.color}-500 to-${overallStyle.color}-600 flex items-center justify-center`}>
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800">
              {language === 'fr' ? 'Performance Globale' : 'Overall Performance'}
            </h3>
            <p className="text-xs md:text-sm text-gray-600">
              {language === 'fr' ? 'Métriques générales du modèle' : 'General model metrics'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {/* Overall Accuracy */}
          <div className="text-center">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-r from-${overallStyle.color}-500 to-${overallStyle.color}-600 flex items-center justify-center mx-auto mb-2 md:mb-3`}>
              <OverallIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="text-xl md:text-2xl font-bold text-gray-800">
              {formatPercent(accuracy)}
            </h4>
            <p className="text-gray-600 text-xs md:text-sm">
              {language === 'fr' ? 'Précision Globale' : 'Overall Accuracy'}
            </p>
          </div>

          {/* Macro Average F1 */}
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="text-xl md:text-2xl font-bold text-gray-800">
              {formatPercent(macroAvg['f1-score'])}
            </h4>
            <p className="text-gray-600 text-xs md:text-sm">
              {language === 'fr' ? 'F1-Score Macro' : 'Macro F1-Score'}
            </p>
          </div>

          {/* Weighted Average F1 */}
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="text-xl md:text-2xl font-bold text-gray-800">
              {formatPercent(weightedAvg['f1-score'])}
            </h4>
            <p className="text-gray-600 text-xs md:text-sm">
              {language === 'fr' ? 'F1-Score Pondéré' : 'Weighted F1-Score'}
            </p>
          </div>
        </div>
      </div>

      {/* Class-Specific Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Class 0 (Under-performing) */}
        <div className="backdrop-blur-sm bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-semibold text-gray-800">
                {language === 'fr' ? 'Classe 0' : 'Class 0 - Under-performing'}
              </h4>
              <p className="text-xs md:text-sm text-gray-600">
                {language === 'fr' ? 'Actions à risque élevé' : 'High-risk stocks'}
              </p>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Class0PrecisionIcon className={`w-3 h-3 md:w-4 md:h-4 text-${class0PrecisionStyle.color}-600`} />
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  {language === 'fr' ? 'Précision' : 'Precision'}
                </span>
              </div>
              <span className={`font-mono text-base md:text-lg font-bold text-${class0PrecisionStyle.color}-600`}>
                {formatPercent(class0Metrics.precision)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Class0RecallIcon className={`w-3 h-3 md:w-4 md:h-4 text-${class0RecallStyle.color}-600`} />
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  {language === 'fr' ? 'Rappel' : 'Recall'}
                </span>
              </div>
              <span className={`font-mono text-base md:text-lg font-bold text-${class0RecallStyle.color}-600`}>
                {formatPercent(class0Metrics.recall)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                <span className="text-gray-700 font-medium text-sm md:text-base">F1-Score</span>
              </div>
              <span className="font-mono text-base md:text-lg font-bold text-purple-600">
                {formatPercent(class0Metrics['f1-score'])}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <span className="text-gray-600 text-xs md:text-sm">
                {language === 'fr' ? 'Support' : 'Support'}
              </span>
              <span className="font-mono text-xs md:text-sm text-gray-600">
                {class0Metrics.support || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Class 1 (Out-performing) */}
        <div className="backdrop-blur-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-semibold text-gray-800">
                {language === 'fr' ? 'Classe 1' : 'Class 1 - Out-performing'}
              </h4>
              <p className="text-xs md:text-sm text-gray-600">
                {language === 'fr' ? 'Actions performantes' : 'High-performing stocks'}
              </p>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Class1PrecisionIcon className={`w-3 h-3 md:w-4 md:h-4 text-${class1PrecisionStyle.color}-600`} />
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  {language === 'fr' ? 'Précision' : 'Precision'}
                </span>
              </div>
              <span className={`font-mono text-base md:text-lg font-bold text-${class1PrecisionStyle.color}-600`}>
                {formatPercent(class1Metrics.precision)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Class1RecallIcon className={`w-3 h-3 md:w-4 md:h-4 text-${class1RecallStyle.color}-600`} />
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  {language === 'fr' ? 'Rappel' : 'Recall'}
                </span>
              </div>
              <span className={`font-mono text-base md:text-lg font-bold text-${class1RecallStyle.color}-600`}>
                {formatPercent(class1Metrics.recall)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                <span className="text-gray-700 font-medium text-sm md:text-base">F1-Score</span>
              </div>
              <span className="font-mono text-base md:text-lg font-bold text-purple-600">
                {formatPercent(class1Metrics['f1-score'])}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <span className="text-gray-600 text-xs md:text-sm">
                {language === 'fr' ? 'Support' : 'Support'}
              </span>
              <span className="font-mono text-xs md:text-sm text-gray-600">
                {class1Metrics.support || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="backdrop-blur-sm bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs md:text-sm font-bold">💡</span>
          </div>
          <h4 className="text-base md:text-lg font-semibold text-gray-800">
            {language === 'fr' ? 'Analyse des Performances' : 'Performance Analysis'}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
          <div>
            <p className="text-gray-700 leading-relaxed">
              {language === 'fr'
                ? `La précision globale de ${formatPercent(accuracy)} indique une performance ${accuracy >= 0.75 ? 'solide' : accuracy >= 0.65 ? 'modérée' : 'faible'} du modèle.`
                : `The overall accuracy of ${formatPercent(accuracy)} indicates ${accuracy >= 0.75 ? 'solid' : accuracy >= 0.65 ? 'moderate' : 'poor'} model performance.`
              }
            </p>
          </div>
          <div>
            <p className="text-gray-700 leading-relaxed">
              {language === 'fr'
                ? `La classe 0 (sous-performance) montre une précision de ${formatPercent(class0Metrics.precision)}, cruciale pour l'identification des risques.`
                : `Class 0 (under-performing) shows ${formatPercent(class0Metrics.precision)} precision, crucial for risk identification.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}