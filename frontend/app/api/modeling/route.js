/**
 * Next.js API route for machine learning model training
 * Integrates with the existing Python backend for RandomForestClassifier training
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { hyperparameters, action = 'train', model_results, threshold, error_indices, retry_count = 0 } = body;

    // Add request logging for debugging
    console.log(`Modeling API request: action=${action}, retry_count=${retry_count}`);

    // Handle different actions
    switch (action) {
      case 'train':
        return await handleModelTraining(hyperparameters, retry_count);
      
      case 'confidence-analysis':
        return await handleConfidenceAnalysis(model_results, threshold);
      
      case 'shap-analysis':
        return await handleShapAnalysis(model_results, error_indices);
      
      case 'clear-cache':
        return await handleClearCache();
      
      case 'health-check':
        return await handleHealthCheck();
      
      default:
        return NextResponse.json(
          { 
            error: 'Invalid action parameter',
            details: `Supported actions: train, confidence-analysis, shap-analysis, clear-cache, health-check. Received: ${action}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Modeling API error:', error);
    
    // Enhanced error categorization
    let statusCode = 500;
    let errorType = 'internal_error';
    
    if (error.name === 'SyntaxError' && error.message && error.message.includes('JSON')) {
      statusCode = 400;
      errorType = 'invalid_json';
    } else if (error.message && error.message.includes('timeout')) {
      statusCode = 408;
      errorType = 'timeout';
    } else if (error.message && (error.message.includes('network') || error.message.includes('fetch'))) {
      statusCode = 503;
      errorType = 'network_error';
    }
    
    return NextResponse.json(
      { 
        error: 'Request failed', 
        error_type: errorType,
        details: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        request_id: Math.random().toString(36).substr(2, 9)
      },
      { status: statusCode }
    );
  }
}

async function handleModelTraining(hyperparameters, retryCount = 0) {
  // Validate hyperparameters
  if (!hyperparameters) {
    return NextResponse.json(
      { 
        error: 'Hyperparameters are required',
        error_type: 'validation_error',
        details: 'Request body must include hyperparameters object'
      },
      { status: 400 }
    );
  }

  // Validate hyperparameter values
  const validationErrors = validateHyperparameters(hyperparameters);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { 
        error: 'Invalid hyperparameters', 
        error_type: 'validation_error',
        details: validationErrors 
      },
      { status: 400 }
    );
  }

  try {
    // Adjust timeout based on retry count and model complexity
    const baseTimeout = 30000; // 30 seconds
    const timeoutMultiplier = Math.min(1 + (retryCount * 0.5), 3); // Max 3x timeout
    const estimatedTrainingTime = hyperparameters.n_estimators * 100; // Rough estimate
    const timeout = Math.max(baseTimeout * timeoutMultiplier, estimatedTrainingTime);

    console.log(`Training request: retry=${retryCount}, timeout=${timeout}ms, n_estimators=${hyperparameters.n_estimators}`);

    // Forward request to Python backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const backendResponse = await fetch(`${BACKEND_URL}/modeling/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hyperparameters,
        action: 'train',
        retry_count: retryCount
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      
      // Categorize backend errors
      let errorType = 'backend_error';
      if (backendResponse.status === 400) errorType = 'validation_error';
      else if (backendResponse.status === 500) errorType = 'server_error';
      else if (backendResponse.status === 503) errorType = 'service_unavailable';
      
      return NextResponse.json(
        { 
          error: 'Backend training failed', 
          error_type: errorType,
          details: errorData.detail || errorData.error || `HTTP ${backendResponse.status}`,
          backend_status: backendResponse.status,
          retry_count: retryCount
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      retry_count: retryCount
    });

  } catch (error) {
    console.error('Training request error:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Training request timed out', 
          error_type: 'timeout',
          details: `Request exceeded ${timeout}ms timeout`,
          retry_count: retryCount,
          suggestion: 'Try reducing n_estimators or increasing timeout'
        },
        { status: 408 }
      );
    }
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to backend', 
          error_type: 'connection_error',
          details: 'Backend server is not reachable',
          backend_url: BACKEND_URL,
          retry_count: retryCount
        },
        { status: 503 }
      );
    }
    
    throw error; // Re-throw unexpected errors
  }
}

async function handleClearCache() {
  try {
    const response = await fetch(`${BACKEND_URL}/modeling/clear-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to clear cache', 
          details: errorData.detail || errorData.error || `HTTP ${response.status}`,
          backend_status: response.status
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function handleHealthCheck() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    return NextResponse.json({
      success: response.ok,
      backend_status: response.status,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Backend unreachable',
      details: error.message,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}



async function handleConfidenceAnalysis(model_results, threshold) {
  // Validate inputs
  if (!model_results) {
    return NextResponse.json(
      { error: 'Model results are required for confidence analysis' },
      { status: 400 }
    );
  }

  if (typeof threshold !== 'number' || threshold < 0.5 || threshold > 1.0) {
    return NextResponse.json(
      { error: 'Threshold must be a number between 0.5 and 1.0' },
      { status: 400 }
    );
  }

  // Forward request to Python backend
  const backendResponse = await fetch(`${BACKEND_URL}/modeling/confidence-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_results,
      threshold
    }),
  });

  if (!backendResponse.ok) {
    const errorData = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(
      { 
        error: 'Backend confidence analysis failed', 
        details: errorData.detail || errorData.error || 'Unknown error',
        status: backendResponse.status
      },
      { status: backendResponse.status }
    );
  }

  const result = await backendResponse.json();
  
  return NextResponse.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  });
}

async function handleShapAnalysis(model_results, error_indices) {
  // Validate inputs
  if (!model_results) {
    return NextResponse.json(
      { error: 'Model results are required for SHAP analysis' },
      { status: 400 }
    );
  }

  if (!Array.isArray(error_indices) || error_indices.length === 0) {
    return NextResponse.json(
      { error: 'Error indices array is required for SHAP analysis' },
      { status: 400 }
    );
  }

  // Forward request to Python backend
  const backendResponse = await fetch(`${BACKEND_URL}/modeling/shap-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_results,
      error_indices
    }),
  });

  if (!backendResponse.ok) {
    const errorData = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(
      { 
        error: 'Backend SHAP analysis failed', 
        details: errorData.detail || errorData.error || 'Unknown error',
        status: backendResponse.status
      },
      { status: backendResponse.status }
    );
  }

  const result = await backendResponse.json();
  
  return NextResponse.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    // Handle different GET actions
    switch (action) {
      case 'status':
        return NextResponse.json({
          status: 'ready',
          backend_url: BACKEND_URL,
          timestamp: new Date().toISOString()
        });
      
      case 'optimal_params':
        return NextResponse.json({
          optimal_hyperparameters: {
            n_estimators: 134,
            max_depth: 10,
            min_samples_leaf: 1,
            max_features: 'log2',
            criterion: 'entropy'
          },
          timestamp: new Date().toISOString()
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Modeling API GET error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Validate hyperparameters according to scikit-learn RandomForestClassifier constraints
 */
