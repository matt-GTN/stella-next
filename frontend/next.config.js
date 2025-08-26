/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://stella-backend:8000/:path*'  // Docker service name
          : 'http://localhost:8000/:path*',      // Local development
      },
    ];
  },
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