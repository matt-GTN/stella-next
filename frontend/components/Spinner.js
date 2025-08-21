"use client";

import { motion } from "motion/react";

export default function Spinner({ size = "md", color = "stella" }) {
  // Size configurations
  const sizeConfig = {
    sm: {
      containerSize: "w-6 h-6",
      dotSize: "w-1.5 h-1.5"
    },
    md: {
      containerSize: "w-8 h-8", 
      dotSize: "w-2 h-2"
    },
    lg: {
      containerSize: "w-12 h-12",
      dotSize: "w-3 h-3"
    }
  };

  // Color configurations
  const colorConfig = {
    stella: "bg-blue-500", // Stella blue
    gray: "bg-gray-600",
    white: "bg-white"
  };

  const { containerSize, dotSize } = sizeConfig[size];
  const dotColor = colorConfig[color];

  return (
    <div className={`${containerSize} flex items-center justify-center`}>
      <div className="flex space-x-1">
        <motion.div
          className={`${dotSize} ${dotColor} rounded-full`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            delay: 0,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className={`${dotSize} ${dotColor} rounded-full`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            delay: 0.2,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className={`${dotSize} ${dotColor} rounded-full`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            delay: 0.4,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
}
