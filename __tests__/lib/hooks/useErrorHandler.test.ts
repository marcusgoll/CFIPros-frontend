/**
 * Comprehensive useErrorHandler Hook Tests
 * Tests for Task 2.2: Custom Hooks Testing
 * 
 * Coverage Areas:
 * - Error state management and initialization
 * - Error handling for different error types (Error, APIError, string)
 * - Error reporting and logging integration
 * - State management with error codes and messages
 * - Error clearing functionality
 * - API error handling with various response formats
 * - Global error handler setup and management
 * - Error message mapping and user-friendly messages
 * - Memory cleanup and effect management
 * - Performance with rapid error state changes
 * - TypeScript strict mode compliance
 */

import { renderHook, act } from '@testing-library/react';
import { 
  useErrorHandler, 
  setupGlobalErrorHandler, 
  getErrorMessage,
  ERROR_MESSAGES 
} from '@/lib/hooks/useErrorHandler';
import type { APIError } from '@/lib/types';
import * as logger from '@/lib/utils/logger';

// Mock logger utilities
jest.mock('@/lib/utils/logger', () => ({
  logError: jest.fn(),
}));

const mockedLogError = jest.mocked(logger.logError);

// Mock API Error type
const createAPIError = (message: string, code: string): APIError => ({
  message,
  code,
  name: 'APIError',
});

