/**
 * Rate limiting utilities for API endpoints
 * Uses in-memory cache for development and Redis for production
 */

import type { RedisClient } from '@/lib/types';

export interface RateLimiterResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Rate limit configurations for different endpoints
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 60, // 60 uploads per hour
  },
  results: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 result requests per hour
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 auth attempts per 15 minutes
  },
  default: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 120, // 120 requests per hour
  },
};

// In-memory cache for development
const memoryCache = new Map<string, { count: number; reset: number }>();

class RateLimiter {
  private redisClient: RedisClient | null = null;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    // Only initialize Redis in production
    if (process.env.NODE_ENV === 'production' && process.env['REDIS_URL']) {
      try {
        // @ts-expect-error - Redis is dynamically imported only in production
        const { createClient } = await import('redis');
        this.redisClient = createClient({
          url: process.env['REDIS_URL'],
        });
        
        await this.redisClient?.connect();
        console.log('Redis client connected for rate limiting');
      } catch (error) {
        console.warn('Failed to connect to Redis, using memory cache:', error);
        this.redisClient = null;
      }
    }
  }

  /**
   * Check rate limit for a client IP and endpoint
   */
  async check(clientIP: string, endpoint: string): Promise<RateLimiterResult> {
    const config = RATE_LIMIT_CONFIGS[endpoint] ?? RATE_LIMIT_CONFIGS['default']!;
    const key = `rate_limit:${endpoint}:${clientIP}`;
    
    if (this.redisClient) {
      return this.checkRedis(key, config);
    } else {
      return this.checkMemory(key, config);
    }
  }

  /**
   * Redis-based rate limiting for production
   */
  private async checkRedis(key: string, config: RateLimitConfig): Promise<RateLimiterResult> {
    if (!this.redisClient) {
      return this.checkMemory(key, config);
    }
    
    try {
      const current = await this.redisClient.get(key);
      const now = Date.now();

      if (!current) {
        // First request in window
        await this.redisClient.setEx(key, Math.ceil(config.windowMs / 1000), '1');
        
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: now + config.windowMs,
        };
      }

      const count = parseInt(current, 10);
      const ttl = await this.redisClient.ttl(key);
      const reset = now + (ttl * 1000);

      if (count >= config.maxRequests) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          reset,
        };
      }

      // Increment counter
      await this.redisClient.incr(key);
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - count - 1,
        reset,
      };
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fallback to memory cache
      return this.checkMemory(key, config);
    }
  }

  /**
   * Memory-based rate limiting for development
   */
  private checkMemory(key: string, config: RateLimitConfig): RateLimiterResult {
    const now = Date.now();
    const cached = memoryCache.get(key);

    // Clean up expired entries periodically
    this.cleanupExpiredEntries();

    if (!cached || cached.reset < now) {
      // First request or expired window
      const reset = now + config.windowMs;
      memoryCache.set(key, { count: 1, reset });
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset,
      };
    }

    if (cached.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: cached.reset,
      };
    }

    // Increment counter
    cached.count += 1;
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - cached.count,
      reset: cached.reset,
    };
  }

  /**
   * Clean up expired memory cache entries
   */
  private cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (value.reset < now) {
        memoryCache.delete(key);
      }
    }
  }

  /**
   * Get client IP from request
   */
  static getClientIP(request: Request): string {
    // Check for forwarded IP headers (behind proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0]!.trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback to connection IP (won't work in serverless)
    return 'unknown';
  }

  /**
   * Create rate limiter middleware
   */
  static middleware(endpoint: string) {
    return async (request: Request): Promise<RateLimiterResult> => {
      const clientIP = this.getClientIP(request);
      return rateLimiter.check(clientIP, endpoint);
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Get rate limit info for endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return RATE_LIMIT_CONFIGS[endpoint] ?? RATE_LIMIT_CONFIGS['default']!;
}