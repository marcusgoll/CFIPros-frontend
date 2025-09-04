import React from 'react';
import { render } from '@testing-library/react';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { QueryClient } from '@tanstack/react-query';

// Mock QueryClient to avoid actual network requests
const mockQueryClient = {
  setDefaultOptions: jest.fn(),
  getQueryCache: jest.fn(() => ({ clear: jest.fn() })),
  getMutationCache: jest.fn(() => ({ clear: jest.fn() })),
  clear: jest.fn(),
  mount: jest.fn(),
  unmount: jest.fn(),
  invalidateQueries: jest.fn(),
  prefetchQuery: jest.fn(),
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  removeQueries: jest.fn(),
  resumePausedMutations: jest.fn(),
};

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation((config) => {
    // Store the config for testing
    mockQueryClient._config = config;
    return mockQueryClient;
  }),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

const MockedQueryClient = QueryClient as jest.MockedClass<typeof QueryClient>;

describe('QueryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create QueryClient with correct configuration', () => {
    // Render the QueryProvider to trigger QueryClient creation
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    );

    expect(MockedQueryClient).toHaveBeenCalledWith({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false, // process.env.NODE_ENV === 'production' evaluates to false in test
          retry: expect.any(Function),
        },
        mutations: {
          retry: expect.any(Function),
        },
      },
    });
  });

  it('should configure retry logic correctly', () => {
    // Create a QueryProvider instance to test retry functions
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    );

    const config = MockedQueryClient.mock.calls[0]?.[0];
    expect(config).toBeDefined();
    
    const queryRetryFn = config?.defaultOptions?.queries?.retry;
    const mutationRetryFn = config?.defaultOptions?.mutations?.retry;

    expect(queryRetryFn).toBeDefined();
    expect(mutationRetryFn).toBeDefined();

    if (queryRetryFn && mutationRetryFn) {
      // Test query retry logic - matches actual implementation
      expect(queryRetryFn(0, { status: 401 })).toBe(false); // Don't retry 401
      expect(queryRetryFn(0, { status: 403 })).toBe(false); // Don't retry 403  
      expect(queryRetryFn(0, { status: 500 })).toBe(true); // Retry 500
      expect(queryRetryFn(3, { status: 500 })).toBe(false); // Stop after 3 attempts

      // Test mutation retry logic - matches actual implementation
      expect(mutationRetryFn(0, { message: 'Network error' })).toBe(true); // Retry network errors
      expect(mutationRetryFn(1, { message: 'Network error' })).toBe(false); // Only retry once
      expect(mutationRetryFn(0, { message: 'Validation error' })).toBe(false); // Don't retry non-network
    }
  });

  it('should handle network errors in retry logic', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    );

    const config = MockedQueryClient.mock.calls[0]?.[0];
    const queryRetryFn = config?.defaultOptions?.queries?.retry;
    const mutationRetryFn = config?.defaultOptions?.mutations?.retry;

    if (queryRetryFn && mutationRetryFn) {
      // Test with network errors (no status property)
      expect(queryRetryFn(0, new Error('Network error'))).toBe(true);
      expect(queryRetryFn(3, new Error('Network error'))).toBe(false);
      expect(mutationRetryFn(0, { message: 'network timeout' })).toBe(true);
      expect(mutationRetryFn(1, { message: 'network timeout' })).toBe(false);
    }
  });
});