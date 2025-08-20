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
      className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xs border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 rounded-full glass">
              <MessageCircle className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Stella Chat
              </h1>
              <p className="text-xs text-gray-600">Assistant IA de Mathis</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full glass text-sm font-medium">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">Créé par Mathis</span>
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