function validateHyperparameters(params) {
  const errors = [];

  // n_estimators: positive integer
  if (!Number.isInteger(params.n_estimators) || params.n_estimators < 1) {
    errors.push('n_estimators must be a positive integer');
  }
  if (params.n_estimators > 1000) {
    errors.push('n_estimators should not exceed 1000 for performance reasons');
  }

  // max_depth: positive integer or null
  if (params.max_depth !== null && (!Number.isInteger(params.max_depth) || params.max_depth < 1)) {
    errors.push('max_depth must be a positive integer or null');
  }
  if (params.max_depth && params.max_depth > 50) {
    errors.push('max_depth should not exceed 50 for performance reasons');
  }

  // min_samples_leaf: positive integer or float between 0 and 0.5
  if (typeof params.min_samples_leaf === 'number') {
    if (params.min_samples_leaf < 1 && params.min_samples_leaf <= 0) {
      errors.push('min_samples_leaf must be positive');
    }
    if (params.min_samples_leaf < 1 && params.min_samples_leaf > 0.5) {
      errors.push('min_samples_leaf as fraction must be between 0 and 0.5');
    }
    if (params.min_samples_leaf >= 1 && !Number.isInteger(params.min_samples_leaf)) {
      errors.push('min_samples_leaf as count must be an integer');
    }
  } else {
    errors.push('min_samples_leaf must be a number');
  }

  // max_features: 'sqrt', 'log2', or null
  const validMaxFeatures = ['sqrt', 'log2', null];
  if (!validMaxFeatures.includes(params.max_features)) {
    errors.push('max_features must be "sqrt", "log2", or null');
  }

  // criterion: 'gini' or 'entropy'
  const validCriteria = ['gini', 'entropy'];
  if (!validCriteria.includes(params.criterion)) {
    errors.push('criterion must be "gini" or "entropy"');
  }

  return errors;
}