import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, session_id, stream: enableStreaming = false } = await request.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Si streaming n'est pas demandé, utiliser l'ancienne méthode
    if (!enableStreaming) {
      return handleNonStreamingRequest(message, session_id);
    }

    // Configuration SSE
    const encoder = new TextEncoder();
    let controller;
    
    const responseStream = new ReadableStream({
      start(streamController) {
        controller = streamController;
      },
      cancel() {
        // Nettoyage si nécessaire
      }
    });

    // Fonction pour envoyer des données SSE
    const sendSSE = (data, event = 'message') => {
      const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(sseData));
    };

    // Démarrer le streaming en arrière-plan
    handleStreamingRequest(message, session_id, sendSSE, controller);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return new Response(
      JSON.stringify({
        response: "Je rencontre actuellement des difficultés techniques. Veuillez réessayer dans quelques instants.",
        error: true
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Fonction pour les requêtes non-streaming (fallback)
async function handleNonStreamingRequest(message, session_id) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, session_id }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        response: data.response || data.message || "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date().toISOString(),
        streaming: false,
        // pass-through attachments so the frontend can render
        has_chart: !!data.has_chart,
        chart_data: data.chart_data || null,
        has_dataframe: !!data.has_dataframe,
        dataframe_data: data.dataframe_data || null,
        has_news: !!data.has_news,
        news_data: data.news_data || null,
        has_profile: !!data.has_profile,
        profile_data: data.profile_data || null
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    throw error;
  }
}

// Fonction pour gérer le streaming
async function handleStreamingRequest(message, session_id, sendSSE, controller) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    // Appeler l'endpoint SSE réel du backend
    const response = await fetch(`${backendUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ 
        message: message,
        session_id: session_id // Transmettre l'ID de session au backend
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend streaming API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    // Lire le flux SSE du backend et le retransmettre
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Garder la ligne incomplète

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = line.slice(6).trim();
              
              // Si c'est un message de fin
              if (eventData === '[DONE]') {
                sendSSE({ type: 'done' });
                return;
              }
              
              // Parser les données JSON du backend
              const parsedData = JSON.parse(eventData);
              
              // Retransmettre les données telles quelles au frontend
              // Le backend envoie déjà le bon format
              sendSSE(parsedData);
              
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError, 'Raw line:', line);
              // Continuer même en cas d'erreur de parsing
            }
          } else if (line.trim() === '') {
            // Ligne vide, continuer
            continue;
          } else if (line.startsWith('event: ')) {
            // Gérer les événements spéciaux si nécessaire
            const eventType = line.slice(7).trim();
            console.log('SSE Event type:', eventType);
          }
        }
      }
      
      // Si on arrive ici sans message de fin explicite
      sendSSE({ type: 'done' });
      
    } finally {
      reader.releaseLock();
    }
    
  } catch (error) {
    console.error('Streaming error:', error);
    
    // Envoyer un message d'erreur en streaming
    const errorText = "❌ Désolée, une erreur s'est produite. Veuillez réessayer dans quelques instants.";
    const words = errorText.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      sendSSE({
        chunk: currentText,
        type: 'error'
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    sendSSE({ type: 'done' });
  } finally {
    controller.close();
  }
}

// Pour les requêtes OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
