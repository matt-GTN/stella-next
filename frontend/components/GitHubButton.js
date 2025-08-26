// components/GitHubButton.js - Bouton GitHub avec compteur d'étoiles
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Github, Star } from 'lucide-react';
import Link from 'next/link';

/**
 * Composant bouton GitHub avec affichage du nombre d'étoiles
 * @param {string} username - Nom d'utilisateur GitHub
 * @param {string} repository - Nom du dépôt
 * @param {string} className - Classes CSS supplémentaires
 * @param {boolean} isCardActive - État d'activation de la carte
 * @param {string} variant - Variante d'affichage ('fixed' ou 'inline')
 */
const GitHubButton = ({
  username = 'matt-GTN',
  repository = 'portfolio',
  className = '',
  isCardActive = false,
  variant = 'fixed' // 'fixed' ou 'inline'
}) => {
  const [stars, setStars] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${username}/${repository}`);

        if (response.ok) {
          const data = await response.json();
          setStars(data.stargazers_count);
        } else if (response.status === 403) {
          setError(true);
        }
      } catch (err) {
        console.error('Erreur de récupération API GitHub:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, [username, repository]);

  // Formater le nombre d'étoiles pour l'affichage
  const formatStars = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const isFixed = variant === 'fixed';

  return (
    <motion.div
      initial={{ opacity: 0, y: isFixed ? -20 : 20 }}
      animate={isFixed ? {
        opacity: isCardActive ? 0 : 1,
        y: isCardActive ? -40 : 0,
      } : {
        opacity: 1,
        y: 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={isFixed ? `fixed top-6 right-6 z-40 ${className}` : `${className}`}
    >
      <Link
        href={`https://github.com/${username}/${repository}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-black/80 text-white rounded-full shadow-lg border border-white/10 hover:bg-black/90 transition-colors duration-300"
        >
          <Github size={20} />

          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400" style={{ fill: 'currentColor' }} />
              <span className="text-sm font-medium">1</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400" style={{ fill: 'currentColor' }} />
              <span className="text-sm font-medium">{formatStars(stars || 0)}</span>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default GitHubButton;