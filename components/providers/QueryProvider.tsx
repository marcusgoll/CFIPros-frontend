'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance that's stable for the component lifecycle
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times
        retry: (failureCount, error) => {
          // Don't retry on auth errors (401/403)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status === 401 || status === 403) {
              return false;
            }
          }
          return failureCount < 3;
        },
        // Refetch on window focus in production
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        // Retry mutations once on network errors
        retry: (failureCount, error) => {
          if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as { message: string }).message;
            if (/network/i.test(message) && failureCount < 1) {
              return true;
            }
          }
          return false;
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}