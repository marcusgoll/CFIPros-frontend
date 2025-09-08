/**
 * MSW Setup for Frontend Integration Tests
 * Configures Mock Service Worker for testing API interactions
 */

import { server } from './server';

// Start server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn on unhandled requests instead of failing
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});

// Export for use in individual tests
export { server };