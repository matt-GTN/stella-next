/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
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