"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ChatNavbar() {
  const [isVisible, setIsVisible] = useState(false); // Start hidden

  return (
    <>
      {/* Navbar */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-4/5"
            onMouseLeave={() => setIsVisible(false)}
          >
            <div className="bg-white/10 backdrop-blur-md border border-black/20 rounded-full px-6 py-3 shadow-lg">
              <div className="flex justify-between items-center">
                {/* Logo et titre à gauche */}
                <motion.div
                  className="flex items-center space-x-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2 rounded-full bg-gray-700">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-black">
                      Stella, analyste financière
                    </h1>
                  </div>
                </motion.div>

                {/* Navigation panels */}
                <div className="flex items-center space-x-1">

                  <Link href="/">
                    <motion.button
                      className="px-4 py-2 rounded-full bg-white/20 text-black text-sm font-medium hover:bg-white/30 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Stella
                    </motion.button>
                  </Link>

                  <Link href="/modeling">
                    <motion.button
                      className="px-4 py-2 rounded-full text-black/70 text-sm font-medium hover:bg-white/10 hover:text-black transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Modélisation
                    </motion.button>
                  </Link>

                  <Link href="/research-report">
                    <motion.button
                      className="px-4 py-2 rounded-full text-black/70 text-sm font-medium hover:bg-white/10 hover:text-black transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Rapport
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Hover trigger when navbar is hidden */}
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40"
            onMouseEnter={() => setIsVisible(true)}
          >
            <motion.div
              className="bg-purple-500/5 backdrop-blur-sm border border-black/10 rounded-b-xl px-8 py-2 shadow-sm cursor-pointer group"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(0,0,0,0.1)",
                y: 2
              }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="flex items-center space-x-2"
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageCircle className="h-3 w-3 text-black/60 group-hover:text-black transition-colors" />
                <ChevronDown className="h-3 w-3 text-black/60 group-hover:text-black transition-colors" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