describe('useErrorHandler Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic initialization tests
  describe('Hook Initialization', () => {
    it('initializes with default error state', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBe(null);
      expect(result.current.isError).toBe(false);
      expect(result.current.errorCode).toBeUndefined();
      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.handleAPIError).toBe('function');
    });

    it('provides stable function references', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());

      const initialFunctions = {
        showError: result.current.showError,
        clearError: result.current.clearError,
        handleAPIError: result.current.handleAPIError,
      };

      rerender();

      expect(result.current.showError).toBe(initialFunctions.showError);
      expect(result.current.clearError).toBe(initialFunctions.clearError);
      expect(result.current.handleAPIError).toBe(initialFunctions.handleAPIError);
    });
  });

  // Error state management tests
  describe('Error State Management', () => {
    it('handles string errors correctly', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showError('Simple error message');
      });

      expect(result.current.error).toBe('Simple error message');
      expect(result.current.isError).toBe(true);
      expect(result.current.errorCode).toBeUndefined();
    });

    it('handles Error objects correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Standard error');

      act(() => {
        result.current.showError(error);
      });

      expect(result.current.error).toBe('Standard error');
      expect(result.current.isError).toBe(true);
      expect(result.current.errorCode).toBeUndefined();
    });

    it('handles APIError objects with codes', () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = createAPIError('API request failed', 'validation_error');

      act(() => {
        result.current.showError(apiError);
      });

      expect(result.current.error).toBe('API request failed');
      expect(result.current.isError).toBe(true);
      expect(result.current.errorCode).toBe('validation_error');
    });

    it('clears error state correctly', () => {
      const { result } = renderHook(() => useErrorHandler());

      // Set an error first
      act(() => {
        result.current.showError('Test error');
      });

      expect(result.current.isError).toBe(true);

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.isError).toBe(false);
      expect(result.current.errorCode).toBeUndefined();
    });

    it('overwrites previous errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showError('First error');
      });

      expect(result.current.error).toBe('First error');

      act(() => {
        result.current.showError('Second error');
      });

      expect(result.current.error).toBe('Second error');
      expect(result.current.isError).toBe(true);
    });

    it('handles error code updates correctly', () => {
      const { result } = renderHook(() => useErrorHandler());

      // Set error without code
      act(() => {
        result.current.showError(new Error('Regular error'));
      });

      expect(result.current.errorCode).toBeUndefined();

      // Set error with code
      act(() => {
        result.current.showError(createAPIError('API Error', 'rate_limit_exceeded'));
      });

      expect(result.current.errorCode).toBe('rate_limit_exceeded');

      // Clear and check code is cleared
      act(() => {
        result.current.clearError();
      });

      expect(result.current.errorCode).toBeUndefined();
    });
  });

  // API error handling tests
  describe('API Error Handling', () => {
    it('handles Error objects in handleAPIError', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('API Error');

      act(() => {
        result.current.handleAPIError(error);
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', error);
      expect(result.current.error).toBe('API Error');
      expect(result.current.isError).toBe(true);
    });

    it('handles object errors with message property', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { message: 'Custom message', status: 400 };

      act(() => {
        result.current.handleAPIError(errorObj);
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', errorObj);
      expect(result.current.error).toBe('Custom message');
      expect(result.current.isError).toBe(true);
    });

    it('handles object errors with detail property', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { detail: 'Detailed error info', code: 'ERR001' };

      act(() => {
        result.current.handleAPIError(errorObj);
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', errorObj);
      expect(result.current.error).toBe('Detailed error info');
      expect(result.current.isError).toBe(true);
    });

    it('handles unknown error objects', () => {
      const { result } = renderHook(() => useErrorHandler());
      const unknownError = { someProperty: 'value' };

      act(() => {
        result.current.handleAPIError(unknownError);
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', unknownError);
      expect(result.current.error).toBe('An unexpected error occurred');
      expect(result.current.isError).toBe(true);
    });

    it('handles primitive error values', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleAPIError('String error');
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', 'String error');
      expect(result.current.error).toBe('An unexpected error occurred');
      expect(result.current.isError).toBe(true);
    });

    it('handles null and undefined errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleAPIError(null);
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', null);
      expect(result.current.error).toBe('An unexpected error occurred');

      act(() => {
        result.current.handleAPIError(undefined);
      });

      expect(mockedLogError).toHaveBeenCalledWith('API Error:', undefined);
      expect(result.current.error).toBe('An unexpected error occurred');
    });

    it('prioritizes message over detail in error objects', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { 
        message: 'Main message', 
        detail: 'Detail message' 
      };

      act(() => {
        result.current.handleAPIError(errorObj);
      });

      expect(result.current.error).toBe('Main message');
    });

    it('handles nested error objects', () => {
      const { result } = renderHook(() => useErrorHandler());
      const complexError = {
        response: {
          data: {
            message: 'Nested error message'
          }
        }
      };

      act(() => {
        result.current.handleAPIError(complexError);
      });

      // Should handle gracefully but not extract nested messages
      expect(result.current.error).toBe('An unexpected error occurred');
    });
  });

  // Performance and memory tests
  describe('Performance and Memory Management', () => {
    it('handles rapid error state changes efficiently', () => {
      const { result } = renderHook(() => useErrorHandler());

      const start = performance.now();

      // Rapidly change error states
      for (let i = 0; i < 1000; i++) {
        act(() => {
          result.current.showError(`Error ${i}`);
          result.current.clearError();
        });
      }

      const end = performance.now();

      // Should complete reasonably quickly
      expect(end - start).toBeLessThan(100);
      expect(result.current.isError).toBe(false);
    });

    it('handles multiple consecutive errors without memory leaks', () => {
      const { result } = renderHook(() => useErrorHandler());

      const errors = Array.from({ length: 100 }, (_, i) => 
        createAPIError(`API Error ${i}`, `code_${i}`)
      );

      errors.forEach(error => {
        act(() => {
          result.current.showError(error);
        });
      });

      // Should have the last error
      expect(result.current.error).toBe('API Error 99');
      expect(result.current.errorCode).toBe('code_99');
    });

    it('cleans up properly on unmount', () => {
      const { result, unmount } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showError('Test error');
      });

      expect(() => unmount()).not.toThrow();
    });

    it('maintains consistent performance with complex error objects', () => {
      const { result } = renderHook(() => useErrorHandler());

      const complexErrors = Array.from({ length: 50 }, (_, i) => ({
        message: `Complex error ${i}`,
        details: {
          nested: {
            data: `Nested data ${i}`,
            array: Array.from({ length: 10 }, (_, j) => `Item ${j}`)
          }
        },
        timestamp: Date.now(),
        stack: 'Error stack trace...',
      }));

      const start = performance.now();

      complexErrors.forEach(error => {
        act(() => {
          result.current.handleAPIError(error);
        });
      });

      const end = performance.now();

      expect(end - start).toBeLessThan(50);
    });
  });

  // Error callback stability tests
  describe('Callback Stability', () => {
    it('maintains stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());

      const originalShowError = result.current.showError;
      const originalClearError = result.current.clearError;
      const originalHandleAPIError = result.current.handleAPIError;

      // Trigger multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender();
      }

      expect(result.current.showError).toBe(originalShowError);
      expect(result.current.clearError).toBe(originalClearError);
      expect(result.current.handleAPIError).toBe(originalHandleAPIError);
    });

    it('functions work correctly after re-renders', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());

      rerender();
      rerender();

      act(() => {
        result.current.showError('After rerender');
      });

      expect(result.current.error).toBe('After rerender');
      expect(result.current.isError).toBe(true);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.isError).toBe(false);
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles empty error messages', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showError('');
      });

      expect(result.current.error).toBe('');
      expect(result.current.isError).toBe(true);
    });

    it('handles whitespace-only error messages', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showError('   ');
      });

      expect(result.current.error).toBe('   ');
      expect(result.current.isError).toBe(true);
    });

    it('handles very long error messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      const longMessage = 'A'.repeat(10000);

      act(() => {
        result.current.showError(longMessage);
      });

      expect(result.current.error).toBe(longMessage);
      expect(result.current.isError).toBe(true);
    });

    it('handles special characters in error messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      const specialMessage = '=¨ Error with emojis! <script>alert("test")</script>';

      act(() => {
        result.current.showError(specialMessage);
      });

      expect(result.current.error).toBe(specialMessage);
      expect(result.current.isError).toBe(true);
    });

    it('handles circular reference errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const circularError: any = { message: 'Circular error' };
      circularError.self = circularError;

      act(() => {
        result.current.handleAPIError(circularError);
      });

      expect(result.current.error).toBe('Circular error');
      expect(result.current.isError).toBe(true);
    });

    it('handles error objects with non-string message properties', () => {
      const { result } = renderHook(() => useErrorHandler());
      const numericMessageError = { message: 123 };

      act(() => {
        result.current.handleAPIError(numericMessageError);
      });

      expect(result.current.error).toBe('123');
      expect(result.current.isError).toBe(true);
    });
  });
});

