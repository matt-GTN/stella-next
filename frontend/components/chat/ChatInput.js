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
          placeholder="Tapez votre message... "
          disabled={disabled}
          className="w-full resize-none rounded-2xl backdrop-blur-sm border border-black/10 px-4 py-3 pr-12 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/30 transition-all duration-200 text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500 text-black"
          style={{
            minHeight: '48px',
            maxHeight: '120px'
          }}
          rows={1}
        />
        
        {/* Microphone button (placeholder for future voice input) */}
        <motion.button
          type="button"
          className="absolute right-12 bottom-3 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
        >
        </motion.button>
      </div>

      {/* Send button */}
      <motion.button
        type="submit"
        disabled={!message.trim() || disabled}
        className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-400 hover:bg-purple-500 text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        whileHover={!disabled && message.trim() ? { scale: 1.05 } : {}}
        whileTap={!disabled && message.trim() ? { scale: 0.95 } : {}}
      >
        <Send className="w-5 h-5 text-white" />
      </motion.button>
    </motion.form>
  );
}
