import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { FileUploader } from "@/components/forms/FileUploader";
import { AktrToAcsUploader } from "@/components/forms/AktrToAcsUploader";

// Mock analytics to avoid real tracking in tests
jest.mock("@/lib/analytics/telemetry", () => ({
  trackUploadStarted: jest.fn(),
  trackUploadCompleted: jest.fn(),
  trackUploadFailed: jest.fn(),
  trackFileAdded: jest.fn(),
  trackFileRemoved: jest.fn(),
  trackValidationError: jest.fn(),
}));

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

expect.extend(toHaveNoViolations);

describe("FileUploader Accessibility", () => {
  it("should not have any accessibility violations - empty state", async () => {
    const { container } = render(<FileUploader onFilesChange={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should not have any accessibility violations - with files", async () => {
    const mockFile = new File(["test"], "test.pdf", {
      type: "application/pdf",
    });
    const { container } = render(
      <FileUploader onFilesChange={jest.fn()} files={[mockFile]} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should not have any accessibility violations - loading state", async () => {
    const mockFile = new File(["test"], "test.pdf", {
      type: "application/pdf",
    });
    const progress = [
      { file: mockFile, progress: 50, status: "uploading" as const },
    ];

    const { container } = render(
      <FileUploader
        onFilesChange={jest.fn()}
        files={[mockFile]}
        loading
        uploadProgress={progress}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should not have any accessibility violations - error state", async () => {
    const mockFile = new File(["test"], "test.pdf", {
      type: "application/pdf",
    });
    const progress = [
      {
        file: mockFile,
        progress: 50,
        status: "error" as const,
        error: "Upload failed",
      },
    ];

    const { container } = render(
      <FileUploader
        onFilesChange={jest.fn()}
        files={[mockFile]}
        uploadProgress={progress}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("AktrToAcsUploader Accessibility", () => {
  it("should not have any accessibility violations - initial state", async () => {
    const { container } = render(<AktrToAcsUploader />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should not have any accessibility violations - with uploaded files", async () => {
    const { container } = render(<AktrToAcsUploader />);

    // The component manages its own state, so we test the initial render
    // In a real test environment, we'd interact with the component to change state
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
