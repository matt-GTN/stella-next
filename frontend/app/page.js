"use client";

import { useState } from "react";
import VantaBackground from '@/components/vanta/VantaBackground';
import ChatNavbar from "@/components/chat/ChatNavbar";
import ChatContainer from "@/components/chat/ChatContainer";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "👋 Bonjour ! Je suis **Stella**, l'assistant IA de Mathis.\n\nJe peux vous aider avec :\n- 🤖 Questions sur l'IA et le machine learning\n- 💻 Programmation et développement\n- 📊 Analyse de données\n- 🎯 Projets et conseils techniques\n\nComment puis-je vous aider aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content) => {
    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Créer un message assistant vide qui va être rempli progressivement
    const assistantMessageId = Date.now() + 1;
    const initialAssistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, initialAssistantMessage]);
    setIsLoading(false);

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
                isStreaming: false 
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
            
            // Gérer les différents types de données du backend
            if (data.type === 'content' || data.type === 'token') {
              // Le backend envoie soit 'content' (chunk complet) soit 'token' (token individuel)
              const newContent = data.chunk || data.content || data.token || '';
              
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg, 
                        content: data.chunk ? newContent : (msg.content + newContent)
                      }
                    : msg
                )
              );
            } else if (data.type === 'done' || data.type === 'finished') {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              return;
            } else if (data.type === 'error') {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg, 
                        content: data.message || data.error || "❌ Erreur lors de la génération de la réponse.",
                        isStreaming: false 
                      }
                    : msg
                )
              );
              return;
            } else if (data.type === 'tool_call' || data.type === 'function_call') {
              // Gérer les appels d'outils si votre backend les envoie
              console.log('Tool call detected:', data);
              // Pour l'instant on ne fait rien, mais vous pouvez ajouter une logique ici
            } else {
              // Pour tout autre type de données, essayer d'extraire le contenu
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
        stream: false 
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur réseau');
    }

    const data = await response.json();
    
    // Simuler le streaming caractère par caractère
    const fullResponse = data.response;
    let currentContent = '';
    
    for (let i = 0; i < fullResponse.length; i++) {
      currentContent += fullResponse[i];
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: currentContent }
            : msg
        )
      );
      
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      )
    );
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Background Vanta avec glassmorphism */}
      <div className="fixed inset-0 w-full h-full z-0 bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
        <VantaBackground
          effectType="BIRDS"
          options={{
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 800,
            minWidth: 1200,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0xffffff,
            color1: 0x10027a,
            color2: 0xff0086,
            colorMode: "varianceGradient",
            wingSpan: 20.0,
            speedLimit: 3.0,
            separation: 15.0,
            alignment: 25.0,
            cohesion: 50.0,
            quantity: 3.0,
          }}
        />
      </div>
      
      {/* Glassmorphism overlay */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-10"></div>

      {/* Navbar */}
      <ChatNavbar />

      {/* Main chat area */}
      <div className="relative z-20 min-h-screen flex flex-col pt-20">
        <div className="flex-1">
          <ChatContainer 
            messages={messages} 
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}