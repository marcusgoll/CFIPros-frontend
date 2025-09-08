// __tests__/__utils__/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';

// Mock providers wrapper for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_testing'}>
      {children}
    </ClerkProvider>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Test utilities for file creation
export const createMockFile = (
  name: string = 'test.pdf',
  type: string = 'application/pdf',
  size: number = 1024
): File => {
  const file = new File(['test content'], name, { type, lastModified: Date.now() });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Test utilities for form data creation
export const createMockFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

// Mock API response creator
export const createMockApiResponse = (
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Headers(headers),
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

// Security headers validation utility
export const expectSecurityHeaders = (headers: Headers) => {
  expect(headers.get('x-content-type-options')).toBe('nosniff');
  expect(headers.get('x-frame-options')).toBe('DENY');
  expect(headers.get('x-xss-protection')).toBe('1; mode=block');
};

// Authentication mock utilities
export const mockAuthenticatedUser = (overrides: any = {}) => ({
  userId: 'test_user_123',
  sessionId: 'test_session_123',
  isSignedIn: true,
  isLoaded: true,
  getToken: jest.fn().mockResolvedValue('test_token_123'),
  ...overrides,
});

export const mockUnauthenticatedUser = () => ({
  userId: null,
  sessionId: null,
  isSignedIn: false,
  isLoaded: true,
  getToken: jest.fn().mockResolvedValue(null),
});

// Performance testing utility
export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

// Wait for async operations in tests
export const waitForAsync = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };