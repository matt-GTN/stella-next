"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

export default function ChatNavbar() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);
  const navbarRef = useRef(null);

  // Hide navbar after 3 seconds of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setIsVisible(true);
      
      timeoutRef.current = setTimeout(() => {
        if (!isHovered) {
          setIsVisible(false);
        }
      }, 3000);
    };

    // Track scroll to show navbar
    const handleScroll = () => {
      resetTimer();
    };

    // Track key press to show navbar
    const handleKeyPress = () => {
      resetTimer();
    };

    // Initial timer
    resetTimer();

    // Add event listeners (removed mousemove to prevent navbar from appearing on any mouse movement)
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('click', resetTimer);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('click', resetTimer);
    };
  }, [isHovered]);

  // Handle navbar hover
  const handleNavbarMouseEnter = () => {
    setIsHovered(true);
    setIsVisible(true);
  };

  const handleNavbarMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      {/* Navbar */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            ref={navbarRef}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-4/5"
            onMouseEnter={handleNavbarMouseEnter}
            onMouseLeave={handleNavbarMouseLeave}
          >
            <div className=" backdrop-blur-sm border border-black/20 rounded-full px-6 py-3 shadow-lg">
              <div className="flex justify-between items-center">
                {/* Logo et titre à gauche */}
                <motion.div 
                  className="flex items-center space-x-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2 rounded-full bg-[#33FFBD]">
                    <MessageCircle className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-black">
                      Stella, analyste financière
                    </h1>
                  </div>
                </motion.div>

                {/* 4 panels de navigation */}
                <div className="flex items-center space-x-1">
                  <motion.button
                    className="px-4 py-2 rounded-full bg-[#33FFBD] text-black text-sm font-medium hover:bg-black/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Stella
                  </motion.button>
                  
                  <motion.button
                    className="px-4 py-2 rounded-full text-black text-sm font-medium hover:bg-[#33FFBD] transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Modélisation
                  </motion.button>
                  
                  <motion.button
                    className="px-4 py-2 rounded-full text-black text-sm font-medium hover:bg-[#33FFBD] transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Visualisation
                  </motion.button>
                  
                  <motion.button
                    className="px-4 py-2 rounded-full text-black text-sm font-medium hover:bg-[#33FFBD] transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Rapport de recherche
                  </motion.button>
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
              className="bg-black/5 backdrop-blur-sm border border-black/10 rounded-b-xl px-8 py-2 shadow-sm cursor-pointer group"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.1)" }}
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
