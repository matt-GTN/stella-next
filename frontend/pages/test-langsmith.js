/**
 * Page de test pour l'intégration LangSmith
 */

import { useState } from 'react';
import { GraphVisualizationWrapper } from '../components/visualization/graph';

export default function TestLangSmith() {
  const [sessionId, setSessionId] = useState('7c610a4e-1ee9-4858-acab-47a375b10c43');
  const [mockMessage, setMockMessage] = useState({
    id: '7c610a4e-1ee9-4858-acab-47a375b10c43',
    sessionId: '7c610a4e-1ee9-4858-acab-47a375b10c43',
    toolCalls: [
      {
        name: 'fetch_data',
        arguments: { ticker: 'GOOGL' },
        status: 'completed'
      },
      {
        name: 'preprocess_data',
        arguments: {},
        status: 'completed'
      },
      {
        name: 'analyze_risks',
        arguments: {},
        status: 'completed'
      }
    ]
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Intégration LangSmith</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Session ID:
        </label>
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="border rounded px-3 py-2 w-64"
          placeholder="test-mock"
        />
      </div>

      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="text-lg font-semibold mb-4">Graphique de Visualisation</h2>
        <GraphVisualizationWrapper
          message={mockMessage}
          sessionId={sessionId}
          language="fr"
        />
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>Ouvre la console (F12) pour voir les logs de debug.</p>
        <p>Le badge en haut à droite indique la source des données :</p>
        <ul className="list-disc list-inside mt-2">
          <li><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">LangSmith</span> = Données de trace LangSmith</li>
          <li><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Legacy</span> = Données du message (fallback)</li>
        </ul>
        
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="font-medium mb-2">Session de test actuelle:</h3>
          <p><strong>Thread ID:</strong> {sessionId}</p>
          <p><strong>Execution Path:</strong> agent → execute_tool → generate_final_response → cleanup_state</p>
          <p><strong>Tool Calls:</strong> fetch_data, preprocess_data, analyze_risks (GOOGL)</p>
        </div>
      </div>
    </div>
  );
}