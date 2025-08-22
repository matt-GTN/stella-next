"use client";

import { motion } from "motion/react";
import { User, Bot, Copy, Check, ArrowDownToLine, Eye } from "lucide-react";
import React, { useState, useRef } from "react";
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
import AgentDecisionDAG from "@/components/visualization/graph/AgentDecisionDAG";
import { useLanguage } from "@/contexts/LanguageContext";
import { processMessageForChat, hasAgentActivity as checkAgentActivity } from "@/utils/messageDataProcessor";


// Lazy-load Chart to avoid SSR issues
const Chart = dynamic(() => import("@/components/charts/Chart"), { ssr: false });

export default function ChatMessage({ message: rawMessage }) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [dlDone, setDlDone] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const chartDownloaders = useRef({});

  // Process message for backward compatibility and validation
  const message = processMessageForChat(rawMessage);

  // Derive full tool list from multiple possible fields for unused nodes
  const allToolNames = React.useMemo(() => {
    const out = [];
    const pushArray = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const v of arr) {
        if (typeof v === 'string') out.push(v);
        else if (v && typeof v === 'object') {
          const n = v.name || v.tool_name || v.id;
          if (n) out.push(n);
        }
      }
    };
    const pushObjectKeys = (obj) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) out.push(...Object.keys(obj));
    };

    pushArray(message.available_tools);
    pushObjectKeys(message.available_tools);
    pushArray(message.availableTools);
    pushArray(message.tools);
    pushArray(message.tool_list);
    pushObjectKeys(message.tool_config);

    return Array.from(new Set(out.filter(Boolean)));
  }, [message]);

  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  // Check if this message has agent activity using the utility function
  const hasAgentActivity = checkAgentActivity(message);

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
    <div className="w-full">
      <motion.div
        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} ${isAssistant && (message.has_chart || message.has_dataframe || message.has_news || message.has_profile)
          ? 'chat-message-with-chart'
          : ''
          }`}
        layout={false}
      >
        {/* Avatar - uniquement pour l'assistant */}
        {isAssistant && (
          <motion.div
            className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
          >
            <Bot className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end max-w-[80%]' : 'items-start flex-1'}`}>
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

            <div className={`text-base leading-relaxed ${isAssistant ? 'pr-6' : ''} markdown-content text-black`}>
              {isUser ? (
                <p className="whitespace-pre-wrap text-black font-medium text-base">{message.content}</p>
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
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-6 mt-6 text-black" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold mb-5 mt-5 text-black" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mb-4 mt-4 text-black" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-black text-base leading-7" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-black" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-black" {...props} />,
                            li: ({ node, ...props }) => <li className="text-base text-black leading-6" {...props} />,
                            code: ({ node, inline, ...props }) => (
                              <code className={
                                inline
                                  ? "text-purple-600 bg-purple-50 font-semibold px-2 py-1 rounded-md font-mono text-sm"
                                  : "text-purple-600 font-semibold font-mono text-sm"
                              } {...props}
                              />
                            ),
                            pre: ({ node, ...props }) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 text-sm" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-black" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-black" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-400 pl-4 py-2 italic text-gray-700 mb-4 bg-gray-50 rounded-r-md" {...props} />,
                            a: ({ node, ...props }) => <a className="text-gray-700 hover:text-black underline" {...props} />
                          }}
                        >
                          {message.initialContent || message.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>

                  {/* Tool calls display */}
                  {(() => {
                    // Defensive check to prevent temporal dead zone errors
                    const toolCalls = message?.toolCalls;

                    // Multiple layers of validation to prevent runtime errors
                    if (!toolCalls) return null;
                    if (!Array.isArray(toolCalls)) return null;
                    if (toolCalls.length === 0) return null;

                    // Create a safe copy to prevent reference issues
                    let safeToolCalls;
                    try {
                      safeToolCalls = Array.from(toolCalls);
                    } catch (error) {
                      console.error('Error creating safe tool calls array:', error);
                      return null;
                    }

                    return (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 30 }}
                        layout={false}
                        className="mt-4">
                        {(() => {
                          try {
                            return safeToolCalls.map((toolCall, index) => {
                              // Ensure toolCall is valid
                              if (!toolCall || typeof toolCall !== 'object') {
                                console.warn(`Invalid toolCall at index ${index}:`, toolCall);
                                return null;
                              }

                              return (
                                <motion.div
                                  key={`${message.id}-tool-${index}`}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: 0.05 * index, type: "spring", stiffness: 400, damping: 28 }}
                                  layout={false}
                                  className="mb-2 last:mb-0"
                                >
                                  <ToolCall
                                    toolName={toolCall.name || toolCall.tool_name || 'unknown'}
                                    args={toolCall.args || toolCall.arguments || {}}
                                  />
                                </motion.div>
                              );
                            }).filter(Boolean); // Remove null entries
                          } catch (error) {
                            console.error('Error rendering tool calls:', error);
                            return (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                Error displaying tools: {error.message}
                              </div>
                            );
                          }
                        })()}
                      </motion.div>
                    );
                  })()}

                  {/* Final message content (after tool calls) */}
                  {message.finalContent && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className="flex items-end">
                        <div className="flex-1">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-5 mt-5 text-black" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-4 mt-4 text-black" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-3 mt-3 text-black" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-black text-base leading-7" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-black" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-black" {...props} />,
                              li: ({ node, ...props }) => <li className="text-base text-black leading-6" {...props} />,
                              code: ({ node, inline, ...props }) => (
                                <code className={
                                  inline
                                    ? "text-purple-600 bg-purple-50 font-semibold px-2 py-1 rounded-md font-mono text-sm"
                                    : "text-purple-600 font-semibold font-mono text-sm"
                                } {...props}
                                />
                              ),
                              pre: ({ node, ...props }) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 text-sm" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-semibold text-black" {...props} />,
                              em: ({ node, ...props }) => <em className="italic text-black" {...props} />,
                              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-400 pl-4 py-2 italic text-gray-700 mb-4 bg-gray-50 rounded-r-md" {...props} />,
                              a: ({ node, ...props }) => <a className="text-gray-700 hover:text-black underline" {...props} />
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
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 relative z-0">

                  {/* Chart display with download option */}
                  {message.has_chart && message.chart_data && (
                    <div className="col-span-1 lg:col-span-2 w-full relative z-0">
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-black/10 bg-white/50"
                        style={{
                          height: '450px',
                          contain: 'layout style paint',
                          willChange: 'auto'
                        }}
                      >
                        <motion.button
                          onClick={() => {
                            chartDownloaders.current[message.id]?.();
                            setDlDone(true);
                            setTimeout(() => setDlDone(false), 2000);
                          }}
                          className="absolute top-2 right-2 z-20 p-1 rounded-full bg-white/70 hover:bg-white/90 shadow-sm transition-all duration-150"
                          aria-label="Télécharger PNG"
                          title="Télécharger PNG"
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.15 }}
                        >
                          {dlDone ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownToLine className="w-4 h-4 text-gray-600" />
                          )}
                        </motion.button>
                        <div className="p-3 relative z-10 h-full">
                          <Chart plotlyJson={message.chart_data} registerDownloader={(fn) => { chartDownloaders.current[message.id] = fn; }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {message.has_dataframe && message.dataframe_data && (
                    <div className="w-full rounded-xl border border-black/10 overflow-hidden">
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

          {/* Agent Decision Graph - beautiful visualization with styled toggle button */}
          {hasAgentActivity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="mt-4"
            >
              {/* Beautiful toggle button styled like ToolCall pills */}
              <motion.div
                className="mb-3 flex justify-left"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
              >
                <motion.button
                  onClick={() => setShowVisualization(v => !v)}
                  className="inline-flex items-center gap-2 text-[11px] leading-4 px-3 py-2 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Eye className="w-3 h-3" />
                  <span className="uppercase tracking-wide text-[10px] text-purple-600/80">
                    {language === 'fr' ? "Chemin de décision de l'agent" : 'Agent decision path'}
                  </span>
                  <span className="font-semibold">
                    {showVisualization ? (language === 'fr' ? 'Masquer' : 'Hide') : (language === 'fr' ? 'Afficher' : 'Show')}
                  </span>
                </motion.button>
              </motion.div>

              {/* Large graph visualization */}
              {showVisualization && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                  className="w-full relative z-0 overflow-hidden"
                >
                  <div className="relative w-190 rounded-xl border border-black/10 bg-white/50 backdrop-blur-sm shadow-lg">
                    <div
                      className="p-4 relative z-10"
                      style={{
                        minHeight: '200px',
                        contain: 'layout style paint',
                        willChange: 'auto'
                      }}
                    >
                      <AgentDecisionDAG
                        toolCalls={Array.isArray(message.toolCalls) ? message.toolCalls : []}
                        allTools={allToolNames}
                        language={language}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}


          {/* Timestamp */}
          <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
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



    </div>
  );
}
