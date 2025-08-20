// components/Navbar.jsx
"use client";

import { motion } from "motion/react";
import NavbarItem from './NavbarItem';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

// Navigation items with colors matching the content sections
const getNavItems = (t) => [
  { text: "Me", displayText: t('navigation.me'), iconName: "User", iconColor: "#3b82f6", bgColor: "#3b82f6" }, // Blue
  { text: "Projects", displayText: t('navigation.projects'), iconName: "Briefcase", iconColor: "#8b5cf6", bgColor: "#8b5cf6" }, // Violet
  { text: "Skills", displayText: t('navigation.skills'), iconName: "Zap", iconColor: "#f59e0b", bgColor: "#f59e0b" }, // Amber
  { text: "BeyondCode", displayText: t('navigation.beyondCode'), iconName: "Sparkles", iconColor: "#10b981", bgColor: "#10b981" }, // Green
  { text: "Contact", displayText: t('navigation.contact'), iconName: "Mail", iconColor: "#ef4444", bgColor: "#ef4444" }, // Red
];

export default function Navbar({ onItemClick, isCardActive }) {
  const { t } = useLanguage();
  const navItems = getNavItems(t);

  // Animation configuration for consistent hover timing
  const hoverTransition = {
    duration: 0.2,
    ease: "easeOut"
  };

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 items-end"
      animate={{
        x: isCardActive ? "150%" : "0%",
        opacity: isCardActive ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {navItems.map((item, index) => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          whileHover={{
            scale: 1.05,
            x: -5,
            transition: hoverTransition
          }}
          onClick={() => onItemClick(item.text)}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-300 bg-white/20 backdrop-blur-xs border border-white/10 shadow-lg hover:shadow-xl hover:bg-white/30">
            <NavbarItem
              text={item.displayText}
              iconName={item.iconName}
              iconColor={item.iconColor}
              textColor="#000000"
              onClick={() => { }} // Empty since we handle click on parent
              isInline={true}
            />
          </div>
        </motion.div>
      ))}
      
      {/* Bouton Chat - séparé des autres éléments */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.5,
          delay: navItems.length * 0.1 + 0.2,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={{
          scale: 1.05,
          x: -5,
          transition: hoverTransition
        }}
        className="mt-2"
      >
        <Link href="/chat">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 cursor-pointer">
            <MessageCircle className="w-4 h-4" />
            <span>Chat avec Stella</span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
