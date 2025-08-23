/**
 * Configuration de l'API pour les appels backend
 */

// Base URL de l'API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Endpoints de l'API
export const API_ENDPOINTS = {
  CHAT: '/chat',
  CHAT_STREAM: '/chat/stream',
  LANGSMITH_TRACE: '/langsmith-trace',
  ANIMATION_FRAMES: '/animation-frames', // deprecated
  HEALTH: '/health'
};

/**
 * Construit l'URL complète pour un endpoint
 * @param {string} endpoint - Nom de l'endpoint
 * @param {string} param - Paramètre optionnel (ex: session_id)
 * @returns {string} URL complète
 */
export function buildApiUrl(endpoint, param = null) {
  const baseUrl = API_BASE_URL;
  const endpointPath = API_ENDPOINTS[endpoint];
  
  if (!endpointPath) {
    throw new Error(`Endpoint inconnu: ${endpoint}`);
  }
  
  if (param) {
    return `${baseUrl}${endpointPath}/${param}`;
  }
  
  return `${baseUrl}${endpointPath}`;
}

/**
 * Configuration par défaut pour les requêtes fetch
 */
export const DEFAULT_FETCH_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Pour les cookies de session si nécessaire
};