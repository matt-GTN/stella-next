"use client";

import { motion } from "motion/react";
import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Styles CSS pour le code highlighting
import 'highlight.js/styles/github.css';

import dynamic from 'next/dynamic';
import DataFrameTable from "@/components/tables/DataFrameTable";
import NewsList from "@/components/news/NewsList";
import CompanyProfile from "@/components/profile/CompanyProfile";

// Lazy-load Chart to avoid SSR issues
const Chart = dynamic(() => import("@/components/charts/Chart"), { ssr: false });

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
          className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <Bot className="w-4 h-4 text-gray-600" />
        </motion.div>
      )}

      {/* Message bubble */}
      	<div className={`flex flex-col ${isAssistant ? 'w-full' : 'max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl'} ${isUser ? 'items-end' : 'items-start'}`}>
        	<motion.div
          className={`
            relative px-4 py-3 rounded-2xl ${isAssistant ? 'w-full' : 'w-auto'}
            ${isUser 
              ? 'bg-gray-600 text-white rounded-br-sm' 
              : 'bg-white/10 backdrop-blur-xs border border-white/10 text-gray-800 rounded-bl-sm'
            }
          `}
          whileHover={isAssistant ? { scale: 1.01 } : {}}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Copy button pour les messages de l'assistant */}
          {isAssistant && (
            <motion.button
              onClick={() => copyToClipboard(message.content)}
              className="absolute top-2 right-2 p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
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
                          <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                        ) : (
                          <code className="block bg-white/10 backdrop-blur-xs p-3 rounded-lg text-xs font-mono overflow-x-auto" {...props} />
                        ),
                      pre: ({node, ...props}) => <pre className="bg-white/10 backdrop-blur-xs p-3 rounded-lg overflow-x-auto mb-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 mb-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-gray-600 hover:text-gray-800 underline" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {/* Curseur clignotant pendant le streaming */}
                {message.isStreaming && (
                  <motion.div
                    className="w-2 h-4 bg-gray-500 ml-1 rounded-sm"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            )}

            {/* Attached rich content from Stella */}
            {isAssistant && (message.has_chart || message.has_dataframe || message.explanation_text || message.has_news || message.has_profile) && (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {message.explanation_text && (
                  <div className="col-span-1 lg:col-span-2 text-xs text-gray-700 bg-white/10 backdrop-blur-xs border border-white/10 rounded-lg p-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.explanation_text}
                    </ReactMarkdown>
                  </div>
                )}

                {message.has_chart && message.chart_data && (
                  <div className="w-1/2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-600 border-b border-white/10">Graphique</div>
                    <div className="p-2">
                      <Chart plotlyJson={message.chart_data} />
                    </div>
                  </div>
                )}

                {message.has_dataframe && message.dataframe_data && (
                  <div className="w-full bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-600 border-b border-white/10">Données</div>
                    <div className="p-2">
                      <DataFrameTable dfJson={message.dataframe_data} />
                    </div>
                  </div>
                )}

                {message.has_news && message.news_data && (
                  <NewsList newsJson={message.news_data} />
                )}

                {message.has_profile && message.profile_data && (
                  <CompanyProfile profileJson={message.profile_data} />
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
