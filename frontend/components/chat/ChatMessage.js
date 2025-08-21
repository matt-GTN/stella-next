"use client";

import { motion } from "motion/react";
import { User, Bot, Copy, Check, ArrowDownToLine } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Styles CSS pour le code highlighting
import 'highlight.js/styles/github.css';

import dynamic from 'next/dynamic';
import DataFrameTable from "@/components/tables/DataFrameTable";
import NewsList from "@/components/news/NewsList";
import CompanyProfile from "@/components/profile/CompanyProfile";
import ToolCall from "./ToolCall";
import Spinner from "@/components/Spinner";

// Lazy-load Chart to avoid SSR issues
const Chart = dynamic(() => import("@/components/charts/Chart"), { ssr: false });

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const [dlDone, setDlDone] = useState(false);
  const chartDownloaders = useRef({});
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
      layout={false}
    >
      {/* Avatar - uniquement pour l'assistant */}
      {isAssistant && (
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <Bot className="w-4 h-4 text-gray-600" />
        </motion.div>
      )}

      {/* Message content */}
      	<div className={`flex flex-col ${isAssistant ? 'w-full' : 'max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl'} ${isUser ? 'items-end' : 'items-start'}`}>
        	<motion.div
          className={`relative w-full ${isAssistant ? 'min-h-[2.5rem]' : ''}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 30 }}
          layout={false}
        >
          {/* Copy button ou spinner pour les messages de l'assistant */}
          {isAssistant && (
            <div className="absolute top-0 right-0 p-1 rounded-full">
              {message.isProcessing ? (
                <Spinner size="sm" color="gray" />
              ) : (
                <motion.button
                  onClick={() => {
                    let textToCopy = '';
                    if (message.initialContent && message.finalContent) {
                      textToCopy = `${message.initialContent}\n\n${message.finalContent}`;
                    } else if (message.initialContent) {
                      textToCopy = message.initialContent;
                    } else if (message.finalContent) {
                      textToCopy = message.finalContent;
                    } else {
                      textToCopy = message.content || '';
                    }
                    copyToClipboard(textToCopy);
                  }}
                  className="opacity-100 hover:opacity-100 transition-opacity duration-200 hover:bg-white/20 p-1 rounded-full"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-600" />
                  )}
                </motion.button>
              )}
            </div>
          )}

          <div className={`text-sm leading-relaxed ${isAssistant ? 'pr-6' : ''} markdown-content text-black`}>
            {isUser ? (
              <p className="whitespace-pre-wrap text-black font-medium">{message.content}</p>
            ) : (
              <div>

                {/* Initial message content */}
                <div className="flex items-end">
                  <div className="flex-1">
                    {(message.initialContent || (!message.finalContent && message.content)) && (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          // Custom styling for markdown elements with black text on white background
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-black" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-md font-semibold mb-2 text-black" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 text-black" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-black" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1 text-black" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-black" {...props} />,
                          li: ({node, ...props}) => <li className="text-sm text-black" {...props} />,
                          code: ({node, inline, ...props}) => (
                            <code className={
                              inline
                                ? "text-purple-500 font-bold px-1.5 py-1 rounded-md font-mono text-sm"
                                : "text-purple-500 font-bold font-mono text-sm"
                              } {...props}
                            />
                          ),
                          pre: ({node, ...props}) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-black" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-black" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-3 italic text-gray-700 mb-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-gray-700 hover:text-black underline" {...props} />
                        }}
                      >
                        {message.initialContent || message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* Tool calls display */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 30 }}
                    layout={false}
                    className="mt-4">
                    {message.toolCalls.map((toolCall, index) => (
                      <motion.div
                        key={`${message.id}-tool-${index}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 * index, type: "spring", stiffness: 400, damping: 28 }}
                        layout={false}
                        className="mb-2 last:mb-0"
                      >
                        <ToolCall 
                          toolName={toolCall.name || toolCall.tool_name}
                          args={toolCall.args || toolCall.arguments || {}}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                
                {/* Final message content (after tool calls) */}
                {message.finalContent && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-end">
                      <div className="flex-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-black" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-md font-semibold mb-2 text-black" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 text-black" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-black" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1 text-black" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-black" {...props} />,
                            li: ({node, ...props}) => <li className="text-sm text-black" {...props} />,
                            code: ({node, inline, ...props}) => (
                              <code className={
                                inline
                                  ? "text-purple-500 text-blue-900 px-1.5 py-1 rounded-md font-mono text-sm"
                                  : "text-purple-500 font-bold text-sm"
                                } {...props}
                              />
                            ),
                            pre: ({node, ...props}) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-black" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-black" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-3 italic text-gray-700 mb-2" {...props} />,
                            a: ({node, ...props}) => <a className="text-gray-700 hover:text-black underline" {...props} />
                          }}
                        >
                          {message.finalContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attached rich content from Stella */}
            {isAssistant && (message.has_chart || message.has_dataframe || message.has_news || message.has_profile) && (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Chart display with download option */}
                {message.has_chart && message.chart_data && (
                  <div className="col-span-1 lg:col-span-2 w-full relative">
                    <motion.button
                      onClick={() => {
                        chartDownloaders.current[message.id]?.();
                        setDlDone(true);
                        setTimeout(() => setDlDone(false), 2000);
                      }}
                      className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/70 hover:bg-white/90 shadow-sm transition"
                      aria-label="Télécharger PNG"
                      title="Télécharger PNG"
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {dlDone ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownToLine className="w-4 h-4 text-gray-600" />
                      )}
                    </motion.button>
                    <div className="p-3">
                      <Chart plotlyJson={message.chart_data} registerDownloader={(fn) => { chartDownloaders.current[message.id] = fn; }} />
                    </div>
                  </div>
                )}

                {message.has_dataframe && message.dataframe_data && (
                  <div className="w-full bg-black/5 backdrop-blur-xs rounded-xl border border-black/10 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-700 border-b border-black/10">Données</div>
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
