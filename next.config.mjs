/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },

  // Ignorar warnings de ESLint durante build
  eslint: {
    ignoreDuringBuilds: process.env.IGNORE_ESLINT === 'true',
  },

  // Tipo de ambiente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Output standalone para Docker
  output: 'standalone',
};

export default nextConfig;
