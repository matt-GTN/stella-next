/**
 * Wrapper pour la visualisation du graphique qui gère automatiquement
 * les données LangSmith et les données legacy
 */

import React, { useState, useEffect } from 'react';
import AgentDecisionDAG from './AgentDecisionDAG';
import { hasLangSmithTrace, getLangSmithGraphData } from './langsmithTransformer';
import { transformWorkflowDataSync } from './workflowTransformer';

const GraphVisualizationWrapper = ({ 
  message, 
  currentStep = -1, 
  language = 'en',
  sessionId = null 
}) => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('unknown');

  useEffect(() => {
    const loadGraphData = async () => {
      console.log('🔍 [GraphWrapper] Début du chargement des données graphique');
      console.log('🔍 [GraphWrapper] Message:', message?.id, 'SessionId:', sessionId);
      
      setLoading(true);
      setError(null);

      try {
        // Déterminer l'ID de session
        const effectiveSessionId = sessionId || message?.sessionId || message?.id;
        console.log('🔍 [GraphWrapper] ID de session effectif:', effectiveSessionId);
        
        if (!effectiveSessionId) {
          throw new Error('Aucun ID de session disponible');
        }

        // Essayer d'abord les données LangSmith
        try {
          console.log('🔍 [GraphWrapper] Tentative de récupération des données LangSmith...');
          const langsmithGraphData = await getLangSmithGraphData(effectiveSessionId, currentStep, language);
          console.log('✅ [GraphWrapper] Données LangSmith récupérées:', langsmithGraphData);
          setGraphData(langsmithGraphData);
          setDataSource('langsmith');
          setLoading(false);
          return;
        } catch (langsmithError) {
          console.warn('⚠️ [GraphWrapper] Impossible de récupérer les données LangSmith:', langsmithError.message);
          console.warn('⚠️ [GraphWrapper] Fallback vers les données legacy');
        }

        // Fallback vers les données legacy du message
        console.log('📋 [GraphWrapper] Utilisation des données legacy pour la visualisation');
        console.log('📋 [GraphWrapper] Tool calls disponibles:', message?.toolCalls?.length || 0);
        
        if (!message?.toolCalls || !Array.isArray(message.toolCalls)) {
          throw new Error('Aucune donnée de tool calls disponible dans le message');
        }

        const legacyGraphData = transformWorkflowDataSync(message.toolCalls, currentStep, language);
        console.log('📋 [GraphWrapper] Données legacy transformées:', legacyGraphData);
        setGraphData(legacyGraphData);
        setDataSource('legacy');

      } catch (err) {
        console.error('❌ [GraphWrapper] Erreur lors du chargement des données du graphique:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadGraphData();
  }, [message, currentStep, language, sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Chargement de la visualisation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div>
            <h4 className="text-red-800 font-medium">Erreur de visualisation</h4>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Aucune donnée de graphique disponible</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Indicateur de source de données (en développement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 z-10">
          <span className={`px-2 py-1 text-xs rounded ${
            dataSource === 'langsmith' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {dataSource === 'langsmith' ? 'LangSmith' : 'Legacy'}
          </span>
        </div>
      )}
      
      <AgentDecisionDAG 
        graphData={graphData}
        currentStep={currentStep}
        language={language}
      />
    </div>
  );
};

export default GraphVisualizationWrapper;