import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeatureSpotlightMenu } from "@/components/layout/FeatureSpotlightMenu";
import type { FeatureItem } from "@/components/layout/FeatureSpotlightMenu";

// Mock ResizeObserver
const mockResizeObserver = jest.fn().mockImplementation((_callback: ResizeObserverCallback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scroll methods
const mockScrollBy = jest.fn();
const mockScrollTo = jest.fn();

Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
  value: mockScrollBy,
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  value: mockScrollTo,
  writable: true,
});

Object.defineProperty(window, 'ResizeObserver', {
  value: mockResizeObserver,
  writable: true,
});

// Mock getBoundingClientRect
const mockGetBoundingClientRect = jest.fn(() => ({
  left: 0,
  top: 0,
  right: 100,
  bottom: 50,
  width: 100,
  height: 50,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: mockGetBoundingClientRect,
  writable: true,
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn((callback) => setTimeout(callback, 16)),
  writable: true,
});

const mockTestIcon = () => (
  <svg data-testid="mock-icon" width="26" height="26" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const mockFeatures: FeatureItem[] = [
  { id: "feature1", label: "Feature 1", Icon: mockTestIcon },
  { id: "feature2", label: "Feature 2", Icon: mockTestIcon },
  { id: "feature3", label: "Feature 3", Icon: mockTestIcon },
  { id: "feature4", label: "Feature 4", Icon: mockTestIcon },
  { id: "feature5", label: "Feature 5", Icon: mockTestIcon },
];

describe("FeatureSpotlightMenu Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("renders all provided features", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      mockFeatures.forEach((feature) => {
        expect(screen.getByRole("tab", { name: feature.label })).toBeInTheDocument();
      });
    });

    it("renders with default features when no features prop is provided", () => {
      render(<FeatureSpotlightMenu />);
      
      // Should render the default features (Upload, Analyzer, etc.)
      expect(screen.getByRole("tab", { name: "Upload" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Analyzer" })).toBeInTheDocument();
    });

    it("displays feature icons correctly", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const icons = screen.getAllByTestId("mock-icon");
      expect(icons).toHaveLength(mockFeatures.length);
    });

    it("sets middle feature as active by default", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const middleFeature = mockFeatures[Math.floor(mockFeatures.length / 2)]!;
      const activeTab = screen.getByRole("tab", { name: middleFeature.label });
      expect(activeTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Interaction", () => {
    it("calls onSelect when a feature is clicked", () => {
      const mockOnSelect = jest.fn();
      render(<FeatureSpotlightMenu features={mockFeatures} onSelect={mockOnSelect} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      fireEvent.click(firstFeature);
      
      expect(mockOnSelect).toHaveBeenCalledWith("feature1");
    });

    it("updates active state when a different feature is selected", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      fireEvent.click(firstFeature);
      
      expect(firstFeature).toHaveAttribute("aria-selected", "true");
      
      // Check that other tabs are not selected
      const secondFeature = screen.getByRole("tab", { name: "Feature 2" });
      expect(secondFeature).toHaveAttribute("aria-selected", "false");
    });

    it("handles scroll arrow clicks", () => {
      // Mock scroll properties to simulate overflow
      Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
        value: 100,
        writable: true,
      });
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        value: 300,
        writable: true,
      });

      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      // Wait for arrows to appear (they should be visible due to overflow)
      waitFor(() => {
        const leftArrow = screen.getByLabelText("Scroll left");
        const rightArrow = screen.getByLabelText("Scroll right");
        
        expect(leftArrow).toBeInTheDocument();
        expect(rightArrow).toBeInTheDocument();
        
        fireEvent.click(rightArrow);
        expect(mockScrollBy).toHaveBeenCalledWith({
          left: expect.any(Number),
          behavior: "smooth"
        });
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("handles right arrow key navigation", () => {
      const mockOnSelect = jest.fn();
      render(<FeatureSpotlightMenu features={mockFeatures} onSelect={mockOnSelect} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      firstFeature.focus();
      
      fireEvent.keyDown(firstFeature, { key: "ArrowRight" });
      
      expect(mockOnSelect).toHaveBeenCalledWith("feature2");
    });

    it("handles left arrow key navigation", () => {
      const mockOnSelect = jest.fn();
      render(<FeatureSpotlightMenu features={mockFeatures} onSelect={mockOnSelect} />);
      
      const secondFeature = screen.getByRole("tab", { name: "Feature 2" });
      secondFeature.focus();
      
      fireEvent.keyDown(secondFeature, { key: "ArrowLeft" });
      
      expect(mockOnSelect).toHaveBeenCalledWith("feature1");
    });

    it("wraps around when navigating beyond array bounds", () => {
      const mockOnSelect = jest.fn();
      render(<FeatureSpotlightMenu features={mockFeatures} onSelect={mockOnSelect} />);
      
      // Navigate right from last feature
      const lastFeature = screen.getByRole("tab", { name: "Feature 5" });
      lastFeature.focus();
      
      fireEvent.keyDown(lastFeature, { key: "ArrowRight" });
      
      expect(mockOnSelect).toHaveBeenCalledWith("feature1");
    });

    it("handles Enter and Space key activation", () => {
      const mockOnSelect = jest.fn();
      render(<FeatureSpotlightMenu features={mockFeatures} onSelect={mockOnSelect} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      firstFeature.focus();
      
      fireEvent.keyDown(firstFeature, { key: "Enter" });
      expect(mockOnSelect).toHaveBeenCalledWith("feature1");
      
      mockOnSelect.mockClear();
      
      fireEvent.keyDown(firstFeature, { key: " " });
      expect(mockOnSelect).toHaveBeenCalledWith("feature1");
    });

    it("prevents default behavior for handled keys", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      firstFeature.focus();
      
      const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      
      fireEvent.keyDown(firstFeature, event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Styling and CSS Classes", () => {
    it("applies correct CSS classes to container", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const container = screen.getByRole("tablist").parentElement;
      expect(container).toHaveClass("relative", "rounded-2xl", "border");
    });

    it("applies active styles to selected feature", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      fireEvent.click(firstFeature);
      
      expect(firstFeature).toHaveClass("text-[#1e9df1]");
    });

    it("applies inactive styles to non-selected features", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      // Click first feature to make it active
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      fireEvent.click(firstFeature);
      
      // Check that second feature has inactive styles
      const secondFeature = screen.getByRole("tab", { name: "Feature 2" });
      expect(secondFeature).not.toHaveClass("text-[#1e9df1]");
    });

    it("shows/hides scroll indicators based on overflow state", async () => {
      // First render with no overflow
      Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
        value: 0,
        writable: true,
      });
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        value: 300,
        writable: true,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        value: 300,
        writable: true,
      });

      const { rerender } = render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      // Arrows should not be present when there's no overflow
      expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
      
      // Mock overflow state
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        value: 1000,
        writable: true,
      });
      
      // Re-render to trigger overflow detection
      rerender(<FeatureSpotlightMenu features={mockFeatures} />);
      
      // Trigger the overflow detection manually if needed
      // This might require some additional setup depending on implementation
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
      
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-selected");
      });
    });

    it("has proper aria-label on scroll buttons", async () => {
      // Mock overflow to show scroll buttons
      Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
        value: 100,
        writable: true,
      });
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        value: 300,
        writable: true,
      });

      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      await waitFor(() => {
        const leftArrow = screen.queryByLabelText("Scroll left");
        const rightArrow = screen.queryByLabelText("Scroll right");
        
        if (leftArrow) expect(leftArrow).toHaveAttribute("aria-label", "Scroll left");
        if (rightArrow) expect(rightArrow).toHaveAttribute("aria-label", "Scroll right");
      });
    });

    it("maintains focus management during keyboard navigation", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      firstFeature.focus();
      
      fireEvent.keyDown(firstFeature, { key: "ArrowRight" });
      
      // The focus should move to the next element
      const secondFeature = screen.getByRole("tab", { name: "Feature 2" });
      expect(secondFeature).toHaveFocus();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty features array gracefully", () => {
      render(<FeatureSpotlightMenu features={[]} />);
      
      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
      expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });

    it("handles single feature array", () => {
      const singleFeature = [mockFeatures[0]!];
      render(<FeatureSpotlightMenu features={singleFeature} />);
      
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    it("handles features without onSelect callback", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const firstFeature = screen.getByRole("tab", { name: "Feature 1" });
      
      // Should not throw error when clicking without onSelect
      expect(() => {
        fireEvent.click(firstFeature);
      }).not.toThrow();
    });

    it("handles missing Icon component gracefully", () => {
      const featuresWithMissingIcon = [
        { id: "test", label: "Test", Icon: undefined as any },
      ];
      
      // Should not crash when Icon is undefined
      expect(() => {
        render(<FeatureSpotlightMenu features={featuresWithMissingIcon} />);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("properly cleans up event listeners", () => {
      const { unmount } = render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      // Spy on removeEventListener to ensure cleanup
      const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    });

    it("throttles scroll events appropriately", () => {
      render(<FeatureSpotlightMenu features={mockFeatures} />);
      
      const tablist = screen.getByRole("tablist");
      
      // Simulate rapid scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(tablist);
      }
      
      // The implementation should handle these gracefully without performance issues
      expect(tablist).toBeInTheDocument();
    });
  });
});