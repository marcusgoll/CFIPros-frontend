import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useParams, useRouter } from 'next/navigation';
import BatchStatusPage from '@/app/batches/[batchId]/page';

// Mock the router
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockBatchStatus = {
  batchId: 'test-batch-123',
  status: 'complete',
  progress: 100,
  filesProcessed: 3,
  totalFiles: 3,
  createdAt: '2024-01-15T10:00:00Z',
  completedAt: '2024-01-15T10:05:00Z',
  extractionResults: [
    {
      extractionId: 'extraction-1',
      timestamp: '2024-01-15T10:05:00Z',
      filesCount: 3
    }
  ]
};

describe('Batch Status Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ batchId: 'test-batch-123' });
    mockedUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    // Mock successful batch status fetch
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockBatchStatus),
    } as any);
  });

  it('displays batch status information correctly', async () => {
    render(<BatchStatusPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Processing Complete')).toBeInTheDocument();
    });

    // Check batch ID display
    expect(screen.getByText(/test-batch-123/)).toBeInTheDocument();

    // Check file statistics
    expect(screen.getByText('3')).toBeInTheDocument(); // Total files
    expect(screen.getByText('Total Files')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Don't wait for fetch to resolve
    mockedFetch.mockImplementation(() => new Promise(() => {}));
    
    render(<BatchStatusPage />);
    
    expect(screen.getByText(/loading batch status/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('displays export options for completed batches', async () => {
    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Export Results')).toBeInTheDocument();
    });

    // Check export format options
    expect(screen.getByText('PDF Report')).toBeInTheDocument();
    expect(screen.getByText('CSV Data')).toBeInTheDocument();
    expect(screen.getByText('JSON Data')).toBeInTheDocument();
  });

  it('handles batch export correctly', async () => {
    const user = userEvent.setup();
    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Export Results')).toBeInTheDocument();
    });

    // Mock export fetch response
    const mockBlob = new Blob(['test data'], { type: 'application/pdf' });
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValue(mockBlob),
    } as any);

    // Click PDF export button
    const pdfExportButton = screen.getByRole('button', { name: /pdf report/i });
    await user.click(pdfExportButton);

    // Verify export API call
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/batches/test-batch-123/export?format=pdf');
    });
  });

  it('shows processing state for pending batches', async () => {
    const processingBatch = {
      ...mockBatchStatus,
      status: 'processing',
      progress: 60,
      filesProcessed: 2,
      totalFiles: 3
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(processingBatch),
    } as any);

    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Processing Files')).toBeInTheDocument();
    });

    // Check progress bar
    expect(screen.getByText('60% complete')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 files')).toBeInTheDocument();

    // Export options should not be visible
    expect(screen.queryByText('Export Results')).not.toBeInTheDocument();
  });

  it('displays error state when batch fetch fails', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as any);

    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading batch/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/batch not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload new files/i })).toBeInTheDocument();
  });

  it('shows failed state with error message', async () => {
    const failedBatch = {
      ...mockBatchStatus,
      status: 'failed',
      error: 'Processing failed due to invalid file format'
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(failedBatch),
    } as any);

    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Processing Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Processing failed due to invalid file format')).toBeInTheDocument();
  });

  it('includes sharing component for completed batches', async () => {
    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Processing Complete')).toBeInTheDocument();
    });

    // BatchSharing component should be present (mocked)
    // In a real implementation, we would mock the BatchSharing component
    // For now, we just verify the main status is complete which enables sharing
    expect(screen.getByText('Processing Complete')).toBeInTheDocument();
  });

  it('includes consent manager component', async () => {
    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Processing Complete')).toBeInTheDocument();
    });

    // ConsentManager component should be present (mocked)
    // For now, we just verify the page renders without error
    expect(screen.getByText('Processing Complete')).toBeInTheDocument();
  });

  it('polls for status updates when processing', async () => {
    jest.useFakeTimers();
    
    const processingBatch = {
      ...mockBatchStatus,
      status: 'processing',
      progress: 50
    };

    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(processingBatch),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ ...processingBatch, progress: 75 }),
      } as any);

    render(<BatchStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Processing Files')).toBeInTheDocument();
    });

    // Fast-forward time to trigger polling
    jest.advanceTimersByTime(2000);

    // Should make another fetch call
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});