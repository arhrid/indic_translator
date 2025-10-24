import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Exclude server-only modules from client-side bundles
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'bcrypt-ts': false,
        'bcrypt': false,
        'pg': false,
        'drizzle-orm': false,
        'drizzle-orm/pg-core': false,
        'postgres': false,
      };
    }
    
    // Add file loader for CSV files
    config.module.rules.push({
      test: /\.(csv)$/,
      use: ['csv-loader'],
    });
    
    return config;
  },
  
  // Server external packages
  serverExternalPackages: ['bcrypt-ts', 'pg', 'openai-edge'],
  
  // Disable Edge Runtime for specific routes
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'x-middleware-ssr', value: '1' },
        ],
      },
      {
        source: '/api/history',
        headers: [
          { key: 'x-middleware-ssr', value: '1' },
        ],
      },
      {
        source: '/api/chat',
        headers: [
          { key: 'x-middleware-ssr', value: '1' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  
  // Enable standalone output for better performance
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;