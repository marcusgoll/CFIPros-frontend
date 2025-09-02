import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useAcsPerformance } from '@/hooks/useAcsPerformance';

// Mock fetch
global.fetch = jest.fn();

const mockPerformanceData = {
  acsCode: 'PA.I.A.K1',
  missRate: 23,
  averageScore: 77,
  commonMistakes: ['Incomplete fuel system inspection', 'Missing engine oil level check'],
  sampleSize: 1500,
  lastUpdated: new Date().toISOString(),
  difficulty: 'medium' as const,
};

describe('useAcsPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch performance data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPerformanceData,
      }),
    });

    const { result } = renderHook(() => useAcsPerformance('PA.I.A.K1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockPerformanceData);
    expect(result.current.error).toBe(null);
    expect(global.fetch).toHaveBeenCalledWith('/api/acs/PA.I.A.K1/performance');
  });

  test('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useAcsPerformance('PA.I.A.K1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should handle HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useAcsPerformance('INVALID.CODE'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Failed to fetch performance data: 404');
  });

  test('should handle API success false responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Code not found',
      }),
    });

    const { result } = renderHook(() => useAcsPerformance('PA.I.A.K1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Code not found');
  });

  test('should not fetch when acsCode is empty', () => {
    renderHook(() => useAcsPerformance(''));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('should refetch when acsCode changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPerformanceData,
      }),
    });

    const { result, rerender } = renderHook(
      ({ acsCode }) => useAcsPerformance(acsCode),
      { initialProps: { acsCode: 'PA.I.A.K1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/acs/PA.I.A.K1/performance');

    // Change the acsCode
    rerender({ acsCode: 'PA.I.B.K1' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/acs/PA.I.B.K1/performance');
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('should allow manual refetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPerformanceData,
      }),
    });

    const { result } = renderHook(() => useAcsPerformance('PA.I.A.K1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Manual refetch
    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});