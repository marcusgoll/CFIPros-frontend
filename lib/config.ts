/**
 * Centralized application configuration
 * Validates required environment variables at startup
 */

// Environment variable validation schema
interface EnvironmentVariables {
  BACKEND_API_URL: string;
  NODE_ENV?: 'development' | 'production' | 'test';
  REDIS_URL?: string;
  ALLOWED_ORIGINS?: string;
  NEXT_PUBLIC_DEMO_VIDEO_PATH?: string;
}

// Validation functions
const validateUrl = (url: string, name: string): void => {
  try {
    new URL(url);
  } catch {
    throw new Error(`${name} must be a valid URL, got: ${url}`);
  }
};

const validateEnvironment = (env?: string): void => {
  const validEnvs = ['development', 'production', 'test'];
  if (env && !validEnvs.includes(env)) {
    throw new Error(`NODE_ENV must be one of: ${validEnvs.join(', ')}, got: ${env}`);
  }
};

// Runtime validation
const validateEnvironmentVariables = (): EnvironmentVariables => {
  const backendUrl = process.env['BACKEND_API_URL'];
  const nodeEnv = process.env['NODE_ENV'] as 'development' | 'production' | 'test' | undefined;
  const redisUrl = process.env['REDIS_URL'];
  const allowedOrigins = process.env['ALLOWED_ORIGINS'];
  const demoVideoPath = process.env['NEXT_PUBLIC_DEMO_VIDEO_PATH'];

  // Required variables
  if (!backendUrl) {
    throw new Error('BACKEND_API_URL environment variable is required');
  }
  validateUrl(backendUrl, 'BACKEND_API_URL');

  // Optional but validated if present
  if (nodeEnv) {
    validateEnvironment(nodeEnv);
  }

  if (redisUrl) {
    validateUrl(redisUrl, 'REDIS_URL');
  }

  if (allowedOrigins) {
    // Validate each origin in the comma-separated list
    const origins = allowedOrigins.split(',').map(o => o.trim());
    origins.forEach((origin, index) => {
      if (origin && !origin.startsWith('http://') && !origin.startsWith('https://')) {
        throw new Error(`ALLOWED_ORIGINS[${index}] must start with http:// or https://, got: ${origin}`);
      }
    });
  }

  if (demoVideoPath) {
    // Validate video file extension
    if (!demoVideoPath.match(/\.(mp4|webm|mov|avi)$/i)) {
      throw new Error(`NEXT_PUBLIC_DEMO_VIDEO_PATH must be a valid video file path, got: ${demoVideoPath}`);
    }
    // Ensure it starts with forward slash for proper routing
    if (!demoVideoPath.startsWith('/')) {
      throw new Error(`NEXT_PUBLIC_DEMO_VIDEO_PATH must start with '/', got: ${demoVideoPath}`);
    }
  }

  return {
    BACKEND_API_URL: backendUrl,
    NODE_ENV: nodeEnv,
    REDIS_URL: redisUrl,
    ALLOWED_ORIGINS: allowedOrigins,
    NEXT_PUBLIC_DEMO_VIDEO_PATH: demoVideoPath,
  };
};

// Validate environment variables at module load
const validatedEnv = validateEnvironmentVariables();

export const config = {
  // Backend API configuration (validated)
  backendUrl: validatedEnv.BACKEND_API_URL,
  
  // Redis configuration (optional, validated if present)
  redisUrl: validatedEnv.REDIS_URL,
  
  // CORS configuration (validated if present)
  allowedOrigins: validatedEnv.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
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
  
  // Environment flags (validated)
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isProduction: validatedEnv.NODE_ENV === 'production',
  
  // Runtime environment validation status
  environmentValidated: true,
} as const;

// Type exports for better TypeScript support
export type Config = typeof config;
export type RateLimitEndpoint = keyof typeof config.rateLimiting;