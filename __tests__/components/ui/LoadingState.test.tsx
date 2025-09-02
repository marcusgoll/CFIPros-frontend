/**
 * Tests for LoadingState components
 * Testing loading display and state management functionality
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  LoadingState,
  PageLoading,
  InlineLoading,
  ButtonLoading,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  withLoading,
} from "@/components/ui/LoadingState";

// Mock the LoadingSpinner component
jest.mock("@/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}));

describe("LoadingState", () => {
  it("should render children when not loading and no error", () => {
    render(
      <LoadingState loading={false}>
        <div>Content loaded</div>
      </LoadingState>
    );

    expect(screen.getByText("Content loaded")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("should render loading state when loading is true", () => {
    render(
      <LoadingState loading={true} loadingText="Please wait...">
        <div>Content</div>
      </LoadingState>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("Please wait...")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("should render error state when error is provided", () => {
    render(
      <LoadingState loading={false} error="Something went wrong">
        <div>Content</div>
      </LoadingState>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", () => {
    const mockOnRetry = jest.fn();
    render(
      <LoadingState loading={false} error="Network error" onRetry={mockOnRetry}>
        <div>Content</div>
      </LoadingState>
    );

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("should render custom error component when provided", () => {
    const CustomError = ({ error }: { error: string }) => (
      <div data-testid="custom-error">{error}</div>
    );

    render(
      <LoadingState
        loading={false}
        error="Custom error"
        errorComponent={CustomError}
      >
        <div>Content</div>
      </LoadingState>
    );

    expect(screen.getByTestId("custom-error")).toBeInTheDocument();
    expect(screen.getByText("Custom error")).toBeInTheDocument();
  });

  it("should apply custom className and spinner size", () => {
    const { container } = render(
      <LoadingState
        loading={true}
        className="custom-loading-class"
        spinnerSize="lg"
      >
        <div>Content</div>
      </LoadingState>
    );

    expect(container.firstChild).toHaveClass("custom-loading-class");
    expect(screen.getByTestId("loading-spinner")).toHaveAttribute(
      "data-size",
      "lg"
    );
  });
});

describe("PageLoading", () => {
  it("should render page loading with default text", () => {
    render(<PageLoading />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getAllByText("Loading...")).toHaveLength(2);
  });

  it("should render with custom text", () => {
    render(<PageLoading text="Loading page content..." />);

    expect(screen.getByText("Loading page content...")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <PageLoading className="custom-page-loading" />
    );

    expect(container.firstChild).toHaveClass("custom-page-loading");
  });

  it("should use large spinner size", () => {
    render(<PageLoading />);

    expect(screen.getByTestId("loading-spinner")).toHaveAttribute(
      "data-size",
      "lg"
    );
  });
});

describe("InlineLoading", () => {
  it("should render children when not loading", () => {
    render(
      <InlineLoading loading={false}>
        <span>Loaded content</span>
      </InlineLoading>
    );

    expect(screen.getByText("Loaded content")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("should render loading state when loading is true", () => {
    render(
      <InlineLoading loading={true} text="Processing...">
        <span>Content</span>
      </InlineLoading>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("should use small spinner size", () => {
    render(<InlineLoading loading={true}>Content</InlineLoading>);

    expect(screen.getByTestId("loading-spinner")).toHaveAttribute(
      "data-size",
      "sm"
    );
  });

  it("should apply custom className", () => {
    const { container } = render(
      <InlineLoading loading={true} className="custom-inline-loading">
        <span>Content</span>
      </InlineLoading>
    );

    expect(container.firstChild).toHaveClass("custom-inline-loading");
  });
});

describe("ButtonLoading", () => {
  it("should render children when not loading", () => {
    render(<ButtonLoading loading={false}>Save Changes</ButtonLoading>);

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("should render loading state when loading is true", () => {
    render(
      <ButtonLoading loading={true} loadingText="Saving...">
        Save Changes
      </ButtonLoading>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
  });

  it("should be disabled when loading", () => {
    render(<ButtonLoading loading={true}>Submit</ButtonLoading>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-75", "cursor-not-allowed");
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <ButtonLoading loading={false} disabled={true}>
        Submit
      </ButtonLoading>
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should pass through other button props", () => {
    const handleClick = jest.fn();
    render(
      <ButtonLoading
        loading={false}
        onClick={handleClick}
        data-testid="custom-button"
      >
        Click me
      </ButtonLoading>
    );

    const button = screen.getByTestId("custom-button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("Skeleton", () => {
  it("should render with default classes", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstChild).toHaveClass(
      "animate-pulse",
      "bg-gray-200",
      "rounded"
    );
  });

  it("should apply custom width and height as numbers", () => {
    const { container } = render(<Skeleton width={100} height={50} />);

    expect(container.firstChild).toHaveStyle({
      width: "100px",
      height: "50px",
    });
  });

  it("should apply custom width and height as strings", () => {
    const { container } = render(<Skeleton width="50%" height="2rem" />);

    expect(container.firstChild).toHaveStyle({
      width: "50%",
      height: "2rem",
    });
  });

  it("should apply rounded class when rounded is true", () => {
    const { container } = render(<Skeleton rounded={true} />);

    expect(container.firstChild).toHaveClass("rounded-full");
    expect(container.firstChild).not.toHaveClass("rounded");
  });

  it("should apply custom className", () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);

    expect(container.firstChild).toHaveClass("custom-skeleton");
  });
});

describe("SkeletonText", () => {
  it("should render default number of lines", () => {
    const { container } = render(<SkeletonText />);

    // Default is 3 lines
    expect(container.querySelectorAll('div[style*="height"]')).toHaveLength(3);
  });

  it("should render custom number of lines", () => {
    const { container } = render(<SkeletonText lines={5} />);

    expect(container.querySelectorAll('div[style*="height"]')).toHaveLength(5);
  });

  it("should make last line shorter", () => {
    const { container } = render(<SkeletonText lines={2} />);

    const skeletons = container.querySelectorAll("div[style]");
    expect(skeletons[0]).toHaveStyle({ width: "100%" });
    expect(skeletons[1]).toHaveStyle({ width: "75%" });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SkeletonText className="custom-skeleton-text" />
    );

    expect(container.firstChild).toHaveClass("custom-skeleton-text");
  });
});

describe("SkeletonCard", () => {
  it("should render card skeleton without image by default", () => {
    const { container } = render(<SkeletonCard />);

    expect(
      container.querySelector('[style*="height: 160px"]')
    ).not.toBeInTheDocument();
  });

  it("should render card skeleton with image when showImage is true", () => {
    const { container } = render(<SkeletonCard showImage={true} />);

    expect(
      container.querySelector('[style*="height: 160px"]')
    ).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SkeletonCard className="custom-skeleton-card" />
    );

    expect(container.firstChild).toHaveClass("custom-skeleton-card");
  });
});

describe("withLoading", () => {
  const TestComponent = ({ message }: { message: string }) => (
    <div>{message}</div>
  );

  const WrappedComponent = withLoading(TestComponent);

  it("should render wrapped component when not loading and no error", () => {
    render(<WrappedComponent loading={false} message="Test message" />);

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should render loading component when loading is true", () => {
    render(<WrappedComponent loading={true} message="Test message" />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("should render error state when error is provided", () => {
    render(
      <WrappedComponent
        loading={false}
        error="Error occurred"
        message="Test message"
      />
    );

    expect(screen.getByText("Error occurred")).toBeInTheDocument();
    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("should render custom error component when provided", () => {
    const CustomError = ({ error }: { error: string }) => (
      <div data-testid="hoc-custom-error">{error}</div>
    );

    render(
      <WrappedComponent
        loading={false}
        error="Custom error"
        errorComponent={CustomError}
        message="Test message"
      />
    );

    expect(screen.getByTestId("hoc-custom-error")).toBeInTheDocument();
  });

  it("should have correct display name", () => {
    expect(WrappedComponent.displayName).toBe("withLoading(TestComponent)");
  });

  it("should call onRetry when retry button is clicked", () => {
    const mockOnRetry = jest.fn();
    render(
      <WrappedComponent
        loading={false}
        error="Network error"
        onRetry={mockOnRetry}
        message="Test message"
      />
    );

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});
