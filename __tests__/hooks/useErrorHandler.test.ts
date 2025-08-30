/**
 * Tests for useErrorHandler hook
 * Testing error handling logic and state management
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, getErrorMessage, ERROR_MESSAGES } from '@/lib/hooks/useErrorHandler';
import { APIError } from '@/lib/api/errors';

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.errorCode).toBeUndefined();
  });

  it('should handle string errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.showError('Test error message');
    });
    
    expect(result.current.error).toBe('Test error message');
    expect(result.current.isError).toBe(true);
    expect(result.current.errorCode).toBeUndefined();
  });

  it('should handle Error objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Standard error message');
    
    act(() => {
      result.current.showError(error);
    });
    
    expect(result.current.error).toBe('Standard error message');
    expect(result.current.isError).toBe(true);
    expect(result.current.errorCode).toBeUndefined();
  });

  it('should handle APIError objects with code', () => {
    const { result } = renderHook(() => useErrorHandler());
    const apiError = new APIError('validation_error', 400, 'Validation failed');
    
    act(() => {
      result.current.showError(apiError);
    });
    
    expect(result.current.error).toBe('Validation failed');
    expect(result.current.isError).toBe(true);
    expect(result.current.errorCode).toBe('validation_error');
  });

  it('should clear errors', () => {
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
    
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.errorCode).toBeUndefined();
  });

  it('should handle API errors with handleAPIError', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    // Mock console.error to avoid output during tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Test with Error object
    act(() => {
      result.current.handleAPIError(new Error('API Error'));
    });
    
    expect(result.current.error).toBe('API Error');
    expect(result.current.isError).toBe(true);
    
    // Test with object containing message
    act(() => {
      result.current.handleAPIError({ message: 'Custom error message' });
    });
    
    expect(result.current.error).toBe('Custom error message');
    
    // Test with object containing detail
    act(() => {
      result.current.handleAPIError({ detail: 'Error details' });
    });
    
    expect(result.current.error).toBe('Error details');
    
    // Test with unknown error type
    act(() => {
      result.current.handleAPIError('string error');
    });
    
    expect(result.current.error).toBe('An unexpected error occurred');
    
    consoleSpy.mockRestore();
  });

  it('should handle multiple consecutive errors', () => {
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
});

describe('getErrorMessage', () => {
  it('should return correct messages for known error codes', () => {
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

  it('should return generic message for unknown error codes', () => {
    expect(getErrorMessage('unknown_error')).toBe(ERROR_MESSAGES.GENERIC);
    expect(getErrorMessage('')).toBe(ERROR_MESSAGES.GENERIC);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.GENERIC);
  });
});

describe('ERROR_MESSAGES', () => {
  it('should contain all expected error messages', () => {
    expect(ERROR_MESSAGES.NETWORK).toBeDefined();
    expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
    expect(ERROR_MESSAGES.FORBIDDEN).toBeDefined();
    expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined();
    expect(ERROR_MESSAGES.SERVER_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.VALIDATION).toBeDefined();
    expect(ERROR_MESSAGES.RATE_LIMIT).toBeDefined();
    expect(ERROR_MESSAGES.FILE_TOO_LARGE).toBeDefined();
    expect(ERROR_MESSAGES.UNSUPPORTED_FILE).toBeDefined();
    expect(ERROR_MESSAGES.GENERIC).toBeDefined();
  });

  it('should have user-friendly messages', () => {
    // Test that messages are descriptive and user-friendly
    expect(ERROR_MESSAGES.NETWORK).toContain('Network');
    expect(ERROR_MESSAGES.UNAUTHORIZED).toContain('authorized');
    expect(ERROR_MESSAGES.FILE_TOO_LARGE).toContain('too large');
    expect(ERROR_MESSAGES.RATE_LIMIT).toContain('Too many requests');
  });
});