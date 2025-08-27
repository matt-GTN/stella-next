"use client";

import { useState } from "react";
import ChatNavbar from "@/components/chat/ChatNavbar";
import ChatContainer from "@/components/chat/ChatContainer";
import ThreadsBackground from '@/components/backgrounds/ThreadsBackground';
import GitHubButton from '@/components/GitHubButton';


/**
 * Page d'accueil principale de l'application Stella
 * Gère l'interface de chat avec l'assistant financier IA
 */
export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-message-1',
      type: 'assistant',
      content: "👋 Bonjour ! Je suis **Stella**, une assitance IA d'analyse financière. Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date(),
      toolCalls: [],
      initialContent: '',
      finalContent: '',
      phases: [],
      isStreaming: false,
      isProcessing: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationSessionId, setConversationSessionId] = useState(null); // Session ID persistante pour la conversation
  const [messageCounter, setMessageCounter] = useState(2); // Compteur pour les IDs de messages

  /**
   * Envoie un message à l'assistant Stella et gère la réponse en streaming
   * @param {string} content - Contenu du message utilisateur
   */
  const sendMessage = async (content) => {
    // Générer des IDs uniques et séquentiels
    const userMessageId = `user-${messageCounter}`;
    const assistantMessageId = `assistant-${messageCounter + 1}`;
    
    // Generate or use existing conversation session ID for agent memory
    const currentConversationSessionId = conversationSessionId || `conversation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Generate unique message session ID for graph visualization
    const messageSessionId = `message_${assistantMessageId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Set conversation session ID if it's the first message
    if (!conversationSessionId) {
      setConversationSessionId(currentConversationSessionId);
    }

    console.log('🔍 [Page] Sending message with dual session system:', {
      userMessageId,
      assistantMessageId,
      currentMessageCounter: messageCounter,
      conversationSessionId: currentConversationSessionId,
      messageSessionId,
      content: content.substring(0, 50) + '...'
    });

    // Ajouter le message utilisateur
    const userMessage = {
      id: userMessageId,
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Créer un message assistant vide qui va être rempli progressivement
    const initialAssistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      isProcessing: true, // Activer le spinner immédiatement
      statusMessage: null,
      phases: [], // Historique des phases de traitement
      toolCalls: [], // Initialiser le tableau des appels d'outils
      initialContent: '',
      finalContent: '',
      sessionId: messageSessionId, // Unique session ID for graph visualization
      conversationSessionId: currentConversationSessionId // Persistent session ID for agent memory
    };

    setMessages(prev => [...prev, initialAssistantMessage]);
    setIsLoading(false);

    // Incrémenter le compteur pour les prochains messages
    setMessageCounter(prev => {
      const newCounter = prev + 2;
      console.log('🔍 [Page] Incrementing messageCounter:', prev, '→', newCounter);
      return newCounter;
    });

    // Add a timeout to prevent getting stuck indefinitely
    const timeoutId = setTimeout(() => {
      console.log('⏰ [Frontend] Timeout reached, stopping processing state');
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              isStreaming: false,
              isProcessing: false,
              content: msg.content || msg.initialContent || msg.finalContent || "❌ Timeout: La réponse a pris trop de temps."
            }
            : msg
        )
      );
    }, 60000); // 60 second timeout

    try {
      // Essayer d'abord le streaming SSE
      const useSSE = true; // Changer à false pour utiliser l'ancienne méthode

      if (useSSE) {
        await handleSSEStreaming(content, assistantMessageId, currentConversationSessionId, messageSessionId);
      } else {
        await handleRegularRequest(content, assistantMessageId, currentConversationSessionId, messageSessionId);
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);

      // Message d'erreur
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: "❌ Désolée, une erreur s'est produite. Veuillez réessayer dans quelques instants.",
              isStreaming: false,
              isProcessing: false // Arrêter le spinner
            }
            : msg
        )
      );
    }
  };

  // Fonction pour gérer le streaming SSE
  const handleSSEStreaming = async (content, assistantMessageId, conversationSessionId, messageSessionId) => {
    console.log('🚀 [Frontend] Starting SSE streaming request...');
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content,
        session_id: conversationSessionId, // Use persistent conversation session ID for agent memory
        message_session_id: messageSessionId, // Include message session ID for graph visualization
        stream: true
      }),
    });

    console.log(`📡 [Frontend] API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Frontend] API error: ${response.status} - ${errorText}`);
      throw new Error('Erreur réseau');
    }

    console.log('✅ [Frontend] Starting to read SSE stream...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Garder la ligne incomplète dans le buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log('📨 [Frontend] Received SSE data:', data.type, data);

            // Gérer l'ID de session
            if (data.type === 'session_id') {
              console.log('Session IDs reçus:', {
                conversation: data.session_id,
                message: data.message_session_id || messageSessionId
              });
              // Update the message with both session IDs
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      sessionId: data.message_session_id || messageSessionId, // Message session ID for graph visualization
                      conversationSessionId: data.session_id, // Conversation session ID from backend
                      backendSessionId: data.session_id // Also store as backup
                    }
                    : msg
                )
              );
            }
            // Gérer les messages de statut (phases de l'agent)
            else if (data.type === 'status') {
              const step = data.step || 'processing';
              console.log('📊 [Frontend] Processing status update:', step);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      isProcessing: true, // Activer le spinner
                      processingStep: step, // Type d'étape en cours
                      phases: (msg.phases || []).concat([{ type: 'status', step, timestamp: new Date() }])
                    }
                    : msg
                )
              );
            }
            // Gérer le contenu initial (avant les tool calls)
            else if (data.type === 'initial_content') {
              const newContent = data.chunk || data.content || data.token || '';
              console.log('📝 [Frontend] Received initial content chunk:', newContent.substring(0, 50));

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      initialContent: (msg.initialContent || '') + newContent,
                      isProcessing: false, // Arrêter le spinner lors du streaming de contenu
                      currentStatus: null, // Effacer le statut en cours lors du streaming de contenu
                      phases: msg.phases // Garder l'historique des phases
                    }
                    : msg
                )
              );
            }
            // Gérer le contenu final (après les tool calls)
            else if (data.type === 'final_content') {
              const newContent = data.chunk || data.content || data.token || '';

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      finalContent: (msg.finalContent || '') + newContent,
                      isProcessing: false, // Arrêter le spinner lors du streaming de contenu
                      currentStatus: null, // Effacer le statut en cours lors du streaming de contenu
                      phases: msg.phases // Garder l'historique des phases
                    }
                    : msg
                )
              );
            }
            // Gérer le contenu streamed réel (réponse du LLM) - fallback pour compatibilité
            else if (data.type === 'content' || data.type === 'token') {
              const newContent = data.chunk || data.content || data.token || '';

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      content: msg.content + newContent,
                      isProcessing: false, // Arrêter le spinner lors du streaming de contenu
                      currentStatus: null, // Effacer le statut en cours lors du streaming de contenu
                      phases: msg.phases // Garder l'historique des phases
                    }
                    : msg
                )
              );
            }
            // Gérer les données finales avec attachments (sans contenu pour éviter duplication)
            else if (data.type === 'final_response' || data.type === 'final_message') {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      isStreaming: false,
                      isProcessing: false,
                      has_chart: !!data.has_chart,
                      chart_data: data.chart_data || null,
                      has_dataframe: !!data.has_dataframe,
                      dataframe_data: data.dataframe_data || null,
                      has_news: !!data.has_news,
                      news_data: data.news_data || null,
                      has_profile: !!data.has_profile,
                      profile_data: data.profile_data || null,
                      sessionId: messageSessionId, // Keep message session ID for graph visualization
                      conversationSessionId: conversationSessionId // Maintain conversation session ID
                    }
                    : msg
                )
              );
              return;
            }
            // Gérer la fin du streaming
            else if (data.type === 'done' || data.type === 'finished') {
              console.log('✅ [Frontend] Received done signal, stopping processing');
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      isStreaming: false,
                      isProcessing: false, // Arrêter le spinner 
                      currentStatus: null,
                      phases: (msg.phases || []).concat([{ type: 'done', content: 'Traitement terminé', timestamp: new Date() }])
                    }
                    : msg
                )
              );
              return;
            }
            // Gérer les erreurs
            else if (data.type === 'error') {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                      ...msg,
                      content: data.message || data.error || "❌ Erreur lors de la génération de la réponse.",
                      isStreaming: false,
                      isProcessing: false, // Arrêter le spinner
                      currentStatus: null,
                      phases: (msg.phases || []).concat([{ type: 'error', content: data.message || data.error, timestamp: new Date() }])
                    }
                    : msg
                )
              );
              return;
            }
            // Gérer les appels d'outils
            else if (data.type === 'tool_call' || data.type === 'function_call') {
              console.log('Tool call detected:', data);

              const toolCall = {
                name: data.tool_name || data.function_name || data.name || 'Outil inconnu',
                args: data.args || data.arguments || {}
              };

              setMessages(prev =>
                prev.map(msg => {
                  if (msg.id === assistantMessageId) {
                    // Ensure toolCalls is an array before concatenating
                    const existingToolCalls = Array.isArray(msg.toolCalls) ? msg.toolCalls : [];
                    const existingPhases = Array.isArray(msg.phases) ? msg.phases : [];

                    return {
                      ...msg,
                      toolCalls: existingToolCalls.concat([toolCall]),
                      phases: existingPhases.concat([{ type: 'tool_call', content: `Appel d'outil: ${toolCall.name}`, timestamp: new Date() }]),
                      sessionId: messageSessionId, // Keep message session ID for graph visualization
                      conversationSessionId: conversationSessionId // Maintain conversation session ID
                    };
                  }
                  return msg;
                })
              );
            }
            // Gérer autres types de données
            else {
              console.log('Unknown SSE data type:', data);

              if (data.content || data.text || data.message) {
                const content = data.content || data.text || data.message;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + content }
                      : msg
                  )
                );
              }
            }
          } catch (e) {
            console.error('Erreur parsing SSE:', e, 'Raw line:', line);
          }
        }
      }
    }
  };

  // Fonction pour gérer les requêtes normales (fallback)
  const handleRegularRequest = async (content, assistantMessageId, conversationSessionId, messageSessionId) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content,
        session_id: conversationSessionId, // Use persistent conversation session ID for agent memory
        message_session_id: messageSessionId, // Include message session ID for graph visualization
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur réseau');
    }

    const data = await response.json();

    // If backend returned attachments, attach them now (content will still stream-simulate)
    const attachments = {
      has_chart: !!data.has_chart,
      chart_data: data.chart_data || null,
      has_dataframe: !!data.has_dataframe,
      dataframe_data: data.dataframe_data || null,
      has_news: !!data.has_news,
      news_data: data.news_data || null,
      has_profile: !!data.has_profile,
      profile_data: data.profile_data || null
    };

    // Simuler le streaming caractère par caractère
    const fullResponse = data.response;
    let currentContent = '';

    // Arrêter le spinner dès qu'on commence le streaming de contenu
    setMessages(prev =>
      prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, isProcessing: false }
          : msg
      )
    );

    for (let i = 0; i < fullResponse.length; i++) {
      currentContent += fullResponse[i];

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: currentContent, ...attachments }
            : msg
        )
      );

      await new Promise(resolve => setTimeout(resolve, 30));
    }

    setMessages(prev =>
      prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, isStreaming: false, isProcessing: false }
          : msg
      )
    );
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Threads with white threads on dark background */}
      <div className="absolute inset-0 w-full h-full">
        <ThreadsBackground
          color={[0.6706, 0.2784, 0.7373]} // White threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>


      {/* GitHub Button - Top Left */}
      <GitHubButton 
        username="matt-GTN" 
        repository="stella-next" 
        variant="fixed"
        className="!top-6 !right-6 !left-auto"
      />

      {/* Navbar */}
      <ChatNavbar />

      {/* Main chat area */}
      <div className="relative h-screen pt-8 pb-4">
        <div className="px-4 h-full">
          <div className="max-w-4xl mx-auto w-full h-full backdrop-blur-xs rounded-3xl shadow-lg overflow-hidden border border-white/20 flex flex-col">
            <ChatContainer
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>


    </div>
  );
}