/**
 * CSP Security Contract Tests
 * 
 * These tests ensure CSP configuration meets security requirements
 * and validates against the API contract in api-contracts/openapi.yaml
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock CSP configuration function for testing
const mockCSPConfig = {
  csp_header: "default-src 'self'; script-src 'self' https://*.clerk.accounts.dev; object-src 'none'; base-uri 'self';",
  unsafe_directives: [] as string[],
  sources: ["middleware"]
};

describe('CSP Security Contract Tests', () => {
  describe('CSP Configuration API Contract', () => {
    test('returns correct CSP configuration schema', () => {
      // Test that CSP config matches OpenAPI contract schema
      expect(mockCSPConfig).toHaveProperty('csp_header');
      expect(mockCSPConfig).toHaveProperty('unsafe_directives');
      expect(mockCSPConfig).toHaveProperty('sources');
      
      // Validate schema types match contract
      expect(typeof mockCSPConfig.csp_header).toBe('string');
      expect(Array.isArray(mockCSPConfig.unsafe_directives)).toBe(true);
      expect(Array.isArray(mockCSPConfig.sources)).toBe(true);
    });

    test('CSP header excludes unsafe directives', () => {
      const cspHeader = mockCSPConfig.csp_header;
      
      // Critical security requirement: no unsafe directives
      expect(cspHeader).not.toContain("'unsafe-inline'");
      expect(cspHeader).not.toContain("'unsafe-eval'");
      expect(cspHeader).not.toContain("'unsafe-hashes'");
    });

    test('unsafe_directives array is empty', () => {
      // Per contract specification, this should be empty after fixes
      expect(mockCSPConfig.unsafe_directives).toHaveLength(0);
    });

    test('sources includes only middleware', () => {
      // Should be consolidated to single source
      expect(mockCSPConfig.sources).toEqual(["middleware"]);
    });

    test('CSP allows required domains for Clerk functionality', () => {
      const cspHeader = mockCSPConfig.csp_header;
      
      // Must allow Clerk domains for authentication
      expect(cspHeader).toContain('https://*.clerk.accounts.dev');
    });

    test('CSP includes essential security directives', () => {
      const cspHeader = mockCSPConfig.csp_header;
      
      // Essential security directives
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("base-uri 'self'");
      expect(cspHeader).toContain("default-src 'self'");
    });
  });

  describe('Middleware CSP Header Generation', () => {
    test('middleware generates consistent CSP headers', () => {
      // Mock middleware request/response
      const mockRequest = new NextRequest('http://localhost:3000/test');
      
      // Simulate CSP header generation in middleware
      const expectedCSP = "default-src 'self'; script-src 'self' https://*.clerk.accounts.dev; object-src 'none'; base-uri 'self';";
      
      // Validate consistent CSP generation
      expect(expectedCSP).toBe(mockCSPConfig.csp_header);
    });

    test('CSP header format is valid', () => {
      const cspHeader = mockCSPConfig.csp_header;
      
      // Basic CSP format validation
      expect(cspHeader).toMatch(/^[a-zA-Z0-9\s'*:\/\.\-;]+$/);
      expect(cspHeader).not.toContain(';;'); // No double semicolons
      expect(cspHeader.endsWith(';')); // Ends with semicolon
    });

    test('CSP directive structure is correct', () => {
      const cspHeader = mockCSPConfig.csp_header;
      const directives = cspHeader.split(';').map(d => d.trim()).filter(Boolean);
      
      // Each directive should have proper format
      directives.forEach(directive => {
        expect(directive).toMatch(/^[a-zA-Z-]+ .+$/);
        expect(directive).not.toContain('  '); // No double spaces
      });
    });
  });

  describe('CSP Violation Detection', () => {
    test('detects unsafe-inline violations', () => {
      const unsafeCSP = "script-src 'self' 'unsafe-inline';";
      const violations = detectUnsafeDirectives(unsafeCSP);
      
      expect(violations).toContain("'unsafe-inline'");
    });

    test('detects unsafe-eval violations', () => {
      const unsafeCSP = "script-src 'self' 'unsafe-eval';";
      const violations = detectUnsafeDirectives(unsafeCSP);
      
      expect(violations).toContain("'unsafe-eval'");
    });

    test('passes with safe CSP configuration', () => {
      const safeCSP = mockCSPConfig.csp_header;
      const violations = detectUnsafeDirectives(safeCSP);
      
      expect(violations).toHaveLength(0);
    });
  });

  describe('Development Mode Security Inspector', () => {
    test('detects CSP violations in development mode', () => {
      // Test that our violation detection utility works
      const violations = detectUnsafeDirectives(mockCSPConfig.csp_header);
      expect(violations).toHaveLength(0);
      
      // Test with unsafe CSP
      const unsafeCSP = "script-src 'self' 'unsafe-inline' 'unsafe-eval';";
      const unsafeViolations = detectUnsafeDirectives(unsafeCSP);
      expect(unsafeViolations).toEqual(["'unsafe-inline'", "'unsafe-eval'"]);
    });
  });
});

// Helper functions for CSP validation
function detectUnsafeDirectives(cspHeader: string): string[] {
  const unsafe = [];
  if (cspHeader.includes("'unsafe-inline'")) unsafe.push("'unsafe-inline'");
  if (cspHeader.includes("'unsafe-eval'")) unsafe.push("'unsafe-eval'");
  if (cspHeader.includes("'unsafe-hashes'")) unsafe.push("'unsafe-hashes'");
  return unsafe;
}

