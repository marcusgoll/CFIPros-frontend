import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
});

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // ESLint and TypeScript checking enabled for v1.0.1
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Experimental features
  experimental: {
    // Enable turbo mode for faster builds
    turbo: {
      rules: {},
    },
  },

  // Server external packages
  serverExternalPackages: [],

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.cfipros.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ["image/webp", "image/avif"],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_NAME: "CFIPros",
    NEXT_PUBLIC_APP_DESCRIPTION: "CFI Training Platform",
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "X-RateLimit-Limit",
            value: "100",
          },
          {
            key: "X-RateLimit-Remaining",
            value: "99",
          },
        ],
      },
    ];
  },

  // Redirects configuration
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Webpack configuration for custom optimizations
  webpack: (config, { dev, isServer }) => {
    // Add custom webpack optimizations here if needed
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": __dirname,
      };
    }
    return config;
  },

};

export default bundleAnalyzer(nextConfig);