/**
 * Enhanced logger tests to boost coverage
 */
import { Logger, LogLevel } from '../../../lib/utils/logger';

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
  beforeEach(() => {
    // Replace console with mocks
    global.console = mockConsole as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console
    global.console = originalConsole;
  });

  describe('Log Levels', () => {
    it('should handle all log levels', () => {
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');

      expect(mockConsole.debug).toHaveBeenCalledWith('[DEBUG]', 'Debug message');
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', 'Info message');
      expect(mockConsole.warn).toHaveBeenCalledWith('[WARN]', 'Warning message');
      expect(mockConsole.error).toHaveBeenCalledWith('[ERROR]', 'Error message');
    });

    it('should handle messages with additional data', () => {
      const testData = { userId: '123', action: 'upload' };
      Logger.info('User action', testData);

      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', 'User action', testData);
    });

    it('should handle error objects', () => {
      const testError = new Error('Test error');
      Logger.error('Error occurred', testError);

      expect(mockConsole.error).toHaveBeenCalledWith('[ERROR]', 'Error occurred', testError);
    });
  });

  describe('Log Formatting', () => {
    it('should format messages consistently', () => {
      Logger.info('Test message');
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', 'Test message');
    });

    it('should handle empty messages', () => {
      Logger.info('');
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', '');
    });

    it('should handle null and undefined data', () => {
      Logger.info('Message', null);
      Logger.info('Message', undefined);
      
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', 'Message', null);
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', 'Message', undefined);
    });
  });

  describe('Performance Logging', () => {
    it('should handle performance measurements', () => {
      Logger.debug('Performance timing', { duration: 150, operation: 'fileUpload' });
      expect(mockConsole.debug).toHaveBeenCalledWith('[DEBUG]', 'Performance timing', { duration: 150, operation: 'fileUpload' });
    });

    it('should handle multiple data objects', () => {
      const metadata = { timestamp: Date.now() };
      const context = { component: 'FileUploader' };
      Logger.info('Component action', metadata, context);
      
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', 'Component action', metadata, context);
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        Logger.info('Circular object', circularObj);
      }).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      Logger.info(longMessage);
      
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', longMessage);
    });

    it('should handle special characters', () => {
      const specialMessage = 'Message with 🚀 emojis and \n newlines';
      Logger.info(specialMessage);
      
      expect(mockConsole.info).toHaveBeenCalledWith('[INFO]', specialMessage);
    });
  });
});