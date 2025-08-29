/**
 * Tests for File Upload Security Module
 */

import { FileUploadSecurity, FileUploadRateLimiter, FileUploadCSP } from '@/lib/security/fileUpload';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock crypto.subtle for Node.js
global.crypto = {
  subtle: {
    digest: jest.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(Buffer.from(data));
      return hash.digest().buffer;
    }),
  },
} as any;

// Add arrayBuffer method to File prototype for tests
if (typeof File !== 'undefined') {
  File.prototype.arrayBuffer = File.prototype.arrayBuffer || function() {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(this);
    });
  };
}

describe('FileUploadSecurity', () => {
  describe('validateFile', () => {
    it('should reject empty files', async () => {
      const file = new File([], 'test.pdf', { type: 'application/pdf' });
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('should reject files with null bytes in filename', async () => {
      const file = new File(['content'], 'test\0.pdf', { type: 'application/pdf' });
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toBe('Filename contains null bytes');
    });

    it('should reject files with double extensions', async () => {
      const file = new File(['content'], 'test.pdf.exe', { type: 'application/pdf' });
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toBe('File has suspicious double extension');
    });

    it('should reject files with very long extensions', async () => {
      const file = new File(['content'], 'test.verylongextension', { type: 'application/pdf' });
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toBe('File extension is suspiciously long');
    });

    it('should reject files with MIME type mismatch', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'image/jpeg' });
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toContain('MIME type mismatch');
    });

    it('should reject files exceeding size limit', async () => {
      // Create a large file (11MB)
      const largeContent = new Uint8Array(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject files with very long filenames', async () => {
      const longName = 'a'.repeat(256) + '.pdf';
      const file = new File(['content'], longName, { type: 'application/pdf' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toBe('Filename is too long (max 255 characters)');
    });

    it('should accept valid PDF files with proper magic bytes', async () => {
      // PDF magic bytes: %PDF
      const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const file = new File([pdfContent], 'test.pdf', { type: 'application/pdf' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid JPEG files with proper magic bytes', async () => {
      // JPEG magic bytes
      const jpegContent = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const file = new File([jpegContent], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG files with proper magic bytes', async () => {
      // PNG magic bytes
      const pngContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const file = new File([pngContent], 'test.png', { type: 'image/png' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files with wrong magic bytes', async () => {
      // Wrong magic bytes for PDF
      const wrongContent = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const file = new File([wrongContent], 'test.pdf', { type: 'application/pdf' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toContain('File signature does not match declared type');
    });

    it('should reject PDF files with embedded JavaScript', async () => {
      // PDF with JavaScript keyword
      const pdfWithJS = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, // %PDF
        ...Array.from(new TextEncoder().encode('/JavaScript << /JS (alert("XSS")) >>'))
      ]);
      const file = new File([pdfWithJS], 'malicious.pdf', { type: 'application/pdf' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(false);
      expect(result.error).toContain('PDF contains potentially dangerous JavaScript');
    });

    it('should warn about hidden files', async () => {
      const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const file = new File([pdfContent], '.hidden.pdf', { type: 'application/pdf' });
      
      const result = await FileUploadSecurity.validateFile(file);
      
      expect(result.isSecure).toBe(true);
      expect(result.warnings).toContain('Hidden file detected');
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize unsafe characters', () => {
      const unsafe = 'file<>:"|?*.pdf';
      const sanitized = FileUploadSecurity.sanitizeFileName(unsafe);
      
      expect(sanitized).toMatch(/^file________\d+\.pdf$/);
    });

    it('should remove path traversal attempts', () => {
      const pathTraversal = '../../../etc/passwd';
      const sanitized = FileUploadSecurity.sanitizeFileName(pathTraversal);
      
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
    });

    it('should handle multiple dots', () => {
      const multiDot = 'file...test.pdf';
      const sanitized = FileUploadSecurity.sanitizeFileName(multiDot);
      
      expect(sanitized).toMatch(/^file\.test_\d+\.pdf$/);
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(200) + '.pdf';
      const sanitized = FileUploadSecurity.sanitizeFileName(longName);
      
      expect(sanitized.length).toBeLessThanOrEqual(70); // ~50 chars + timestamp + extension
    });

    it('should add timestamp for uniqueness', () => {
      const filename = 'test.pdf';
      const sanitized = FileUploadSecurity.sanitizeFileName(filename);
      
      expect(sanitized).toMatch(/^test_\d{13}\.pdf$/);
    });

    it('should handle filenames starting with dot', () => {
      const dotFile = '.gitignore';
      const sanitized = FileUploadSecurity.sanitizeFileName(dotFile);
      
      expect(sanitized).toMatch(/^_gitignore_\d+$/);
      expect(sanitized[0]).not.toBe('.');
    });
  });

  describe('generateFileMetadata', () => {
    it('should generate complete metadata for valid file', async () => {
      const content = new Uint8Array([1, 2, 3, 4, 5]);
      const file = new File([content], 'test.pdf', { type: 'application/pdf' });
      
      const metadata = await FileUploadSecurity.generateFileMetadata(file);
      
      expect(metadata.originalName).toBe('test.pdf');
      expect(metadata.sanitizedName).toMatch(/^test_\d{13}\.pdf$/);
      expect(metadata.mimeType).toBe('application/pdf');
      expect(metadata.extension).toBe('.pdf');
      expect(metadata.size).toBe(5);
      expect(metadata.hash).toBeDefined();
      expect(metadata.hash!.length).toBeGreaterThan(0); // Should have some hash
    });

    it('should generate consistent hash for same content', async () => {
      const content = new Uint8Array([1, 2, 3]);
      const file1 = new File([content], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File([content], 'file2.pdf', { type: 'application/pdf' });
      
      const metadata1 = await FileUploadSecurity.generateFileMetadata(file1);
      const metadata2 = await FileUploadSecurity.generateFileMetadata(file2);
      
      expect(metadata1.hash).toBe(metadata2.hash);
    });

    it('should generate different hash for different content', async () => {
      const content1 = new Uint8Array([1, 2, 3]);
      const content2 = new Uint8Array([4, 5, 6, 7, 8]); // Different size
      const file1 = new File([content1], 'file.pdf', { type: 'application/pdf' });
      const file2 = new File([content2], 'file.pdf', { type: 'application/pdf' });
      
      const metadata1 = await FileUploadSecurity.generateFileMetadata(file1);
      const metadata2 = await FileUploadSecurity.generateFileMetadata(file2);
      
      expect(metadata1.hash).not.toBe(metadata2.hash);
    });
  });
});

describe('FileUploadCSP', () => {
  describe('getUploadPageCSP', () => {
    it('should return comprehensive security headers', () => {
      const headers = FileUploadCSP.getUploadPageCSP();
      
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include proper CSP directives', () => {
      const headers = FileUploadCSP.getUploadPageCSP();
      const csp = headers['Content-Security-Policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });
});

describe('FileUploadRateLimiter', () => {
  beforeEach(() => {
    // Clear rate limiter state
    FileUploadRateLimiter.clearExpiredRecords();
  });

  describe('checkRateLimit', () => {
    it('should allow first upload', () => {
      const result = FileUploadRateLimiter.checkRateLimit('client1', 10, 1000);
      
      expect(result.allowed).toBe(true);
      expect(result.remainingUploads).toBe(9);
    });

    it('should track multiple uploads from same client', () => {
      const client = 'client2';
      
      // First upload
      let result = FileUploadRateLimiter.checkRateLimit(client, 3, 1000);
      expect(result.allowed).toBe(true);
      expect(result.remainingUploads).toBe(2);
      
      // Second upload
      result = FileUploadRateLimiter.checkRateLimit(client, 3, 1000);
      expect(result.allowed).toBe(true);
      expect(result.remainingUploads).toBe(1);
      
      // Third upload
      result = FileUploadRateLimiter.checkRateLimit(client, 3, 1000);
      expect(result.allowed).toBe(true);
      expect(result.remainingUploads).toBe(0);
      
      // Fourth upload - should be blocked
      result = FileUploadRateLimiter.checkRateLimit(client, 3, 1000);
      expect(result.allowed).toBe(false);
      expect(result.remainingUploads).toBe(0);
    });

    it('should allow uploads from different clients independently', () => {
      const result1 = FileUploadRateLimiter.checkRateLimit('client3', 1, 1000);
      const result2 = FileUploadRateLimiter.checkRateLimit('client4', 1, 1000);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should reset after time window expires', () => {
      jest.useFakeTimers();
      const client = 'client5';
      
      // Use up the limit
      FileUploadRateLimiter.checkRateLimit(client, 1, 1000);
      let result = FileUploadRateLimiter.checkRateLimit(client, 1, 1000);
      expect(result.allowed).toBe(false);
      
      // Advance time past the window
      jest.advanceTimersByTime(1001);
      
      // Should be allowed again
      result = FileUploadRateLimiter.checkRateLimit(client, 1, 1000);
      expect(result.allowed).toBe(true);
      
      jest.useRealTimers();
    });
  });

  describe('clearExpiredRecords', () => {
    it('should remove expired records', () => {
      jest.useFakeTimers();
      
      // Create some records
      FileUploadRateLimiter.checkRateLimit('expired1', 1, 1000);
      FileUploadRateLimiter.checkRateLimit('expired2', 1, 2000);
      FileUploadRateLimiter.checkRateLimit('active', 1, 5000);
      
      // Advance time
      jest.advanceTimersByTime(3000);
      
      // Clear expired records
      FileUploadRateLimiter.clearExpiredRecords();
      
      // Expired clients should be able to upload again
      const result1 = FileUploadRateLimiter.checkRateLimit('expired1', 1, 1000);
      const result2 = FileUploadRateLimiter.checkRateLimit('expired2', 1, 1000);
      const result3 = FileUploadRateLimiter.checkRateLimit('active', 1, 5000);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(false); // Still within window
      
      jest.useRealTimers();
    });
  });
});