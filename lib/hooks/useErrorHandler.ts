/**
 * Standardized error handling hook
 * Provides consistent error handling across the application
 */

import { useCallback, useState } from 'react';
import { logError } from '@/lib/utils/logger';
import type { APIError } from '@/lib/types';

interface ErrorState {
  error: string | null;
  isError: boolean;
  errorCode: string | undefined;
}

interface UseErrorHandlerReturn {
  error: string | null;
  isError: boolean;
  errorCode: string | undefined;
  showError: (error: Error | APIError | string) => void;
  clearError: () => void;
  handleAPIError: (error: unknown) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorCode: undefined,
  });

  const showError = useCallback((error: Error | APIError | string) => {
    let message: string;
    let code: string | undefined;

    if (typeof error === 'string') {
      message = error;
    } else if ('code' in error && typeof error.code === 'string') {
      // APIError instance
      message = error.message;
      code = error.code;
    } else {
      // Standard Error
      message = error.message;
    }

    setErrorState({
      error: message,
      isError: true,
      errorCode: code,
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorCode: undefined,
    });
  }, []);

  const handleAPIError = useCallback((error: unknown) => {
    logError('API Error:', error);

    // Handle different error types
    if (error instanceof Error) {
      showError(error);
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      if ('message' in errorObj && errorObj['message']) {
        showError(String(errorObj['message']));
      } else if ('detail' in errorObj && errorObj['detail']) {
        showError(String(errorObj['detail']));
      } else {
        showError('An unexpected error occurred');
      }
    } else {
      showError('An unexpected error occurred');
    }
  }, [showError]);

  return {
    error: errorState.error,
    isError: errorState.isError,
    errorCode: errorState.errorCode,
    showError,
    clearError,
    handleAPIError,
  };
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      logError('Unhandled promise rejection:', event.reason);
      
      // In a real app, send to monitoring service
      // Sentry.captureException(event.reason);
      
      // Prevent the default browser error handling
      event.preventDefault();
    });

    window.addEventListener('error', (event) => {
      logError('Unhandled error:', event.error);
      
      // In a real app, send to monitoring service
      // Sentry.captureException(event.error);
    });
  }
}

/**
 * Standardized error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  FILE_TOO_LARGE: 'The file is too large. Please choose a smaller file.',
  UNSUPPORTED_FILE: 'This file type is not supported.',
  GENERIC: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Get user-friendly error message based on error code
 */
export function getErrorMessage(code?: string): string {
  switch (code) {
    case 'network_error':
      return ERROR_MESSAGES.NETWORK;
    case 'unauthorized':
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 'forbidden':
      return ERROR_MESSAGES.FORBIDDEN;
    case 'not_found':
      return ERROR_MESSAGES.NOT_FOUND;
    case 'server_error':
      return ERROR_MESSAGES.SERVER_ERROR;
    case 'validation_error':
      return ERROR_MESSAGES.VALIDATION;
    case 'rate_limit_exceeded':
      return ERROR_MESSAGES.RATE_LIMIT;
    case 'file_too_large':
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    case 'unsupported_file_type':
      return ERROR_MESSAGES.UNSUPPORTED_FILE;
    default:
      return ERROR_MESSAGES.GENERIC;
  }
}
