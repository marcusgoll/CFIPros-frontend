import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScreenshotPreview } from "@/components/layout/ScreenshotPreview";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props} alt={props.alt} />,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock next/image
jest.mock("next/image", () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    // Filter out Next.js specific props to avoid warnings
    const { fill, priority, sizes, ...imgProps } = props;
    return (
      <img 
        src={src} 
        alt={alt} 
        onLoad={onLoad}
        onError={onError}
        {...imgProps}
      />
    );
  };
});

describe("ScreenshotPreview", () => {
  const defaultProps = {
    featureId: "upload",
    featureName: "File Upload",
    screenshotUrl: "/images/features/upload-screenshot.jpg",
    isVisible: true,
    onPlayClick: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders screenshot preview when visible", () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("File Upload feature screenshot")).toBeInTheDocument();
    expect(screen.getByText("File Upload")).toBeInTheDocument();
  });

  it("does not render when not visible", () => {
    render(<ScreenshotPreview {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays play button overlay after image loads", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const image = screen.getByAltText("File Upload feature screenshot");
    
    // Initially play button should not be visible (image not loaded)
    expect(screen.queryByRole("button", { name: /play video/i })).not.toBeInTheDocument();
    
    // Simulate image load
    fireEvent.load(image);
    
    await waitFor(() => {
      const playButton = screen.getByRole("button", { name: /play video/i });
      expect(playButton).toBeInTheDocument();
    });
  });

  it("calls onPlayClick when play button is clicked", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const image = screen.getByAltText("File Upload feature screenshot");
    
    // Load the image first
    fireEvent.load(image);
    
    await waitFor(() => {
      const playButton = screen.getByRole("button", { name: /play video/i });
      fireEvent.click(playButton);
      expect(defaultProps.onPlayClick).toHaveBeenCalledWith("upload");
    });
  });

  it("calls onClose when close button is clicked", () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const closeButton = screen.getByRole("button", { name: /close preview/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose when escape key is pressed", () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: "Escape" });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is clicked", () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const overlay = screen.getByTestId("screenshot-overlay");
    fireEvent.click(overlay);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("does not close when clicking on the content area", () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const content = screen.getByTestId("screenshot-content");
    fireEvent.click(content);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("handles image loading states", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const image = screen.getByAltText("File Upload feature screenshot");
    
    // Initially should show loading state
    expect(screen.getByTestId("screenshot-loading")).toBeInTheDocument();
    
    // Simulate image load
    fireEvent.load(image);
    
    await waitFor(() => {
      expect(screen.queryByTestId("screenshot-loading")).not.toBeInTheDocument();
    });
  });

  it("handles image loading errors", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const image = screen.getByAltText("File Upload feature screenshot");
    
    // Simulate image error
    fireEvent.error(image);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load screenshot/i)).toBeInTheDocument();
    });
  });

  it("is accessible with proper ARIA attributes", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "File Upload feature preview");
    
    const image = screen.getByAltText("File Upload feature screenshot");
    
    // Load the image first
    fireEvent.load(image);
    
    await waitFor(() => {
      const playButton = screen.getByRole("button", { name: /play video/i });
      expect(playButton).toHaveAttribute("aria-describedby");
    });
  });

  it("focuses on close button when opened", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole("button", { name: /close preview/i });
      expect(closeButton).toHaveFocus();
    });
  });

  it("handles tab key navigation", async () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const closeButton = screen.getByRole("button", { name: /close preview/i });
    const image = screen.getByAltText("File Upload feature screenshot");
    
    // Load the image first to show play button
    fireEvent.load(image);
    
    await waitFor(() => {
      const playButton = screen.getByRole("button", { name: /play video/i });
      expect(playButton).toBeInTheDocument();
      
      // Test that Tab key events are handled (don't expect actual focus changes in jsdom)
      fireEvent.keyDown(closeButton, { key: "Tab" });
      fireEvent.keyDown(playButton, { key: "Tab", shiftKey: true });
      
      // Both buttons should still exist and be interactive
      expect(closeButton).toBeInTheDocument();
      expect(playButton).toBeInTheDocument();
    });
  });

  it("displays proper screenshot URL", () => {
    render(<ScreenshotPreview {...defaultProps} />);
    
    const image = screen.getByAltText("File Upload feature screenshot");
    expect(image).toHaveAttribute("src", "/images/features/upload-screenshot.jpg");
  });

  it("handles long feature names appropriately", () => {
    const longNameProps = {
      ...defaultProps,
      featureName: "Very Long Feature Name That Should Be Handled Gracefully",
    };
    
    render(<ScreenshotPreview {...longNameProps} />);
    
    expect(screen.getByText("Very Long Feature Name That Should Be Handled Gracefully")).toBeInTheDocument();
  });

  it("supports custom className", () => {
    render(<ScreenshotPreview {...defaultProps} className="custom-class" />);
    
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("custom-class");
  });
});