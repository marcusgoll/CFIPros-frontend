/**
 * Sanitize error messages before sending to analytics
 * Removes sensitive information like file paths, URLs, and credentials
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) {return '';}
  
  return message
    // Remove file paths (Windows and Unix)
    .replace(/[a-zA-Z]:\\[^\s]+/g, '[PATH]')
    .replace(/\/[^\s]+/g, '[PATH]')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '[URL]')
    // Remove potential API keys or tokens
    .replace(/[a-zA-Z0-9]{20,}/g, '[TOKEN]')
    // Remove email addresses
    .replace(/[^\s]+@[^\s]+\.[^\s]+/g, '[EMAIL]')
    // Remove IP addresses
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]')
    // Remove sensitive environment info
    .replace(/node_modules[^\s]*/g, '[NODE_MODULES]')
    .replace(/webpack[^\s]*/g, '[WEBPACK]')
    // Truncate if too long
    .slice(0, 200);
}

/**
 * Sanitize stack trace for safe logging
 */
export function sanitizeStackTrace(stack: string | undefined): string {
  if (!stack) {return '';}
  
  return stack
    .split('\n')
    .map(line => sanitizeErrorMessage(line))
    .join('\n')
    .slice(0, 1000); // Limit stack trace length
}

/**
 * Create safe error object for analytics
 */
export function createSafeErrorReport(error: Error) {
  return {
    message: sanitizeErrorMessage(error.message),
    name: error.name,
    stack: sanitizeStackTrace(error.stack),
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}