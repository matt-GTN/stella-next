import React, { memo } from "react";
import { motion } from "framer-motion";

const PingingDot = () => {
  return (
    // Container sets size and positions the dot and ping rings
    <span className="relative flex h-3 w-3 pointer-events-none">
      {/* Smooth continuous ping ring (wave A) */}
      <motion.span
        className="absolute inline-flex h-3 w-3 rounded-full bg-purple-400/60 transform-gpu"
        style={{ willChange: "transform, opacity" }}
        animate={{
          scale: [1, 1.7, 2.2],
          opacity: [0.35, 0.18, 0]
        }}
        transition={{
          duration: 2.2,
          ease: "easeInOut",
          times: [0, 0.6, 1],
          repeat: Infinity,
          repeatType: "loop"
        }}
      />

      {/* Phase-shifted ring for uninterrupted flow (wave B) */}
      <motion.span
        className="absolute inline-flex h-3 w-3 rounded-full bg-purple-400/50 transform-gpu"
        style={{ willChange: "transform, opacity" }}
        animate={{
          scale: [1, 1.7, 2.2],
          opacity: [0.35, 0.18, 0]
        }}
        transition={{
          duration: 2.2,
          ease: "easeInOut",
          times: [0, 0.6, 1],
          repeat: Infinity,
          repeatType: "loop",
          delay: 1.1 // half-cycle offset
        }}
      />

      {/* Solid center dot with subtle breathing (GPU-friendly) */}
      <motion.span
        className="relative inline-flex rounded-full h-3 w-3 bg-purple-500 transform-gpu"
        style={{ willChange: "transform" }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      />
    </span>
  );
};

export default memo(PingingDot);
