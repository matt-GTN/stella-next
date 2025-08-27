import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://app-stella-backend:8000';
    
    console.log(`🔗 [LangSmith API] Fetching trace for session: ${sessionId}`);
    console.log(`🔗 [LangSmith API] Backend URL: ${backendUrl}`);
    
    // Get query parameters for run_id if provided
    const url = new URL(request.url);
    const runId = url.searchParams.get('run_id');
    
    // Build backend URL with optional run_id parameter
    let backendApiUrl = `${backendUrl}/langsmith-trace/${sessionId}`;
    if (runId) {
      backendApiUrl += `?run_id=${runId}`;
    }
    
    const response = await fetch(backendApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 [LangSmith API] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [LangSmith API] Backend error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({
          error: `Backend API error: ${response.status}`,
          details: errorText
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    console.log(`✅ [LangSmith API] Successfully fetched trace data for session: ${sessionId}`);
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('LangSmith trace API error:', error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch LangSmith trace data",
        details: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Pour les requêtes OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}