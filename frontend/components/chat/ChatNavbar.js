"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Home, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ChatNavbar() {
  const [isVisible, setIsVisible] = useState(false); // Start hidden
  const pathname = usePathname();
  
  // Helper function to determine if a path is active
  const isActivePath = (path) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/chat';
    }
    return pathname.startsWith(path);
  };
  
  // Helper function to get button classes based on active state
  const getButtonClasses = (path, isActive) => {
    const baseClasses = "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200";
    
    if (isActive) {
      return `${baseClasses} bg-purple-500/40 text-black border border-purple-400/30`;
    }
    
    return `${baseClasses} text-black/70 hover:bg-purple-400/30 hover:text-black`;
  };

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
                  <div className="relative h-8 w-8 rounded-full bg-gray-700 overflow-hidden border-2 border-purple-400/30">
                    <Image
                      src="/avatar_stella.png"
                      alt="Stella Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-black">
                      Stella, analyste financière
                    </h1>
                  </div>
                </motion.div>

                {/* Navigation panels */}
                <div className="flex items-center space-x-3">

                  <Link href="/">
                    <motion.button
                      className={getButtonClasses('/', isActivePath('/'))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Stella
                    </motion.button>
                  </Link>

                  <Link href="/modeling">
                    <motion.button
                      className={getButtonClasses('/modeling', isActivePath('/modeling'))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Dashboard ML
                    </motion.button>
                  </Link>

                  <Link href="/research-report">
                    <motion.button
                      className={getButtonClasses('/research-report', isActivePath('/research-report'))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Recherche
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
              className="bg-purple-500/5 backdrop-blur-xl border border-black/10 rounded-b-xl px-8 py-2 shadow-sm cursor-pointer group"
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
                <Home className="h-3 w-3 text-black/60 group-hover:text-black transition-colors" />
                <ChevronDown className="h-3 w-3 text-black/60 group-hover:text-black transition-colors" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
