// Test pour vérifier que les outils se réinitialisent correctement entre les sessions

// Simulation de la fonction useToolUniverse modifiée
function useToolUniverse(toolCalls, allTools, sessionId, isLangSmithData) {
  // Pour les données LangSmith, ne pas utiliser toolUniverse
  if (isLangSmithData) {
    console.log(`Session ${sessionId}: LangSmith data - returning empty tool universe`);
    return [];
  }

  const names = new Set();

  // Add from toolCalls - seulement les outils réellement utilisés dans cette session
  for (const tc of Array.isArray(toolCalls) ? toolCalls : []) {
    const n = tc?.name || tc?.tool_name;
    if (n) names.add(n);
  }

  const result = Array.from(names);
  console.log(`Session ${sessionId}: Legacy data - tool universe:`, result);
  return result;
}

// Test avec différentes sessions
console.log('=== Test de réinitialisation des outils ===');

// Session 1 avec des outils
const session1Tools = [
  { name: 'fetch_data' },
  { name: 'analyze_risks' }
];
const universe1 = useToolUniverse(session1Tools, [], 'session-1', false);

// Session 2 avec d'autres outils (données LangSmith)
const session2Tools = [
  { name: 'preprocess_data' },
  { name: 'generate_chart' }
];
const universe2 = useToolUniverse(session2Tools, [], 'session-2', true);

// Session 3 avec encore d'autres outils (legacy)
const session3Tools = [
  { name: 'fetch_news' }
];
const universe3 = useToolUniverse(session3Tools, [], 'session-3', false);

console.log('\n=== Résultats ===');
console.log('Session 1 (legacy):', universe1);
console.log('Session 2 (LangSmith):', universe2);
console.log('Session 3 (legacy):', universe3);

console.log('\n=== Vérification ===');
console.log('Session 2 devrait être vide (LangSmith):', universe2.length === 0 ? '✅' : '❌');
console.log('Session 1 et 3 ne devraient pas se mélanger:', 
  !universe1.includes('fetch_news') && !universe3.includes('fetch_data') ? '✅' : '❌');