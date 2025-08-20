"use client";

import { motion } from "motion/react";
import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Styles CSS pour le code highlighting
import 'highlight.js/styles/github.css';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      layout
    >
      {/* Avatar - uniquement pour l'assistant */}
      {isAssistant && (
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <Bot className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Message bubble */}
      <div className={`flex flex-col max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? 'items-end' : 'items-start'}`}>
        <motion.div
          className={`
            relative px-4 py-3 rounded-2xl shadow-sm
            ${isUser 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm' 
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
            }
            ${isAssistant ? 'hover:shadow-md transition-shadow duration-200' : ''}
          `}
          whileHover={isAssistant ? { scale: 1.02 } : {}}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Copy button pour les messages de l'assistant */}
          {isAssistant && (
            <motion.button
              onClick={() => copyToClipboard(message.content)}
              className="absolute top-2 right-2 p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-gray-500" />
              )}
            </motion.button>
          )}

          <div className="text-sm leading-relaxed pr-6 markdown-content">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="flex items-end">
                <div className="flex-1">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      // Custom styling for markdown elements
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-md font-semibold mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-sm" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code className="bg-gray-100 text-purple-600 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                        ) : (
                          <code className="block bg-gray-50 p-3 rounded-lg text-xs font-mono overflow-x-auto" {...props} />
                        ),
                      pre: ({node, ...props}) => <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto mb-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-purple-600" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-300 pl-3 italic text-gray-600 mb-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-purple-600 hover:text-purple-800 underline" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {/* Curseur clignotant pendant le streaming */}
                {message.isStreaming && (
                  <motion.div
                    className="w-2 h-4 bg-purple-500 ml-1 rounded-sm"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Timestamp */}
        <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* Avatar pour l'utilisateur */}
      {isUser && (
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <User className="w-4 h-4 text-gray-600" />
        </motion.div>
      )}
    </motion.div>
  );
}
