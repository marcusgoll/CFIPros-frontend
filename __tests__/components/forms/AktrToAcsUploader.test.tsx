import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";
import { AktrToAcsUploader } from "@/components/forms/AktrToAcsUploader";
import {
  trackUploadStarted,
  trackUploadCompleted,
  trackUploadFailed,
} from "@/lib/analytics/telemetry";

// Mock the router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the analytics module
jest.mock("@/lib/analytics/telemetry", () => ({
  trackUploadStarted: jest.fn(),
  trackUploadCompleted: jest.fn(),
  trackUploadFailed: jest.fn(),
  trackFileAdded: jest.fn(),
  trackFileRemoved: jest.fn(),
  trackValidationError: jest.fn(),
}));

const mockPush = jest.fn();
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedTrackUploadStarted = trackUploadStarted as jest.MockedFunction<
  typeof trackUploadStarted
>;
const mockedTrackUploadCompleted = trackUploadCompleted as jest.MockedFunction<
  typeof trackUploadCompleted
>;
const mockedTrackUploadFailed = trackUploadFailed as jest.MockedFunction<
  typeof trackUploadFailed
>;

describe("AktrToAcsUploader Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    // Default successful fetch mock - note the backend returns batch_id with underscore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ batch_id: "demo-batch-id" }),
    } as any);
  });

  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File(["test content"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  const validPdfFile = createMockFile(
    "aktr-report.pdf",
    2 * 1024 * 1024,
    "application/pdf"
  );

  it("renders the upload interface with proper headings and instructions", () => {
    render(<AktrToAcsUploader />);

    // Check main heading
    expect(
      screen.getByRole("heading", { name: /upload knowledge test reports/i })
    ).toBeInTheDocument();

    // Check file uploader is present
    expect(
      screen.getByRole("button", { name: /browse files/i })
    ).toBeInTheDocument();

    // Check help text
    expect(
      screen.getByText(/what is a knowledge test report/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/airman knowledge test report/i)
    ).toBeInTheDocument();

    // Check submit button is initially disabled
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when files are selected", async () => {
    const user = userEvent.setup();
    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Upload a file
    await user.upload(fileInput, validPdfFile);

    // Should be enabled after file selection
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Should show file count
    expect(screen.getByText(/1 file selected/i)).toBeInTheDocument();
  });

  it("shows processing state during upload", async () => {
    const user = userEvent.setup();
    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });

    // Slow down the upload to observe processing state
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ batch_id: "demo-batch-id" }),
              } as any),
            200
          )
        )
    );

    // Upload file and submit
    await user.upload(fileInput, validPdfFile);
    await user.click(submitButton);

    // Check processing state via button accessible name
    expect(
      screen.getByRole("button", { name: /processing files/i })
    ).toBeDisabled();

    // Check analytics tracking
    expect(mockedTrackUploadStarted).toHaveBeenCalledWith([validPdfFile]);
  });

  it("navigates to batch status page on successful upload", async () => {
    const user = userEvent.setup();
    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });

    // Upload file and submit
    await user.upload(fileInput, validPdfFile);
    await user.click(submitButton);

    // Wait for upload completion and navigation to batch status page
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/batches/demo-batch-id");
      },
      { timeout: 5000 }
    );

    expect(mockedTrackUploadCompleted).toHaveBeenCalled();
  });

  it("handles upload errors gracefully", async () => {
    const user = userEvent.setup();

    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });

    // Make fetch fail
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error("network error")
    );

    // Upload file and submit
    await user.upload(fileInput, validPdfFile);
    await user.click(submitButton);

    // Wait for error to appear
    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(/upload failed/i);
      },
      { timeout: 5000 }
    );

    // Check retry button is available
    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    // Check analytics tracking
    expect(mockedTrackUploadFailed).toHaveBeenCalled();
  });

  it("updates file count display correctly", async () => {
    const user = userEvent.setup();
    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });

    // Initially no files
    expect(screen.getByText(/no files selected/i)).toBeInTheDocument();

    // Upload one file
    await user.upload(fileInput, validPdfFile);
    await waitFor(() => {
      expect(screen.getByText(/1 file selected/i)).toBeInTheDocument();
    });

    // Upload multiple files
    const secondFile = createMockFile(
      "second-report.pdf",
      1024 * 1024,
      "application/pdf"
    );
    await user.upload(fileInput, [validPdfFile, secondFile]);

    await waitFor(() => {
      expect(screen.getByText(/2 files selected/i)).toBeInTheDocument();
    });
  });

  it("provides helpful information about AKTR reports", () => {
    render(<AktrToAcsUploader />);

    // Check help section
    expect(
      screen.getByText(/what is a knowledge test report/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/airman knowledge test report/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/airman certification standards/i)
    ).toBeInTheDocument();
  });

  it("shows progress for multiple files independently", async () => {
    const user = userEvent.setup();
    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });

    const file1 = createMockFile("report1.pdf", 1024 * 1024, "application/pdf");
    const file2 = createMockFile(
      "report2.pdf",
      2 * 1024 * 1024,
      "application/pdf"
    );

    // Keep fetch pending a bit to observe progress bars
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ batch_id: "demo-batch-id" }),
              } as any),
            800
          )
        )
    );

    // Upload multiple files
    await user.upload(fileInput, [file1, file2]);
    await user.click(submitButton);

    // Check that progress bars appear for both files
    await waitFor(() => {
      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars.length).toBeGreaterThanOrEqual(2);
    });

    // Check file names are displayed
    expect(screen.getByText("report1.pdf")).toBeInTheDocument();
    expect(screen.getByText("report2.pdf")).toBeInTheDocument();
  });

  it("handles retry functionality correctly", async () => {
    const user = userEvent.setup();
    render(<AktrToAcsUploader />);

    const fileInput = screen.getByLabelText(/file upload/i, {
      selector: 'input[type="file"]',
    });
    const submitButton = screen.getByRole("button", {
      name: /analyze reports/i,
    });

    // First request fails
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error("network error")
    );

    // Upload file and submit
    await user.upload(fileInput, validPdfFile);
    await user.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // Reset fetch to succeed on retry
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ batch_id: "retry-batch-id" }),
    } as any);

    // Click retry button
    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    // Should eventually navigate on successful retry
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/batches/retry-batch-id");
      },
      { timeout: 5000 }
    );
  });
});