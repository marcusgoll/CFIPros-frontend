/**
 * Comprehensive tests for FileUploader component  
 * Tests file upload functionality, validation, drag/drop, and accessibility
 * Part of Task 2.3: Form Validation Testing
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FileUploader, FileUploadProgress } from "@/components/forms/FileUploader";

// Mock the analytics module with proper functions
jest.mock("@/lib/analytics/telemetry", () => ({
  trackUploadStarted: jest.fn(),
  trackFileAdded: jest.fn(),
  trackFileRemoved: jest.fn(),
  trackValidationError: jest.fn(),
}));

// Mock utilities
jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
  formatFileSize: (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  },
}));

import * as telemetry from "@/lib/analytics/telemetry";

describe("FileUploader Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File(["test content"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  const validPdfFile = createMockFile("test.pdf", 5 * 1024 * 1024, "application/pdf");
  const validJpgFile = createMockFile("test.jpg", 2 * 1024 * 1024, "image/jpeg");
  const validPngFile = createMockFile("test.png", 3 * 1024 * 1024, "image/png");
  const invalidFile = createMockFile("test.txt", 1024, "text/plain");
  const oversizedFile = createMockFile("large.pdf", 15 * 1024 * 1024, "application/pdf");

  describe("Rendering and Basic Functionality", () => {
    it("renders file upload interface with proper accessibility attributes", () => {
      render(<FileUploader onFilesChange={jest.fn()} />);

      // Check for main dropzone button
      const dropzone = screen.getByRole("button");
      expect(dropzone).toBeInTheDocument();
      expect(dropzone).toHaveAttribute(
        "aria-label",
        "Click to browse files or drag and drop files here"
      );

      // Check for file input with proper accessibility
      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("type", "file");

      // Check for instructions
      expect(screen.getByText(/drag.*drop files here/i)).toBeInTheDocument();
      expect(screen.getByText(/click to browse/i)).toBeInTheDocument();

      // Check file type restrictions
      expect(screen.getByText(/pdf.*jpg.*png/i)).toBeInTheDocument();

      // Check file size limit
      expect(screen.getByText(/10\.0 mb/i)).toBeInTheDocument();

      // Check file count limit
      expect(screen.getByText(/maximum.*5.*files/i)).toBeInTheDocument();
    });

    it("should render with custom configuration", () => {
      render(
        <FileUploader
          onFilesChange={jest.fn()}
          maxFiles={3}
          maxSize={5 * 1024 * 1024}
          acceptedTypes={["application/pdf"]}
        />
      );

      expect(screen.getByText("Maximum 3 files allowed")).toBeInTheDocument();
      expect(screen.getByText("Maximum file size: 5.0 MB per file")).toBeInTheDocument();
      expect(screen.getByText("Accepted file types: PDF")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <FileUploader onFilesChange={jest.fn()} className="custom-uploader" />
      );
      expect(container.firstChild).toHaveClass("custom-uploader");
    });

    it("should show loading state", () => {
      render(<FileUploader onFilesChange={jest.fn()} loading />);

      expect(screen.getByText(/processing files/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/file processing progress/i)).toBeInTheDocument();

      // Dropzone button should be disabled during loading
      const dropzone = screen.getByRole("button");
      expect(dropzone).toBeDisabled();
    });

    it("should be disabled when specified", () => {
      render(<FileUploader onFilesChange={jest.fn()} disabled={true} />);

      const dropzone = screen.getByRole("button");
      expect(dropzone).toBeDisabled();
    });
  });

  describe("File Selection and Validation", () => {
    it("accepts valid files through file input", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      render(<FileUploader onFilesChange={onFilesChange} />);

      // Find file input
      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, [validPdfFile, validPngFile]);
      });

      await waitFor(() => {
        expect(onFilesChange).toHaveBeenCalledWith([validPdfFile, validPngFile]);
        expect(telemetry.trackUploadStarted).toHaveBeenCalledWith([validPdfFile, validPngFile]);
        expect(telemetry.trackFileAdded).toHaveBeenCalledWith(validPdfFile);
        expect(telemetry.trackFileAdded).toHaveBeenCalledWith(validPngFile);
      });
    });

    it("rejects invalid file types with clear error messages", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      render(<FileUploader onFilesChange={onFilesChange} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, [invalidFile]);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/only pdf.*jpg.*png files are allowed/i);
        expect(telemetry.trackValidationError).toHaveBeenCalledWith(
          "Only PDF, JPG, and PNG files are allowed",
          [invalidFile]
        );
      });

      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it("rejects oversized files with clear error messages", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      render(<FileUploader onFilesChange={onFilesChange} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, [oversizedFile]);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/each file must be less than 10mb/i);
        expect(telemetry.trackValidationError).toHaveBeenCalledWith(
          "Each file must be less than 10MB",
          [oversizedFile]
        );
      });

      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it("rejects more than maximum files with clear error message", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      const sixFiles = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`test${i}.pdf`, 1024 * 1024, "application/pdf")
      );

      render(<FileUploader onFilesChange={onFilesChange} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, sixFiles);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/maximum.*5.*files.*allowed/i);
        expect(telemetry.trackValidationError).toHaveBeenCalledWith(
          "Maximum 5 files allowed",
          sixFiles
        );
      });

      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it("should validate all allowed file types", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      const allowedFiles = [
        createMockFile("test.pdf", 1024, "application/pdf"),
        createMockFile("test.jpg", 1024, "image/jpeg"),
        createMockFile("test.png", 1024, "image/png"),
      ];

      render(<FileUploader onFilesChange={onFilesChange} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      for (const file of allowedFiles) {
        await act(async () => {
          await user.upload(fileInput, [file]);
        });

        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalledWith([file]);
        });

        onFilesChange.mockClear();
      }
    });

    it("should handle files at exact size limit", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();
      const exactSizeFile = createMockFile("exact.pdf", 10 * 1024 * 1024, "application/pdf");

      render(<FileUploader onFilesChange={onFilesChange} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, [exactSizeFile]);
      });

      await waitFor(() => {
        expect(onFilesChange).toHaveBeenCalledWith([exactSizeFile]);
      });
    });
  });

  describe("File Management", () => {
    it("displays uploaded files with remove option", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      render(
        <FileUploader
          onFilesChange={onFilesChange}
          files={[validPdfFile, validJpgFile]}
        />
      );

      // Check file list is displayed
      expect(screen.getByText("Uploaded Files (2)")).toBeInTheDocument();
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
      expect(screen.getByText("test.jpg")).toBeInTheDocument();

      // Check file sizes are displayed
      expect(screen.getByText("5.0 MB")).toBeInTheDocument();
      expect(screen.getByText("2.0 MB")).toBeInTheDocument();

      // Check remove buttons
      const removeButtons = screen.getAllByLabelText(/remove.*file/i);
      expect(removeButtons).toHaveLength(2);

      // Test removing a file
      await act(async () => {
        await user.click(removeButtons[0]);
      });

      expect(onFilesChange).toHaveBeenCalledWith([validJpgFile]);
      expect(telemetry.trackFileRemoved).toHaveBeenCalledWith(validPdfFile);
    });

    it("should not show remove buttons when loading", () => {
      render(
        <FileUploader
          onFilesChange={jest.fn()}
          files={[validPdfFile]}
          loading={true}
        />
      );

      expect(screen.queryByRole("button", { name: /remove file/i })).not.toBeInTheDocument();
    });

    it("should handle empty file list", () => {
      render(<FileUploader onFilesChange={jest.fn()} files={[]} />);

      expect(screen.queryByText(/uploaded files/i)).not.toBeInTheDocument();
    });

    it("should display correct file count", () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        createMockFile(`test${i}.pdf`, 1024, "application/pdf")
      );

      render(<FileUploader onFilesChange={jest.fn()} files={files} />);

      expect(screen.getByText("Uploaded Files (3)")).toBeInTheDocument();
    });
  });

  describe("Upload Progress", () => {
    it("shows progress for individual files when uploading", () => {
      const files = [validPdfFile, validJpgFile];
      const progress: FileUploadProgress[] = [
        { file: validPdfFile, progress: 45, status: "uploading" },
        { file: validJpgFile, progress: 80, status: "uploading" },
      ];

      render(
        <FileUploader
          onFilesChange={jest.fn()}
          files={files}
          uploadProgress={progress}
          loading
        />
      );

      // Check progress percentages are displayed
      expect(screen.getByText("45%")).toBeInTheDocument();
      expect(screen.getByText("80%")).toBeInTheDocument();
      expect(screen.getByText("Uploading...")).toBeInTheDocument();

      // Check progress bars have proper ARIA attributes
      const progressBars = screen.getAllByRole("progressbar");
      const fileProgressBars = progressBars.filter((bar) =>
        bar.getAttribute("aria-label")?.includes("Upload progress for")
      );
      
      expect(fileProgressBars).toHaveLength(2);
      expect(fileProgressBars[0]).toHaveAttribute("aria-valuenow", "45");
      expect(fileProgressBars[1]).toHaveAttribute("aria-valuenow", "80");
      expect(fileProgressBars[0]).toHaveAttribute("aria-valuemin", "0");
      expect(fileProgressBars[0]).toHaveAttribute("aria-valuemax", "100");
    });

    it("handles upload completion states", () => {
      const files = [validPdfFile];
      const progress: FileUploadProgress[] = [
        { file: validPdfFile, progress: 100, status: "complete" },
      ];

      render(
        <FileUploader
          onFilesChange={jest.fn()}
          files={files}
          uploadProgress={progress}
        />
      );

      expect(screen.getByLabelText(/upload complete/i)).toBeInTheDocument();
    });

    it("handles upload errors gracefully", () => {
      const files = [validPdfFile, validJpgFile];
      const progress: FileUploadProgress[] = [
        { file: validPdfFile, progress: 100, status: "complete" },
        {
          file: validJpgFile,
          progress: 50,
          status: "error",
          error: "Upload failed",
        },
      ];

      render(
        <FileUploader
          onFilesChange={jest.fn()}
          files={files}
          uploadProgress={progress}
        />
      );

      // Check success state
      expect(screen.getByLabelText(/upload complete/i)).toBeInTheDocument();

      // Check error state
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
      expect(screen.getByLabelText(/upload error/i)).toBeInTheDocument();
    });

    it("should show progress without errors when no progress data", () => {
      render(
        <FileUploader
          onFilesChange={jest.fn()}
          files={[validPdfFile]}
        />
      );

      // Should not show progress elements when no progress data
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("progressbar", { name: /upload progress/i })).not.toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("announces drag and drop states to screen readers", () => {
      const onFilesChange = jest.fn();

      render(<FileUploader onFilesChange={onFilesChange} />);

      const dropzoneContainer = screen.getByRole("button").parentElement;

      // Test drag enter
      act(() => {
        fireEvent.dragEnter(dropzoneContainer!, {
          dataTransfer: {
            files: [validPdfFile],
            types: ["Files"],
          },
        });
      });

      expect(screen.getByText(/drop files here/i)).toBeInTheDocument();

      // Test drag leave
      act(() => {
        fireEvent.dragLeave(dropzoneContainer!);
      });

      expect(screen.getByText(/drag.*drop files here/i)).toBeInTheDocument();
    });

    it("should handle drag over events", () => {
      render(<FileUploader onFilesChange={jest.fn()} />);

      const dropzoneContainer = screen.getByRole("button").parentElement;

      act(() => {
        fireEvent.dragOver(dropzoneContainer!, {
          dataTransfer: {
            files: [validPdfFile],
            types: ["Files"],
          },
        });
      });

      // Should not crash and maintain functionality
      expect(dropzoneContainer).toBeInTheDocument();
    });

    it("should show visual feedback during drag", () => {
      render(<FileUploader onFilesChange={jest.fn()} />);

      const dropzoneContainer = screen.getByRole("button").parentElement;

      act(() => {
        fireEvent.dragEnter(dropzoneContainer!);
      });

      // Should show active drag state
      expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("provides keyboard navigation support", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      render(<FileUploader onFilesChange={onFilesChange} />);

      const dropzone = screen.getByRole("button");

      // Test keyboard activation
      await act(async () => {
        dropzone.focus();
      });

      expect(dropzone).toHaveFocus();

      await act(async () => {
        await user.keyboard("{Enter}");
      });

      // Verify dropzone is interactive
      expect(dropzone).toHaveFocus();
    });

    it("meets accessibility requirements", () => {
      const { container } = render(<FileUploader onFilesChange={jest.fn()} />);

      // Check for proper ARIA labels and roles
      const dropzone = screen.getByRole("button");
      expect(dropzone).toHaveAttribute("aria-label");

      // Check for proper form associations
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute("aria-describedby");

      // Check color contrast is maintained through proper classes
      expect(dropzone.parentElement).toHaveClass("border-2"); // Ensures visible border
    });

    it("supports progressive enhancement without JavaScript", () => {
      render(<FileUploader onFilesChange={jest.fn()} />);

      // Should render a file input that works without JS
      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );
      expect(fileInput).toHaveAttribute("multiple");
      expect(fileInput).toHaveAttribute("accept");
      expect(fileInput.getAttribute("accept")).toContain("pdf");
      expect(fileInput.getAttribute("accept")).toContain("jpeg");
      expect(fileInput.getAttribute("accept")).toContain("png");
    });

    it("should announce validation errors with role alert", async () => {
      const user = userEvent.setup();
      render(<FileUploader onFilesChange={jest.fn()} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, [invalidFile]);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/only pdf.*jpg.*png files are allowed/i);
      });
    });

    it("should provide screen reader announcements", () => {
      render(<FileUploader onFilesChange={jest.fn()} />);

      // Check for screen reader only content
      const srOnlyContent = document.querySelector('.sr-only');
      expect(srOnlyContent).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle files with special characters in names", () => {
      const specialFile = createMockFile(
        "файл с русскими символами & спец!@#$%^&*()символами.pdf",
        1024,
        "application/pdf"
      );

      render(<FileUploader onFilesChange={jest.fn()} files={[specialFile]} />);

      expect(screen.getByText("файл с русскими символами & спец!@#$%^&*()символами.pdf")).toBeInTheDocument();
    });

    it("should handle extremely large file names", () => {
      const longFileName = "a".repeat(200) + ".pdf";
      const longFile = createMockFile(longFileName, 1024, "application/pdf");

      render(<FileUploader onFilesChange={jest.fn()} files={[longFile]} />);

      expect(screen.getByText(longFileName)).toBeInTheDocument();
    });

    it("should handle zero-byte files", () => {
      const emptyFile = createMockFile("empty.pdf", 0, "application/pdf");

      render(<FileUploader onFilesChange={jest.fn()} files={[emptyFile]} />);

      expect(screen.getByText("0 B")).toBeInTheDocument();
    });

    it("should handle multiple validation errors", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();

      // File that's both wrong type and too large
      const badFile = createMockFile("bad.exe", 15 * 1024 * 1024, "application/exe");

      render(<FileUploader onFilesChange={onFilesChange} />);

      const fileInput = screen.getByLabelText(
        /file upload input for knowledge test reports/i
      );

      await act(async () => {
        await user.upload(fileInput, [badFile]);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        // Should show one of the validation errors (typically the first one encountered)
        expect(alert).toBeInTheDocument();
      });

      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it("should handle rapid file additions and removals", async () => {
      const user = userEvent.setup();
      const onFilesChange = jest.fn();
      const file = createMockFile("test.pdf", 1024, "application/pdf");

      render(<FileUploader onFilesChange={onFilesChange} files={[file]} />);

      const removeButton = screen.getByRole("button", { name: /remove file test\.pdf/i });
      
      // Rapid clicks should be handled properly
      await act(async () => {
        await user.click(removeButton);
        await user.click(removeButton);
        await user.click(removeButton);
      });

      // Should only call once (subsequent clicks on removed element)
      expect(onFilesChange).toHaveBeenCalledTimes(1);
    });

    it("should handle large numbers of files efficiently", () => {
      const manyFiles = Array.from({ length: 50 }, (_, i) =>
        createMockFile(`file${i}.pdf`, 1024, "application/pdf")
      );

      render(
        <FileUploader
          onFilesChange={jest.fn()}
          files={manyFiles}
          maxFiles={100}
        />
      );

      // Should render without performance issues
      expect(screen.getByText("Uploaded Files (50)")).toBeInTheDocument();
    });

    it("should handle component re-renders gracefully", () => {
      const { rerender } = render(<FileUploader onFilesChange={jest.fn()} />);

      rerender(<FileUploader onFilesChange={jest.fn()} loading={true} />);
      rerender(<FileUploader onFilesChange={jest.fn()} disabled={true} />);

      // Should not crash
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Custom Configuration", () => {
    it("should respect custom maxFiles prop", () => {
      render(<FileUploader onFilesChange={jest.fn()} maxFiles={3} />);

      expect(screen.getByText("Maximum 3 files allowed")).toBeInTheDocument();
    });

    it("should respect custom maxSize prop", () => {
      render(<FileUploader onFilesChange={jest.fn()} maxSize={5 * 1024 * 1024} />);

      expect(screen.getByText("Maximum file size: 5.0 MB per file")).toBeInTheDocument();
    });

    it("should respect custom acceptedTypes prop", () => {
      render(
        <FileUploader
          onFilesChange={jest.fn()}
          acceptedTypes={["application/pdf"]}
        />
      );

      expect(screen.getByText("Accepted file types: PDF")).toBeInTheDocument();
    });

    it("should format accepted types correctly", () => {
      render(
        <FileUploader
          onFilesChange={jest.fn()}
          acceptedTypes={["application/pdf", "image/jpeg", "text/plain"]}
        />
      );

      expect(screen.getByText("Accepted file types: PDF, JPG, PLAIN")).toBeInTheDocument();
    });
  });
});