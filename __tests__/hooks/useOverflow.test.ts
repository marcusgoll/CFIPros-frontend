import { renderHook, act } from "@testing-library/react";
import { useOverflow } from "@/components/layout/FeatureSpotlightMenu";
import { MutableRefObject } from "react";

// Mock ResizeObserver
const mockResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn().mockImplementation((element) => {
    // Simulate ResizeObserver callback
    setTimeout(() => callback([{ target: element }]), 0);
  }),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

Object.defineProperty(window, 'ResizeObserver', {
  value: mockResizeObserver,
  writable: true,
});

// Mock element properties
const createMockElement = (scrollProps: {
  scrollLeft?: number;
  scrollWidth?: number;
  clientWidth?: number;
}) => ({
  scrollLeft: scrollProps.scrollLeft || 0,
  scrollWidth: scrollProps.scrollWidth || 0,
  clientWidth: scrollProps.clientWidth || 0,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

describe("useOverflow Hook", () => {
  let mockRef: MutableRefObject<HTMLElement | null>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRef = { current: null };
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Initial State", () => {
    it("returns initial state when ref is null", () => {
      const { result } = renderHook(() => useOverflow(mockRef));
      
      expect(result.current.canLeft).toBe(false);
      expect(result.current.canRight).toBe(false);
    });

    it("initializes with correct state when element has no overflow", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        // Trigger initial update
        jest.runAllTimers();
      });
      
      expect(result.current.canLeft).toBe(false);
      expect(result.current.canRight).toBe(false);
    });
  });

  describe("Overflow Detection", () => {
    it("detects right overflow when content exceeds container width", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canLeft).toBe(false);
      expect(result.current.canRight).toBe(true);
    });

    it("detects left overflow when scrolled to the right", () => {
      const mockElement = createMockElement({
        scrollLeft: 50,
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canLeft).toBe(true);
      expect(result.current.canRight).toBe(true);
    });

    it("detects when scrolled to the end", () => {
      const mockElement = createMockElement({
        scrollLeft: 100, // 200 - 100 (exactly at maxScrollLeft)
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canLeft).toBe(true);
      expect(result.current.canRight).toBe(false);
    });

    it("handles edge case where scrollLeft equals maxScrollLeft", () => {
      const mockElement = createMockElement({
        scrollLeft: 99.5, // slightly less than maxScrollLeft (200 - 100)
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canLeft).toBe(true);
      expect(result.current.canRight).toBe(false);
    });
  });

  describe("Event Listeners", () => {
    it("attaches scroll event listener on mount", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      renderHook(() => useOverflow(mockRef));
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        "scroll", 
        expect.any(Function), 
        { passive: true }
      );
    });

    it("attaches window resize event listener on mount", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      mockRef.current = mockElement as any;
      
      renderHook(() => useOverflow(mockRef));
      
      expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it("sets up ResizeObserver when available", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      renderHook(() => useOverflow(mockRef));
      
      expect(mockResizeObserver).toHaveBeenCalledWith(expect.any(Function));
    });

    it("handles ResizeObserver unavailability gracefully", () => {
      const originalResizeObserver = window.ResizeObserver;
      // @ts-ignore
      delete window.ResizeObserver;
      
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      expect(() => {
        renderHook(() => useOverflow(mockRef));
      }).not.toThrow();
      
      window.ResizeObserver = originalResizeObserver;
    });
  });

  describe("Cleanup", () => {
    it("removes event listeners on unmount", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      mockRef.current = mockElement as any;
      
      const { unmount } = renderHook(() => useOverflow(mockRef));
      
      unmount();
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        "scroll", 
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it("disconnects ResizeObserver on unmount", () => {
      const mockDisconnect = jest.fn();
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      };
      
      mockResizeObserver.mockImplementationOnce(() => mockObserver);
      
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { unmount } = renderHook(() => useOverflow(mockRef));
      
      unmount();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("handles cleanup when ref becomes null", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { rerender } = renderHook(() => useOverflow(mockRef));
      
      // Change ref to null
      mockRef.current = null;
      
      expect(() => {
        rerender();
      }).not.toThrow();
    });
  });

  describe("Dynamic Updates", () => {
    it("updates state when scroll position changes", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canLeft).toBe(false);
      expect(result.current.canRight).toBe(true);
      
      // Simulate scroll
      mockElement.scrollLeft = 50;
      
      act(() => {
        // Trigger scroll event
        const scrollCallback = (mockElement.addEventListener as jest.Mock).mock.calls
          .find(call => call[0] === 'scroll')[1];
        scrollCallback();
      });
      
      expect(result.current.canLeft).toBe(true);
      expect(result.current.canRight).toBe(true);
    });

    it("updates state when window is resized", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canRight).toBe(true);
      
      // Simulate window resize by changing clientWidth
      mockElement.clientWidth = 200;
      
      act(() => {
        // Trigger resize event
        const resizeCallback = addEventListenerSpy.mock.calls
          .find(call => call[0] === 'resize')[1];
        (resizeCallback as EventListener)(new Event('resize'));
      });
      
      expect(result.current.canRight).toBe(false);
      
      addEventListenerSpy.mockRestore();
    });

    it("updates state when ResizeObserver fires", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.canRight).toBe(false);
      
      // Change dimensions and trigger ResizeObserver
      mockElement.scrollWidth = 200;
      
      act(() => {
        jest.runAllTimers(); // This should trigger the ResizeObserver callback
      });
      
      expect(result.current.canRight).toBe(true);
    });
  });

  describe("Performance Considerations", () => {
    it("doesn't cause unnecessary re-renders when state doesn't change", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 100,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      const initialResult = result.current;
      
      act(() => {
        // Trigger multiple scroll events with same result
        const scrollCallback = (mockElement.addEventListener as jest.Mock).mock.calls
          .find(call => call[0] === 'scroll')[1];
        scrollCallback();
        scrollCallback();
        scrollCallback();
      });
      
      // State should remain the same object reference if values haven't changed
      expect(result.current.canLeft).toBe(initialResult.canLeft);
      expect(result.current.canRight).toBe(initialResult.canRight);
    });

    it("properly handles rapid event firing", () => {
      const mockElement = createMockElement({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 100,
      });
      
      mockRef.current = mockElement as any;
      
      const { result } = renderHook(() => useOverflow(mockRef));
      
      act(() => {
        // Fire many events rapidly
        const scrollCallback = (mockElement.addEventListener as jest.Mock).mock.calls
          .find(call => call[0] === 'scroll')[1];
        
        for (let i = 0; i < 100; i++) {
          mockElement.scrollLeft = i;
          scrollCallback();
        }
      });
      
      // Should handle without errors
      expect(result.current.canLeft).toBe(true);
      expect(result.current.canRight).toBe(true);
    });
  });
});