/**
 * Enhanced useMediaQuery tests to boost coverage
 */
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../../../lib/hooks/useMediaQuery';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  const mockMediaQueryList = {
    matches,
    media: '(min-width: 768px)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => mockMediaQueryList),
  });

  return mockMediaQueryList;
};

describe('useMediaQuery Enhanced Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    jest.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return true when media query matches', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(true);
    });

    it('should return false when media query does not match', () => {
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(false);
    });

    it('should call matchMedia with correct query', () => {
      const mockMql = mockMatchMedia(true);
      
      renderHook(() => useMediaQuery('(max-width: 1024px)'));
      
      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener on mount', () => {
      const mockMql = mockMatchMedia(true);
      
      renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      const mockMql = mockMatchMedia(true);
      
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      unmount();
      
      expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update state when media query changes', () => {
      const mockMql = mockMatchMedia(false);
      let changeHandler: ((event: any) => void) | null = null;
      
      mockMql.addEventListener = jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(false);
      
      // Simulate media query change
      if (changeHandler) {
        act(() => {
          mockMql.matches = true;
          changeHandler({ matches: true });
        });
      }
      
      expect(result.current).toBe(true);
    });
  });

  describe('Different Query Types', () => {
    it('should handle min-width queries', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));
      
      expect(result.current).toBe(true);
    });

    it('should handle max-width queries', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMediaQuery('(max-width: 1280px)'));
      
      expect(result.current).toBe(true);
    });

    it('should handle orientation queries', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMediaQuery('(orientation: portrait)'));
      
      expect(result.current).toBe(true);
    });

    it('should handle complex queries', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => 
        useMediaQuery('(min-width: 768px) and (max-width: 1024px)')
      );
      
      expect(result.current).toBe(true);
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      
      // Temporarily remove window
      delete (global as any).window;
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(false);
      
      // Restore window
      global.window = originalWindow;
    });

    it('should handle missing matchMedia gracefully', () => {
      const originalMatchMedia = window.matchMedia;
      
      // Remove matchMedia
      delete (window as any).matchMedia;
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(false);
      
      // Restore matchMedia
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query string', () => {
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useMediaQuery(''));
      
      expect(result.current).toBe(false);
    });

    it('should handle invalid query string', () => {
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useMediaQuery('invalid-query'));
      
      expect(result.current).toBe(false);
    });

    it('should handle query changes', () => {
      const mockMql1 = mockMatchMedia(true);
      
      const { result, rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );
      
      expect(result.current).toBe(true);
      
      // Change query
      const mockMql2 = mockMatchMedia(false);
      
      rerender({ query: '(min-width: 1024px)' });
      
      expect(result.current).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not recreate listeners unnecessarily', () => {
      const mockMql = mockMatchMedia(true);
      
      const { rerender } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      const firstCallCount = mockMql.addEventListener.mock.calls.length;
      
      rerender();
      
      const secondCallCount = mockMql.addEventListener.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});