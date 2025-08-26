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

    console.log('🔍 [API Route] Proxying LangSmith request for session:', sessionId);

    // Proxy the request to the backend with a longer timeout
    const backendUrl = `http://localhost:8000/langsmith-trace/${sessionId}`;
    
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
      
      return NextResponse.json(data);

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