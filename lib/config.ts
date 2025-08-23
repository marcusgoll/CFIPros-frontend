/**
 * Centralized application configuration
 * Validates required environment variables at startup
 */

export const config = {
  // Backend API configuration
  backendUrl: process.env['BACKEND_API_URL'] || 'https://api.cfipros.com/v1',
  
  // Redis configuration (optional)
  redisUrl: process.env['REDIS_URL'],
  
  // CORS configuration
  allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://cfipros.com',
    'https://www.cfipros.com'
  ],
  
  // Rate limiting configuration
  rateLimiting: {
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 60 },
    results: { windowMs: 60 * 60 * 1000, maxRequests: 100 },
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
    default: { windowMs: 60 * 60 * 1000, maxRequests: 120 },
  },
  
  // Request timeout
  requestTimeout: 30000, // 30 seconds
  
  // File upload limits
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'image/webp',
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  },
  
  // Environment flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Validate critical configuration at startup
if (!config.backendUrl) {
  throw new Error('BACKEND_API_URL environment variable is required');
}

// Type exports for better TypeScript support
export type Config = typeof config;
export type RateLimitEndpoint = keyof typeof config.rateLimiting;