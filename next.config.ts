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
  experimental: {},

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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev https://api.cfipros.com https://us.i.posthog.com wss:",
              "frame-src https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev",
              "object-src 'none'",
              "base-uri 'self'"
            ].join("; ")
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

    // Fix webpack optimization conflict between usedExports and cacheUnaffected
    if (config.experiments?.cacheUnaffected && config.optimization?.usedExports) {
      // Disable cacheUnaffected when usedExports is enabled to avoid conflict
      config.experiments.cacheUnaffected = false;
    }

    return config;
  },

};

export default bundleAnalyzer(nextConfig);