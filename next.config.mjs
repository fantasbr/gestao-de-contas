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

  // Tipo de ambiente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Output standalone para Docker
  output: 'standalone',

  // Desabilitar verificação de tipos para builds mais rápidos
  // Evitar erros de prerender
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://crm.brancaautoescola.com.br;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
