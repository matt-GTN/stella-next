import { motion } from 'motion/react';
import InteractivePill from '@/components/InteractivePill';

import Flag from './Flag';

const Pill = ({ children, color, searchable = true, searchTerms, searchContext, className, size = 'default', flag }) => {
  const hoverTransition = {
    duration: 0.3,
    type: "spring",
    stiffness: 400,
    damping: 17
  };

  const sizeStyles = {
    default: 'text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-2xl min-h-[36px]',
    badge: 'text-xs px-3 py-1.5 badge badge-lg font-bold rounded-xl'
  };

  // Couleurs vibrantes par défaut si pas de couleur spécifiée
  const getVibrantColor = () => {
    if (color) return color;
    return 'bg-gradient-to-br from-purple-500 to-pink-500';
  };

  return (
    <InteractivePill
      searchable={searchable}
      searchTerms={searchTerms}
      searchContext={searchContext}
    >
      <motion.div
        whileHover={{ scale: 1.08, y: -3, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        transition={hoverTransition}
        className={`text-white transition-all duration-300 flex items-center justify-center glass-light backdrop-blur-md shadow-lg hover:shadow-xl ${sizeStyles[size]} ${getVibrantColor()} ${className} hover-lift`}
        style={{
          background: !color ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.8) 100%)' : undefined
        }}
      >
        {flag && <Flag countryCode={flag} className="mr-2" />}
        <span className="font-semibold">{children}</span>
      </motion.div>
    </InteractivePill>
  );
};

export default Pill;
