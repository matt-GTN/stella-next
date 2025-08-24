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
      console.log('🔍 [GraphWrapper] ===== LOADING GRAPH DATA =====');
      console.log('🔍 [GraphWrapper] Message ID:', message?.id);
      console.log('🔍 [GraphWrapper] Session ID:', sessionId);
      console.log('🔍 [GraphWrapper] Tool calls:', message?.toolCalls?.length || 0);
      console.log('🔍 [GraphWrapper] Content preview:', (message?.content || message?.initialContent || '').substring(0, 50));
      
      setLoading(true);
      setError(null);

      try {
        // Each message should have its own unique identifier for trace visualization
        const messageId = message?.id;
        const effectiveSessionId = sessionId || message?.sessionId || messageId;
        
        console.log('🔍 [GraphWrapper] ID de session effectif:', effectiveSessionId);
        console.log('🔍 [GraphWrapper] Message ID:', messageId);
        
        if (!effectiveSessionId && !messageId) {
          throw new Error('Aucun identifiant de message disponible');
        }

        // Try LangSmith data first, but use message-specific session ID
        // This ensures each message gets its own trace visualization
        let langsmithSuccess = false;
        
        if (effectiveSessionId) {
          try {
            console.log('🔍 [GraphWrapper] Tentative de récupération des données LangSmith pour:', effectiveSessionId);
            // Pass message data to ensure unique caching per message
            const langsmithGraphData = await getLangSmithGraphData(effectiveSessionId, currentStep, language, message);
            
            // Verify we got valid data with nodes
            if (langsmithGraphData && langsmithGraphData.nodes && langsmithGraphData.nodes.length > 0) {
              console.log('✅ [GraphWrapper] Données LangSmith récupérées avec succès pour message:', messageId, {
                nodes: langsmithGraphData.nodes.length,
                edges: langsmithGraphData.edges.length
              });
              setGraphData(langsmithGraphData);
              setDataSource('langsmith');
              langsmithSuccess = true;
            } else {
              console.warn('⚠️ [GraphWrapper] Données LangSmith vides ou invalides pour message:', messageId);
            }
          } catch (langsmithError) {
            console.warn('⚠️ [GraphWrapper] Erreur LangSmith pour message:', messageId, langsmithError.message);
            
            // Check if it's a timeout error specifically
            if (langsmithError.message.includes('timeout') || langsmithError.message.includes('Timeout')) {
              console.warn('⏰ [GraphWrapper] Timeout détecté - fallback immédiat vers les données legacy');
            } else {
              console.warn('⚠️ [GraphWrapper] Autre erreur LangSmith - fallback vers les données legacy');
            }
          }
        }

        // If LangSmith failed or no session ID, use legacy data from the message
        if (!langsmithSuccess) {
          console.log('📋 [GraphWrapper] Utilisation des données legacy pour la visualisation');
          console.log('📋 [GraphWrapper] Tool calls disponibles:', message?.toolCalls?.length || 0);
          
          // Even if no tool calls, we can still create a basic visualization
          const toolCalls = message?.toolCalls || [];
          
          if (toolCalls.length === 0) {
            console.log('📋 [GraphWrapper] Aucun tool call - création d\'une visualisation basique');
          }

          // Pass message data to ensure unique visualization per message
          const legacyGraphData = transformWorkflowDataSync(toolCalls, currentStep, language, message);
          console.log('📋 [GraphWrapper] Données legacy transformées pour message:', messageId, {
            nodes: legacyGraphData?.nodes?.length || 0,
            edges: legacyGraphData?.edges?.length || 0
          });
          
          if (legacyGraphData && legacyGraphData.nodes && legacyGraphData.nodes.length > 0) {
            setGraphData(legacyGraphData);
            setDataSource('legacy');
          } else {
            throw new Error('Impossible de créer une visualisation pour ce message');
          }
        }

      } catch (err) {
        console.error('❌ [GraphWrapper] Erreur lors du chargement des données du graphique:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent multiple simultaneous requests
    const timeoutId = setTimeout(loadGraphData, 50);
    
    return () => clearTimeout(timeoutId);
  }, [message?.id, currentStep, language, sessionId]); // Use message.id as key dependency

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