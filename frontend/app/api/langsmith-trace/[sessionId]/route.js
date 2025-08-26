import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Extract run_id from query parameters if provided
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('run_id');

    console.log('🔍 [API Route] Proxying LangSmith request for session:', sessionId);
    if (runId) {
      console.log('🎯 [API Route] Specific run ID requested:', runId);
    } else {
      console.log('📋 [API Route] No specific run ID - will use session-based mapping');
    }

    // Proxy the request to the backend with a longer timeout
    let backendUrl = `http://localhost:8000/langsmith-trace/${sessionId}`;
    if (runId) {
      backendUrl += `?run_id=${encodeURIComponent(runId)}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('🔍 [API Route] Backend response:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'No LangSmith trace found for this session' },
            { status: 404 }
          );
        }
        if (response.status === 408) {
          return NextResponse.json(
            { error: 'Timeout retrieving LangSmith traces' },
            { status: 408 }
          );
        }
        return NextResponse.json(
          { error: `Backend error: ${response.status} - ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('✅ [API Route] Data retrieved successfully');
      console.log('🔍 [API Route] User query in response:', data.user_query);
      console.log('🔍 [API Route] Tool calls count:', data.tool_calls?.length || 0);
      console.log('🔍 [API Route] Full response data:', JSON.stringify(data, null, 2));
      
      // Add cache-busting headers
      const response_headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      return NextResponse.json(data, { headers: response_headers });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏰ [API Route] Backend timeout');
        return NextResponse.json(
          { error: 'Backend timeout' },
          { status: 408 }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ [API Route] Error proxying LangSmith request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}