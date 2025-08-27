/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Remove the rewrites that conflict with internal API routes
  // The frontend will use its own API routes in app/api/ which then proxy to the backend
  
  // Optimisations pour le développement
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Configuration pour les images
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;