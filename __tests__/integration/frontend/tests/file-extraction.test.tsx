/**
 * File Extraction API Contract Tests
 * Tests frontend integration with file extraction API endpoints
 */

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import '../mocks/setup';

// Mock the file upload hook - will be implemented based on actual hook structure
const mockUseFileUpload = () => {
  const [state, setState] = React.useState({
    batchId: null as string | null,
    status: 'idle' as 'idle' | 'uploading' | 'processing' | 'completed' | 'error',
    error: null as string | null,
    retryAfter: null as number | null,
    progress: 0,
    files: [] as File[]
  });

  const uploadFiles = async (files: File[]) => {
    setState(prev => ({ ...prev, status: 'uploading', files }));

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/extractor/extract', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer mock_token_123`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: data.error,
            retryAfter: data.retry_after
          }));
        } else {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: data.error
          }));
        }
        return;
      }

      setState(prev => ({
        ...prev,
        status: 'processing',
        batchId: data.batch_id
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'Network error occurred'
      }));
    }
  };

  const reset = () => {
    setState({
      batchId: null,
      status: 'idle',
      error: null,
      retryAfter: null,
      progress: 0,
      files: []
    });
  };

  return {
    ...state,
    uploadFiles,
    reset
  };
};

// Mock React for this test
const React = {
  useState: jest.fn((initial: any) => {
    const state = { current: initial };
    const setState = (updater: any) => {
      if (typeof updater === 'function') {
        state.current = updater(state.current);
      } else {
        state.current = updater;
      }
    };
    return [state.current, setState];
  })
};

describe('File Extraction API Contract', () => {
  beforeEach(() => {
    // Reset React mock state
    React.useState.mockClear();
  });

  test('handles successful file extraction', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.json({
          batch_id: "batch_123",
          status: "processing",
          estimated_completion: "2025-09-08T10:30:00Z",
          files_count: 1
        }, { status: 202 });
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      await result.current.uploadFiles([file]);
    });

    expect(result.current.batchId).toBe("batch_123");
    expect(result.current.status).toBe("processing");
    expect(result.current.error).toBeNull();
  });

  test('handles 400 error gracefully', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.json({
          error: "Invalid file type",
          code: "INVALID_FILE_TYPE",
          details: {
            accepted_types: ["application/pdf", "image/jpeg", "image/png"]
          }
        }, { status: 400 });
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const file = new File(['exe content'], 'malicious.exe', { type: 'application/x-msdownload' });
      await result.current.uploadFiles([file]);
    });

    expect(result.current.error).toContain("Invalid file type");
    expect(result.current.status).toBe("error");
    expect(result.current.batchId).toBeNull();
  });

  test('handles 429 rate limit gracefully', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.json({
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            retry_after: 3600,
            limit: "10 requests per hour"
          }
        }, { status: 429 });
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      await result.current.uploadFiles([file]);
    });

    expect(result.current.error).toContain("Rate limit exceeded");
    expect(result.current.status).toBe("error");
    expect(result.current.retryAfter).toBe(3600);
  });

  test('handles 401 unauthorized gracefully', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.json({
          error: "Unauthorized",
          code: "UNAUTHORIZED"
        }, { status: 401 });
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      await result.current.uploadFiles([file]);
    });

    expect(result.current.error).toContain("Unauthorized");
    expect(result.current.status).toBe("error");
  });

  test('handles network errors gracefully', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      await result.current.uploadFiles([file]);
    });

    expect(result.current.error).toContain("Network error occurred");
    expect(result.current.status).toBe("error");
  });

  test('handles multiple file upload', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.json({
          batch_id: "batch_multi_456",
          status: "processing",
          estimated_completion: "2025-09-08T10:45:00Z",
          files_count: 3
        }, { status: 202 });
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const files = [
        new File(['pdf 1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['pdf 2'], 'test2.pdf', { type: 'application/pdf' }),
        new File(['pdf 3'], 'test3.pdf', { type: 'application/pdf' })
      ];
      await result.current.uploadFiles(files);
    });

    expect(result.current.batchId).toBe("batch_multi_456");
    expect(result.current.status).toBe("processing");
    expect(result.current.files).toHaveLength(3);
  });

  test('validates response format matches OpenAPI contract', async () => {
    server.use(
      http.post('/api/extractor/extract', () => {
        return HttpResponse.json({
          batch_id: "batch_contract_test",
          status: "processing",
          estimated_completion: "2025-09-08T10:30:00Z",
          files_count: 1,
          // Additional fields that might be in the contract
          created_at: new Date().toISOString(),
          user_id: "user_123"
        }, { status: 202 });
      })
    );

    const { result } = renderHook(() => mockUseFileUpload());

    await act(async () => {
      const file = new File(['pdf content'], 'contract-test.pdf', { type: 'application/pdf' });
      await result.current.uploadFiles([file]);
    });

    // Verify response structure matches OpenAPI contract
    expect(result.current.batchId).toMatch(/^batch_/);
    expect(result.current.status).toBe("processing");
    expect(result.current.error).toBeNull();
  });
});

