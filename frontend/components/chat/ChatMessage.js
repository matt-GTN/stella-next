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
          className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-lg hover-lift"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>
      )}

      {/* Message bubble */}
      	<div className={`flex flex-col ${isAssistant ? 'w-full' : 'max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl'} ${isUser ? 'items-end' : 'items-start'}`}>
        	<motion.div
          className={`
            relative px-5 py-4 rounded-3xl ${isAssistant ? 'w-full' : 'w-auto'}
            ${isUser 
              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white rounded-br-md shadow-xl' 
              : 'glass-light backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/60 text-gray-800 rounded-bl-md shadow-xl border border-white/40'
            }
            ${isAssistant ? 'hover:shadow-2xl transition-all duration-300' : ''}
          `}
          whileHover={isAssistant ? { scale: 1.01, y: -2 } : { scale: 1.02 }}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Copy button pour les messages de l'assistant */}
          {isAssistant && (
            <motion.button
              onClick={() => copyToClipboard(message.content)}
              className="absolute top-3 right-3 p-2 rounded-xl glass backdrop-blur-md hover:bg-white/30 transition-all duration-200 shadow-md"
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, scale: 1.1 }}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" />
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
                          <code className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 px-2 py-1 rounded-md text-xs font-mono font-semibold" {...props} />
                        ) : (
                          <code className="block glass-light backdrop-blur-md p-4 rounded-xl text-xs font-mono overflow-x-auto shadow-inner" {...props} />
                        ),
                      pre: ({node, ...props}) => <pre className="glass-light backdrop-blur-md p-4 rounded-xl overflow-x-auto mb-3 shadow-lg" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-purple-600" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gradient-to-b from-purple-400 to-pink-400 pl-4 italic bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-r-lg py-2 mb-3" {...props} />,
                      a: ({node, ...props}) => <a className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 underline decoration-purple-400 underline-offset-2 font-semibold transition-all duration-200" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {/* Curseur clignotant pendant le streaming */}
                {message.isStreaming && (
                  <motion.div
                    className="w-2.5 h-5 bg-gradient-to-b from-purple-500 to-pink-500 ml-1.5 rounded-md shadow-lg"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
            )}

            {/* Attached rich content from Stella */}
            {isAssistant && (message.has_chart || message.has_dataframe || message.explanation_text || message.has_news || message.has_profile) && (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {message.explanation_text && (
                  <div className="col-span-1 lg:col-span-2 text-xs glass-light backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 shadow-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.explanation_text}
                    </ReactMarkdown>
                  </div>
                )}

                {message.has_chart && message.chart_data && (
                  <div className="w-1/2 glass-light backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent glass border-b border-white/20">Graphique</div>
                    <div className="p-3">
                      <Chart plotlyJson={message.chart_data} />
                    </div>
                  </div>
                )}

                {message.has_dataframe && message.dataframe_data && (
                  <div className="w-full glass-light backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent glass border-b border-white/20">Données</div>
                    <div className="p-3">
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
        <span className={`text-xs mt-1.5 font-medium ${isUser ? 'text-right' : 'text-left'} bg-gradient-to-r from-purple-500/70 to-pink-500/70 bg-clip-text text-transparent`}>
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* Avatar pour l'utilisateur */}
      {isUser && (
        <motion.div
          className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover-lift"
          whileHover={{ scale: 1.1, rotate: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <User className="w-5 h-5 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
