"use client";

import { motion } from "motion/react";
import { MessageCircle, Home, User } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

export default function ChatNavbar() {
  const { t } = useLanguage();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 glass-light shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg hover-lift">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Stella Chat
              </h1>
              <p className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-medium">Assistant IA de Mathis</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl glass backdrop-blur-xl text-sm font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 shadow-md">
                <div className="p-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Créé par Mathis</span>
              </div>
            </motion.div>

            {/* Language Toggle */}
            <div className="relative">
              <LanguageToggle isCardActive={false} />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
