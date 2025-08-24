"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatContainer({ messages, onSendMessage, isLoading }) {
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le bas quand un nouveau message arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll seulement pour les nouveaux messages (pas au chargement initial)
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages.length]);

  return (
      <div className="flex flex-col h-full w-full max-h-full overflow-hidden">
        {/* Messages container with fixed height and scrolling */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth w-full min-h-0"
          style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: '#a855f7 transparent'
          }}
        >
        <AnimatePresence initial={false} mode="wait">
          {messages.map((message, index) => (
            <motion.div
              key={`message-${message.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
              layout={false}
              style={{ willChange: "opacity, transform" }}
            >
              <ChatMessage message={message} messageIndex={index} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Élément de référence pour le scroll */}
        <div ref={messagesEndRef} className="h-1" />

        {/* Indicateur de chargement */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2 bg-black/10 rounded-2xl px-4 py-3 max-w-xs border border-black/20">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-600 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-600 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-600 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm text-black font-medium">Stella réfléchit...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Input zone - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-black/20 w-full">
        <div className="px-6 py-6">
          <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
