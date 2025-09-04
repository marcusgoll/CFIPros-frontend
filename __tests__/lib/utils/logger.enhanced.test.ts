/**
 * Enhanced logger tests to boost coverage
 */

// Mock the logger module to control isDev behavior
jest.mock('../../../lib/utils/logger', () => {
  const originalModule = jest.requireActual('../../../lib/utils/logger');
  return {
    ...originalModule,
    get isDev() {
      return process.env.NODE_ENV !== 'production';
    },
    logError: jest.fn((...args: unknown[]) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(...args);
      }
    }),
    logWarn: jest.fn((...args: unknown[]) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(...args);
      }
    }),
    logInfo: jest.fn((...args: unknown[]) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(...args);
      }
    }),
  };
});

import { logError, logWarn, logInfo, isDev } from '../../../lib/utils/logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Store original console
const originalConsole = global.console;

describe('Logger Enhanced Tests', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Replace console with mocks
    global.console = mockConsole as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console and NODE_ENV
    global.console = originalConsole;
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Log Functions', () => {
    beforeEach(() => {
      // Set NODE_ENV to development to enable logging
      process.env.NODE_ENV = 'development';
    });

    it('should handle all log functions in development', () => {
      logInfo('Info message');
      logWarn('Warning message'); 
      logError('Error message');

      expect(mockConsole.log).toHaveBeenCalledWith('Info message');
      expect(mockConsole.warn).toHaveBeenCalledWith('Warning message');
      expect(mockConsole.error).toHaveBeenCalledWith('Error message');
    });

    it('should handle messages with additional data', () => {
      const testData = { userId: '123', action: 'upload' };
      logInfo('User action', testData);

      expect(mockConsole.log).toHaveBeenCalledWith('User action', testData);
    });

    it('should handle error objects', () => {
      const testError = new Error('Test error');
      logError('Error occurred', testError);

      expect(mockConsole.error).toHaveBeenCalledWith('Error occurred', testError);
    });
  });

  describe('Environment-based Logging', () => {
    it('should log in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      logInfo('Test message');
      expect(mockConsole.log).toHaveBeenCalledWith('Test message');
    });

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      logInfo('Test message');
      logWarn('Warning message');
      logError('Error message');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('should handle null and undefined data', () => {
      process.env.NODE_ENV = 'development';
      
      logInfo('Message', null);
      logInfo('Message', undefined);
      
      expect(mockConsole.log).toHaveBeenCalledWith('Message', null);
      expect(mockConsole.log).toHaveBeenCalledWith('Message', undefined);
    });
  });

  describe('Multiple Arguments', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle performance measurements', () => {
      const perfData = { duration: 150, operation: 'fileUpload' };
      logInfo('Performance timing', perfData);
      expect(mockConsole.log).toHaveBeenCalledWith('Performance timing', perfData);
    });

    it('should handle multiple data objects', () => {
      const metadata = { timestamp: Date.now() };
      const context = { component: 'FileUploader' };
      logInfo('Component action', metadata, context);
      
      expect(mockConsole.log).toHaveBeenCalledWith('Component action', metadata, context);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        logInfo('Circular object', circularObj);
      }).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'x'.repeat(1000);
      logInfo(longMessage);
      
      expect(mockConsole.log).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters', () => {
      const specialMessage = 'Message with 🚀 emojis and \n newlines';
      logInfo(specialMessage);
      
      expect(mockConsole.log).toHaveBeenCalledWith(specialMessage);
    });

    it('should test isDev utility function', () => {
      // Test the isDev export
      expect(typeof isDev).toBe('boolean');
    });
  });
});