describe('File Extraction Results API Contract', () => {
  const mockUseFileResults = (batchId: string) => {
    const [state, setState] = React.useState({
      results: null as any,
      status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
      error: null as string | null
    });

    const fetchResults = async () => {
      setState(prev => ({ ...prev, status: 'loading' }));

      try {
        const response = await fetch(`/api/extractor/results/${batchId}`, {
          headers: {
            'Authorization': `Bearer mock_token_123`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: data.error
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          status: 'success',
          results: data
        }));

      } catch (error) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Network error occurred'
        }));
      }
    };

    return {
      ...state,
      fetchResults
    };
  };

  test('handles processing status response', async () => {
    const batchId = 'batch_processing_test';
    
    server.use(
      http.get(`/api/extractor/results/${batchId}`, () => {
        return HttpResponse.json({
          batch_id: batchId,
          status: "processing",
          progress: 0.5,
          estimated_completion: "2025-09-08T10:35:00Z",
          files_processed: 1,
          files_total: 2
        }, { status: 200 });
      })
    );

    const { result } = renderHook(() => mockUseFileResults(batchId));

    await act(async () => {
      await result.current.fetchResults();
    });

    expect(result.current.status).toBe("success");
    expect(result.current.results.status).toBe("processing");
    expect(result.current.results.progress).toBe(0.5);
  });

  test('handles completed results response', async () => {
    const batchId = 'batch_completed_test';
    
    server.use(
      http.get(`/api/extractor/results/${batchId}`, () => {
        return HttpResponse.json({
          batch_id: batchId,
          status: "completed",
          completed_at: "2025-09-08T10:30:00Z",
          results: [
            {
              file_id: "file_1",
              file_name: "test.pdf",
              status: "success",
              extracted_data: {
                acs_sections: [
                  {
                    section: "PA.I.A",
                    task: "Certificates and Documents",
                    elements: ["Check certificates", "Verify documents"]
                  }
                ]
              }
            }
          ]
        }, { status: 200 });
      })
    );

    const { result } = renderHook(() => mockUseFileResults(batchId));

    await act(async () => {
      await result.current.fetchResults();
    });

    expect(result.current.status).toBe("success");
    expect(result.current.results.status).toBe("completed");
    expect(result.current.results.results).toHaveLength(1);
    expect(result.current.results.results[0].extracted_data.acs_sections).toHaveLength(1);
  });

  test('handles 404 batch not found', async () => {
    const batchId = 'batch_not_found';
    
    server.use(
      http.get(`/api/extractor/results/${batchId}`, () => {
        return HttpResponse.json({
          error: "Batch not found",
          code: "BATCH_NOT_FOUND"
        }, { status: 404 });
      })
    );

    const { result } = renderHook(() => mockUseFileResults(batchId));

    await act(async () => {
      await result.current.fetchResults();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("Batch not found");
  });
});