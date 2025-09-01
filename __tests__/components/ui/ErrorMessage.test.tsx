/**
 * Tests for ErrorMessage component
 * Testing error display and interaction functionality
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  ErrorMessage,
  FormError,
  PageError,
  InlineError,
} from "@/components/ui/ErrorMessage";

describe("ErrorMessage", () => {
  it("should render error message with default variant", () => {
    render(<ErrorMessage error="Test error message" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should not render when error is null or empty", () => {
    const { rerender } = render(<ErrorMessage error={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<ErrorMessage error="" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should render with title when provided", () => {
    render(<ErrorMessage error="Test error" title="Error Title" />);

    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("should show icon by default", () => {
    render(<ErrorMessage error="Test error" />);

    // Check that an icon is present (we can't test the specific icon without more complex setup)
    const alertElement = screen.getByRole("alert");
    expect(alertElement.querySelector("svg")).toBeInTheDocument();
  });

  it("should hide icon when showIcon is false", () => {
    render(<ErrorMessage error="Test error" showIcon={false} />);

    const alertElement = screen.getByRole("alert");
    expect(alertElement.querySelector("svg")).not.toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button is clicked", () => {
    const mockOnDismiss = jest.fn();
    render(<ErrorMessage error="Test error" onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call onRetry when retry button is clicked", () => {
    const mockOnRetry = jest.fn();
    render(<ErrorMessage error="Test error" onRetry={mockOnRetry} />);

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("should apply different variant styles", () => {
    const { rerender } = render(
      <ErrorMessage error="Test error" variant="error" />
    );
    let alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass(
      "bg-red-50",
      "border-red-200",
      "text-red-800"
    );

    rerender(<ErrorMessage error="Test error" variant="warning" />);
    alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass(
      "bg-yellow-50",
      "border-yellow-200",
      "text-yellow-800"
    );

    rerender(<ErrorMessage error="Test error" variant="info" />);
    alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass(
      "bg-blue-50",
      "border-blue-200",
      "text-blue-800"
    );
  });

  it("should apply different size styles", () => {
    const { rerender } = render(<ErrorMessage error="Test error" size="sm" />);
    let alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("text-sm", "p-3");

    rerender(<ErrorMessage error="Test error" size="md" />);
    alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("text-base", "p-4");

    rerender(<ErrorMessage error="Test error" size="lg" />);
    alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("text-lg", "p-5");
  });

  it("should apply custom className", () => {
    render(<ErrorMessage error="Test error" className="custom-class" />);

    const alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("custom-class");
  });
});

describe("FormError", () => {
  it("should render form error with proper styling", () => {
    render(<FormError error="Form validation error" />);

    expect(screen.getByText("Form validation error")).toBeInTheDocument();
    // Should have form-specific classes
    const errorElement = screen.getByRole("alert");
    expect(errorElement).toHaveClass("text-red-600", "bg-transparent");
  });

  it("should not render when error is null", () => {
    render(<FormError error={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("PageError", () => {
  it("should render page error with default title", () => {
    render(<PageError error="Page load failed" />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Page load failed")).toBeInTheDocument();
  });

  it("should render with custom title", () => {
    render(<PageError error="Network error" title="Connection Failed" />);

    expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("should show retry button when onRetry is provided", () => {
    const mockOnRetry = jest.fn();
    render(<PageError error="Error" onRetry={mockOnRetry} />);

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("should render default error message when error is null", () => {
    render(<PageError error={null} />);

    expect(
      screen.getByText("An unexpected error occurred. Please try again.")
    ).toBeInTheDocument();
  });
});

describe("InlineError", () => {
  it("should render inline error with proper styling", () => {
    render(<InlineError error="Inline error message" />);

    expect(screen.getByText("Inline error message")).toBeInTheDocument();
    const errorElement = screen.getByRole("alert");
    expect(errorElement).toHaveClass("mb-4");
  });

  it("should not render when error is null", () => {
    render(<InlineError error={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<InlineError error="Error" className="custom-inline-class" />);

    const errorElement = screen.getByRole("alert");
    expect(errorElement).toHaveClass("custom-inline-class");
  });
});
