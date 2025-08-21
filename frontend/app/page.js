"use client";

import { useState, useRef, useCallback } from "react";
import VantaBackground from '@/components/vanta/VantaBackground';
import ChatNavbar from "@/components/chat/ChatNavbar";
import ChatContainer from "@/components/chat/ChatContainer";
import ThreadsBackground from '@/components/backgrounds/ThreadsBackground';
import PrismBackground from '@/components/backgrounds/PrismBackground';
import AuroraBackground from "@/components/backgrounds/AuroraBackground";


export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-message-1',
      type: 'assistant',
      content: "👋 Bonjour ! Je suis **Stella**, une assitance IA d'analyse financière. Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null); // Gérer l'ID de session pour maintenir le contexte
  const [messageCounter, setMessageCounter] = useState(2); // Compteur pour les IDs de messages

  const sendMessage = async (content) => {
    // Générer des IDs uniques et séquentiels
    const userMessageId = `user-${messageCounter}`;
    const assistantMessageId = `assistant-${messageCounter + 1}`;
    
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
      phases: [] // Historique des phases de traitement
    };
    
    setMessages(prev => [...prev, initialAssistantMessage]);
    setIsLoading(false);
    
    // Incrémenter le compteur pour les prochains messages
    setMessageCounter(prev => prev + 2);

    try {
      // Essayer d'abord le streaming SSE
      const useSSE = true; // Changer à false pour utiliser l'ancienne méthode
      
      if (useSSE) {
        await handleSSEStreaming(content, assistantMessageId);
      } else {
        await handleRegularRequest(content, assistantMessageId);
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
  const handleSSEStreaming = async (content, assistantMessageId) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: content, 
        session_id: sessionId, // Inclure l'ID de session pour maintenir le contexte
        stream: true 
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur réseau');
    }

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
            
            // Gérer l'ID de session
            if (data.type === 'session_id') {
              console.log('Session ID reçu:', data.session_id);
              setSessionId(data.session_id);
            }
            // Gérer les messages de statut (phases de l'agent)
            else if (data.type === 'status') {
              const step = data.step || 'processing';
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg,
                        isProcessing: true, // Activer le spinner
                        processingStep: step, // Type d'étape en cours
                        phases: [...(msg.phases || []), { type: 'status', step, timestamp: new Date() }]
                      }
                    : msg
                )
              );
            }
            // Gérer le contenu initial (avant les tool calls)
            else if (data.type === 'initial_content') {
              const newContent = data.chunk || data.content || data.token || '';
              
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
                        isProcessing: false, // Arrêter le spinner
                        currentStatus: null,
                        phases: [...(msg.phases || []), { type: 'final', content: 'Analyse terminée', timestamp: new Date() }],
                        has_chart: !!data.has_chart,
                        chart_data: data.chart_data || null,
                        has_dataframe: !!data.has_dataframe,
                        dataframe_data: data.dataframe_data || null,
                        has_news: !!data.has_news,
                        news_data: data.news_data || null,
                        has_profile: !!data.has_profile,
                        profile_data: data.profile_data || null
                      }
                    : msg
                )
              );
              return;
            }
            // Gérer la fin du streaming
            else if (data.type === 'done' || data.type === 'finished') {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg, 
                        isStreaming: false,
                        isProcessing: false, // Arrêter le spinner 
                        currentStatus: null,
                        phases: [...(msg.phases || []), { type: 'done', content: 'Traitement terminé', timestamp: new Date() }]
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
                        phases: [...(msg.phases || []), { type: 'error', content: data.message || data.error, timestamp: new Date() }]
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
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg,
                        toolCalls: [...(msg.toolCalls || []), toolCall],
                        phases: [...(msg.phases || []), { type: 'tool_call', content: `Appel d'outil: ${toolCall.name}`, timestamp: new Date() }]
                      }
                    : msg
                )
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
  const handleRegularRequest = async (content, assistantMessageId) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: content, 
        session_id: sessionId, // Inclure l'ID de session pour maintenir le contexte
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
          color={[0, 0, 0]} // White threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>
      

      {/* Navbar */}
      <ChatNavbar />

      {/* Main chat area with card container */}
      <div className="relative z-20 h-screen flex flex-col pt-24">
        <div className="flex-1 px-4 md:px-8 lg:px-12 py-8">
          <div className="max-w-4xl mx-auto w-full h-[calc(100vh-8rem)] backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20 flex flex-col">
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