"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Send, Mic } from "lucide-react";

export default function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex items-end gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Message input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Tapez votre message... (Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne)"
          disabled={disabled}
          className="w-full resize-none rounded-2xl glass-light backdrop-blur-xl px-5 py-3.5 pr-14 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all duration-200 text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed placeholder:bg-gradient-to-r placeholder:from-purple-500/50 placeholder:to-pink-500/50 placeholder:bg-clip-text placeholder:text-transparent shadow-xl hover:shadow-2xl bg-gradient-to-r from-white/50 to-white/30 font-medium"
          style={{
            minHeight: '52px',
            maxHeight: '120px'
          }}
          rows={1}
        />
        
        {/* Microphone button (placeholder for future voice input) */}
        <motion.button
          type="button"
          className="absolute right-14 bottom-3.5 p-2.5 rounded-xl glass backdrop-blur-md hover:bg-white/30 transition-all duration-200 shadow-md"
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
        >
          <Mic className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" />
        </motion.button>
      </div>

      {/* Send button */}
      <motion.button
        type="submit"
        disabled={!message.trim() || disabled}
        className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift"
        whileHover={!disabled && message.trim() ? { scale: 1.08, rotate: 5 } : {}}
        whileTap={!disabled && message.trim() ? { scale: 0.92 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Send className="w-5 h-5 ml-0.5" />
      </motion.button>
    </motion.form>
  );
}
