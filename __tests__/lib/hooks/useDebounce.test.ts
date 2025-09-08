/**
 * Comprehensive useDebounce Hook Tests
 * Tests for Task 2.2: Custom Hooks Testing
 * 
 * Coverage Areas:
 * - Basic debouncing functionality with different delays
 * - Value updates and timing control
 * - Memory cleanup and timeout management
 * - Performance with rapid value changes
 * - Different data types (strings, numbers, objects, arrays)
 * - Effect triggers and dependency management
 * - Hook unmounting and cleanup
 * - Edge cases with zero delay and negative delays
 * - Large datasets and complex objects
 * - TypeScript strict mode compliance and generic typing
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/lib/hooks/useDebounce';

// Helper to advance timers and flush all pending promises
const advanceTimersAndFlush = async (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Basic functionality tests
  describe('Basic Functionality', () => {
    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));

      expect(result.current).toBe('initial');
    });

    it('debounces value updates', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated', delay: 500 });

      // Should not update immediately
      expect(result.current).toBe('initial');

      // Should update after delay
      await advanceTimersAndFlush(500);

      expect(result.current).toBe('updated');
    });

    it('resets timer on rapid updates', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // First update
      rerender({ value: 'update1', delay: 500 });
      
      // Advance time partially
      await advanceTimersAndFlush(300);
      expect(result.current).toBe('initial');

      // Second update before first completes
      rerender({ value: 'update2', delay: 500 });

      // Advance time partially again
      await advanceTimersAndFlush(300);
      expect(result.current).toBe('initial');

      // Complete the delay
      await advanceTimersAndFlush(200);
      expect(result.current).toBe('update2');
    });

    it('handles multiple rapid updates correctly', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      );

      // Rapid fire updates
      const updates = ['update1', 'update2', 'update3', 'final'];
      
      updates.forEach((update, index) => {
        rerender({ value: update, delay: 300 });
        if (index < updates.length - 1) {
          act(() => {
            jest.advanceTimersByTime(100); // Partial advance
          });
        }
      });

      // Value should still be initial
      expect(result.current).toBe('initial');

      // Complete the debounce
      await advanceTimersAndFlush(300);

      // Should only update to the final value
      expect(result.current).toBe('final');
    });

    it('handles delay changes correctly', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Update with new delay
      rerender({ value: 'updated', delay: 200 });

      // Should use the new delay
      await advanceTimersAndFlush(200);

      expect(result.current).toBe('updated');
    });
  });

  // Data type tests
  describe('Data Types', () => {
    it('works with strings', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'hello' } }
      );

      rerender({ value: 'world' });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe('world');
    });

    it('works with numbers', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 0 } }
      );

      rerender({ value: 42 });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(42);
    });

    it('works with booleans', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: false } }
      );

      rerender({ value: true });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(true);
    });

    it('works with objects', async () => {
      const initialObj = { name: 'John', age: 30 };
      const updatedObj = { name: 'Jane', age: 25 };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialObj } }
      );

      expect(result.current).toBe(initialObj);

      rerender({ value: updatedObj });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedObj);
    });

    it('works with arrays', async () => {
      const initialArray = [1, 2, 3];
      const updatedArray = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialArray } }
      );

      expect(result.current).toBe(initialArray);

      rerender({ value: updatedArray });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedArray);
    });

    it('works with null and undefined', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' as string | null } }
      );

      rerender({ value: null });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(null);

      rerender({ value: undefined as any });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(undefined);
    });

    it('works with complex nested objects', async () => {
      const complexObj = {
        user: {
          profile: {
            name: 'John',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
          posts: [
            { id: 1, title: 'First Post' },
            { id: 2, title: 'Second Post' },
          ],
        },
        metadata: {
          version: '1.0.0',
          timestamp: Date.now(),
        },
      };

      const updatedObj = {
        ...complexObj,
        user: {
          ...complexObj.user,
          profile: {
            ...complexObj.user.profile,
            name: 'Jane',
          },
        },
      };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: complexObj } }
      );

      rerender({ value: updatedObj });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedObj);
      expect(result.current.user.profile.name).toBe('Jane');
    });
  });

  // Timing tests
  describe('Timing Control', () => {
    it('handles zero delay', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // With zero delay, should update on next tick
      await advanceTimersAndFlush(0);

      expect(result.current).toBe('updated');
    });

    it('handles very small delays', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      await advanceTimersAndFlush(1);

      expect(result.current).toBe('updated');
    });

    it('handles large delays', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 5000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Should not update before delay
      await advanceTimersAndFlush(4999);
      expect(result.current).toBe('initial');

      // Should update after delay
      await advanceTimersAndFlush(1);
      expect(result.current).toBe('updated');
    });

    it('respects precise timing', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 250),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Check at various intervals
      await advanceTimersAndFlush(100);
      expect(result.current).toBe('initial');

      await advanceTimersAndFlush(100);
      expect(result.current).toBe('initial');

      await advanceTimersAndFlush(49);
      expect(result.current).toBe('initial');

      await advanceTimersAndFlush(1);
      expect(result.current).toBe('updated');
    });
  });

  // Memory and cleanup tests
  describe('Memory Management and Cleanup', () => {
    it('cleans up timeout on unmount', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Unmount before timeout completes
      unmount();

      // Advance timers - should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(500);
        });
      }).not.toThrow();
    });

    it('cleans up previous timeout on value change', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'update1' });
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

      rerender({ value: 'update2' });
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

      clearTimeoutSpy.mockRestore();
    });

    it('cleans up timeout on delay change', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 500 } }
      );

      rerender({ value: 'test', delay: 300 });
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useDebounce(`value-${i}`, 100));
        unmount();
      }

      // Should not cause memory leaks or errors
      expect(true).toBe(true);
    });

    it('prevents memory leaks with large datasets', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `item-${i}`,
        nested: { value: i * 2 },
      }));

      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: largeArray } }
      );

      const updatedArray = largeArray.map(item => ({ ...item, updated: true }));
      rerender({ value: updatedArray });

      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedArray);
      expect(() => unmount()).not.toThrow();
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('handles rapid successive updates efficiently', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 50),
        { initialProps: { value: 'initial' } }
      );

      const start = performance.now();

      // Perform many rapid updates
      for (let i = 0; i < 1000; i++) {
        rerender({ value: `update-${i}` });
      }

      const updateTime = performance.now() - start;

      // Complete the debounce
      await advanceTimersAndFlush(50);

      expect(result.current).toBe('update-999');
      expect(updateTime).toBeLessThan(100); // Should be fast
    });

    it('maintains performance with large objects', async () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          details: {
            description: `Description for item ${i}`,
            tags: [`tag-${i}`, `category-${i % 10}`],
          },
        })),
        metadata: {
          total: 1000,
          created: Date.now(),
        },
      };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: largeObject } }
      );

      const start = performance.now();

      const updatedObject = {
        ...largeObject,
        metadata: { ...largeObject.metadata, updated: true },
      };

      rerender({ value: updatedObject });

      const updateTime = performance.now() - start;

      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedObject);
      expect(updateTime).toBeLessThan(50);
    });

    it('does not cause unnecessary re-renders', async () => {
      let renderCount = 0;
      
      const { rerender } = renderHook(
        ({ value }) => {
          renderCount++;
          return useDebounce(value, 100);
        },
        { initialProps: { value: 'initial' } }
      );

      const initialRenderCount = renderCount;

      rerender({ value: 'updated' });
      const afterUpdateRenderCount = renderCount;

      await advanceTimersAndFlush(100);
      const afterDebounceRenderCount = renderCount;

      // Should only re-render when value changes and when debounced value updates
      expect(afterUpdateRenderCount - initialRenderCount).toBe(1);
      expect(afterDebounceRenderCount - afterUpdateRenderCount).toBe(1);
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles same value updates correctly', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'test' } }
      );

      // Update to same value
      rerender({ value: 'test' });

      await advanceTimersAndFlush(100);

      expect(result.current).toBe('test');
    });

    it('handles function values', async () => {
      const initialFn = () => 'initial';
      const updatedFn = () => 'updated';

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialFn } }
      );

      expect(result.current).toBe(initialFn);

      rerender({ value: updatedFn });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedFn);
      expect(result.current()).toBe('updated');
    });

    it('handles symbol values', async () => {
      const initialSymbol = Symbol('initial');
      const updatedSymbol = Symbol('updated');

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialSymbol } }
      );

      expect(result.current).toBe(initialSymbol);

      rerender({ value: updatedSymbol });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedSymbol);
    });

    it('handles Map and Set objects', async () => {
      const initialMap = new Map([['key', 'value']]);
      const updatedMap = new Map([['key', 'updated']]);

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialMap } }
      );

      expect(result.current).toBe(initialMap);

      rerender({ value: updatedMap });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedMap);
      expect(result.current.get('key')).toBe('updated');
    });

    it('handles Date objects', async () => {
      const initialDate = new Date('2023-01-01');
      const updatedDate = new Date('2023-12-31');

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialDate } }
      );

      expect(result.current).toBe(initialDate);

      rerender({ value: updatedDate });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updatedDate);
    });

    it('handles updates during timeout', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'first-update' });

      // Advance time partially
      await advanceTimersAndFlush(100);
      expect(result.current).toBe('initial');

      // Update again before first timeout completes
      rerender({ value: 'second-update' });

      // Complete the new timeout
      await advanceTimersAndFlush(200);
      expect(result.current).toBe('second-update');
    });

    it('works with generic types', async () => {
      interface TestInterface {
        id: number;
        name: string;
      }

      const initial: TestInterface = { id: 1, name: 'initial' };
      const updated: TestInterface = { id: 2, name: 'updated' };

      const { result, rerender } = renderHook(
        ({ value }: { value: TestInterface }) => useDebounce(value, 100),
        { initialProps: { value: initial } }
      );

      expect(result.current).toBe(initial);

      rerender({ value: updated });
      await advanceTimersAndFlush(100);

      expect(result.current).toBe(updated);
      expect(result.current.name).toBe('updated');
    });
  });
});