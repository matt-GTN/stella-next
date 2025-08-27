/**
 * Smart backend URL detection for both local development and Docker deployment
 */

/**
 * Get the appropriate backend URL based on the environment
 */
export function getBackendUrl() {
  // In browser (client-side), use the public environment variable
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  }
  
  // On server-side, try multiple detection methods
  const explicitUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (explicitUrl) {
    // If it's a Docker internal hostname, check if we can reach it
    if (explicitUrl.includes('app-stella-backend')) {
      return explicitUrl;
    }
    return explicitUrl;
  }
  
  // Auto-detect based on environment
  if (process.env.NODE_ENV === 'production') {
    return process.env.DOCKER_INTERNAL_BACKEND || 'http://app-stella-backend:8000';
  }
  
  return 'http://localhost:8000';
}

/**
 * Test if a backend URL is reachable
 */
export async function testBackendConnection(url, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`Backend connection test failed for ${url}:`, error.message);
    return false;
  }
}

/**
 * Get the best available backend URL by testing multiple options
 */
export async function getBestBackendUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.BACKEND_URL,
    'http://localhost:8000',
    'http://app-stella-backend:8000',
  ].filter(Boolean);
  
  const uniqueCandidates = [...new Set(candidates)];
  console.log('🔍 Testing backend URLs:', uniqueCandidates);
  
  for (const url of uniqueCandidates) {
    const isReachable = await testBackendConnection(url, 3000);
    if (isReachable) {
      console.log(`✅ Backend URL working: ${url}`);
      return url;
    }
  }
  
  const fallback = uniqueCandidates[0] || 'http://localhost:8000';
  console.warn(`⚠️ No backend URLs reachable, using fallback: ${fallback}`);
  return fallback;
}