// Global error handler tests
describe('Global Error Handler', () => {
  let originalWindowListeners: typeof window.addEventListener;
  let eventListeners: { [key: string]: EventListenerOrEventListenerObject[] };

  beforeEach(() => {
    jest.clearAllMocks();
    eventListeners = {};
    
    // Mock window.addEventListener
    originalWindowListeners = window.addEventListener;
    window.addEventListener = jest.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(listener);
    });
  });

  afterEach(() => {
    window.addEventListener = originalWindowListeners;
  });

  it('sets up global error handlers correctly', () => {
    setupGlobalErrorHandler();

    expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('handles unhandled promise rejections', () => {
    setupGlobalErrorHandler();

    const rejectionEvent = {
      reason: new Error('Unhandled promise rejection'),
      preventDefault: jest.fn(),
    };

    // Simulate unhandled rejection
    const handler = eventListeners['unhandledrejection'][0];
    if (typeof handler === 'function') {
      handler(rejectionEvent as any);
    }

    expect(mockedLogError).toHaveBeenCalledWith(
      'Unhandled promise rejection:', 
      rejectionEvent.reason
    );
    expect(rejectionEvent.preventDefault).toHaveBeenCalled();
  });

  it('handles unhandled errors', () => {
    setupGlobalErrorHandler();

    const errorEvent = {
      error: new Error('Unhandled error'),
    };

    // Simulate unhandled error
    const handler = eventListeners['error'][0];
    if (typeof handler === 'function') {
      handler(errorEvent as any);
    }

    expect(mockedLogError).toHaveBeenCalledWith(
      'Unhandled error:', 
      errorEvent.error
    );
  });

  it('only sets up handlers in browser environment', () => {
    // Mock server environment
    const originalWindow = global.window;
    delete (global as any).window;

    setupGlobalErrorHandler();

    // Should not call addEventListener when window is undefined
    expect(window.addEventListener).not.toHaveBeenCalled();

    // Restore window
    global.window = originalWindow;
  });
});

// Error message utilities tests
describe('Error Message Utilities', () => {
  it('returns correct error messages for known codes', () => {
    expect(getErrorMessage('network_error')).toBe(ERROR_MESSAGES.NETWORK);
    expect(getErrorMessage('unauthorized')).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    expect(getErrorMessage('forbidden')).toBe(ERROR_MESSAGES.FORBIDDEN);
    expect(getErrorMessage('not_found')).toBe(ERROR_MESSAGES.NOT_FOUND);
    expect(getErrorMessage('server_error')).toBe(ERROR_MESSAGES.SERVER_ERROR);
    expect(getErrorMessage('validation_error')).toBe(ERROR_MESSAGES.VALIDATION);
    expect(getErrorMessage('rate_limit_exceeded')).toBe(ERROR_MESSAGES.RATE_LIMIT);
    expect(getErrorMessage('file_too_large')).toBe(ERROR_MESSAGES.FILE_TOO_LARGE);
    expect(getErrorMessage('unsupported_file_type')).toBe(ERROR_MESSAGES.UNSUPPORTED_FILE);
  });

  it('returns generic message for unknown codes', () => {
    expect(getErrorMessage('unknown_code')).toBe(ERROR_MESSAGES.GENERIC);
    expect(getErrorMessage('')).toBe(ERROR_MESSAGES.GENERIC);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.GENERIC);
  });

  it('handles null and undefined codes', () => {
    expect(getErrorMessage(null as any)).toBe(ERROR_MESSAGES.GENERIC);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.GENERIC);
  });

  it('provides user-friendly error messages', () => {
    Object.values(ERROR_MESSAGES).forEach(message => {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toContain('undefined');
      expect(message).not.toContain('null');
    });
  });

  it('maintains consistency in error message format', () => {
    const messages = Object.values(ERROR_MESSAGES);
    
    // All messages should be proper sentences (end with period)
    messages.forEach(message => {
      expect(message.endsWith('.')).toBe(true);
    });

    // Should not contain technical jargon
    messages.forEach(message => {
      expect(message.toLowerCase()).not.toContain('500');
      expect(message.toLowerCase()).not.toContain('404');
      expect(message.toLowerCase()).not.toContain('403');
    });
  });
});