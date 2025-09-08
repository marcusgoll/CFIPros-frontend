/**
 * Mock Service Worker Server Setup
 * Provides API mocking for frontend integration tests
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';

// Mock API responses based on OpenAPI contract
const handlers = [
  // Health check endpoint
  http.get('/health', () => {
    return HttpResponse.json({ status: 'healthy' }, { status: 200 });
  }),

  // File extraction endpoint - Success
  http.post('/api/extractor/extract', async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Simulate processing delay
    await delay(100);
    
    return HttpResponse.json({
      batch_id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
      files_count: files.length,
      files: files.map((file, index) => ({
        id: `file_${index + 1}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'queued'
      }))
    }, { status: 202 });
  }),

  // File extraction endpoint - Rate limited
  http.post('/api/extractor/extract-rate-limited', () => {
    return HttpResponse.json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: 3600
    }, { status: 429 });
  }),

  // File extraction endpoint - Invalid file type
  http.post('/api/extractor/extract-invalid', () => {
    return HttpResponse.json({
      error: 'Invalid file type',
      code: 'INVALID_FILE_TYPE',
      allowed_types: ['application/pdf', 'image/jpeg', 'image/png']
    }, { status: 400 });
  }),

  // Extraction results endpoint - Processing
  http.get('/api/extractor/results/:batchId', ({ params }) => {
    const { batchId } = params;
    
    return HttpResponse.json({
      batch_id: batchId,
      status: 'processing',
      progress: 0.5,
      estimated_completion: new Date(Date.now() + 15000).toISOString(),
      files_processed: 1,
      files_total: 2
    }, { status: 200 });
  }),

  // Extraction results endpoint - Completed
  http.get('/api/extractor/results/:batchId/completed', ({ params }) => {
    const { batchId } = params;
    
    return HttpResponse.json({
      batch_id: batchId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      results: [
        {
          file_id: 'file_1',
          file_name: 'test.pdf',
          status: 'success',
          extracted_data: {
            acs_sections: [
              {
                section: 'PA.I.A',
                task: 'Certificates and Documents',
                elements: ['Check certificates', 'Verify documents']
              }
            ]
          }
        }
      ]
    }, { status: 200 });
  }),

  // Authentication endpoints
  http.get('/api/v1/auth/session', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }
    
    return HttpResponse.json({
      user: {
        id: 'test_user_123',
        email: 'test@cfipros.com',
        first_name: 'Test',
        last_name: 'User',
        org_id: 'org_test_123',
        org_role: 'student'
      },
      session: {
        id: 'session_123',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      }
    }, { status: 200 });
  }),

  http.post('/api/v1/auth/refresh', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }
    
    return HttpResponse.json({
      token: 'new_jwt_token_123',
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }, { status: 200 });
  }),

  http.get('/api/v1/auth/status', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    return HttpResponse.json({
      authenticated: !!authHeader,
      user_id: authHeader ? 'test_user_123' : null
    }, { status: 200 });
  }),

  // Clerk webhook endpoint
  http.post('/api/v1/auth/clerk/webhook', async ({ request }) => {
    const signature = request.headers.get('svix-signature');
    
    if (!signature) {
      return HttpResponse.json({
        error: 'Missing webhook signature',
        code: 'MISSING_WEBHOOK_HEADERS'
      }, { status: 400 });
    }
    
    const payload = await request.json();
    
    return HttpResponse.json({
      success: true,
      processed_event: payload.type
    }, { status: 200 });
  }),

  // Next.js API routes (proxy layer)
  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    await delay(200);
    
    return HttpResponse.json({
      message: 'Files uploaded successfully',
      batch_id: `batch_proxy_${Date.now()}`,
      files_count: files.length
    }, { status: 200 });
  }),

  http.get('/api/results/:batchId', ({ params }) => {
    return HttpResponse.json({
      batch_id: params.batchId,
      status: 'processing',
      message: 'Processing via Next.js proxy'
    }, { status: 200 });
  }),

  // Error scenarios
  http.get('/api/error/500', () => {
    return HttpResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }),

  http.get('/api/error/timeout', async () => {
    await delay(30000); // 30 second delay to simulate timeout
    return HttpResponse.json({ message: 'This should timeout' });
  }),

  // Dynamic handlers for different test scenarios
  http.all('*', ({ request }) => {
    // Catch-all handler for unmatched requests
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json({
      error: 'Not Found',
      code: 'ENDPOINT_NOT_FOUND'
    }, { status: 404 });
  })
];

// Create the server instance
export const server = setupServer(...handlers);

// Helper functions for dynamic handler management
export const addHandler = (handler: any) => {
  server.use(handler);
};

export const resetHandlers = () => {
  server.resetHandlers(...handlers);
};

// Mock response builders for different scenarios
export const mockResponses = {
  extractionSuccess: (files: File[]) => HttpResponse.json({
    batch_id: `batch_${Date.now()}`,
    status: 'processing',
    estimated_completion: new Date(Date.now() + 30000).toISOString(),
    files_count: files.length
  }, { status: 202 }),

  extractionError: (errorCode: string, message: string) => HttpResponse.json({
    error: message,
    code: errorCode
  }, { status: 400 }),

  extractionRateLimit: () => HttpResponse.json({
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    retry_after: 3600
  }, { status: 429 }),

  authSuccess: (userId: string) => HttpResponse.json({
    user: {
      id: userId,
      email: `${userId}@cfipros.com`,
      first_name: 'Test',
      last_name: 'User'
    },
    session: {
      id: `session_${userId}`,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }
  }, { status: 200 }),

  authError: () => HttpResponse.json({
    error: 'Unauthorized',
    code: 'UNAUTHORIZED'
  }, { status: 401 }),

  processingResults: (batchId: string, progress: number = 0.5) => HttpResponse.json({
    batch_id: batchId,
    status: progress >= 1 ? 'completed' : 'processing',
    progress,
    files_processed: Math.floor(progress * 2),
    files_total: 2
  }, { status: 200 }),

  completedResults: (batchId: string) => HttpResponse.json({
    batch_id: batchId,
    status: 'completed',
    completed_at: new Date().toISOString(),
    results: [
      {
        file_id: 'file_1',
        file_name: 'test.pdf',
        status: 'success',
        extracted_data: {
          acs_sections: [
            {
              section: 'PA.I.A',
              task: 'Certificates and Documents',
              elements: ['Check certificates', 'Verify documents']
            }
          ]
        }
      }
    ]
  }, { status: 200 })
};

// Test scenario helpers
export const testScenarios = {
  setupSuccessfulFlow: () => {
    resetHandlers();
    // All default handlers are already set up for successful flow
  },

  setupRateLimitedFlow: () => {
    server.use(
      http.post('/api/extractor/extract', () => mockResponses.extractionRateLimit())
    );
  },

  setupErrorFlow: () => {
    server.use(
      http.post('/api/extractor/extract', () => 
        mockResponses.extractionError('INVALID_FILE_TYPE', 'Invalid file type')
      )
    );
  },

  setupAuthFailureFlow: () => {
    server.use(
      http.get('/api/v1/auth/session', () => mockResponses.authError())
    );
  },

  setupSlowResponseFlow: () => {
    server.use(
      http.post('/api/extractor/extract', async ({ request }) => {
        await delay(2000); // 2 second delay
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        return mockResponses.extractionSuccess(files);
      })
    );
  }
};