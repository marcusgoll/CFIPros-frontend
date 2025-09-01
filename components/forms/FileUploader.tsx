"use client";

import React, { useCallback, useState, useId } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/Button";
import { cn, formatFileSize } from "@/lib/utils";
import { aktrFileUploadSchema } from "@/lib/validation/schemas";
import {
  trackUploadStarted,
  trackFileAdded,
  trackFileRemoved,
  trackValidationError,
} from "@/lib/analytics/telemetry";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

export interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  files?: File[];
  loading?: boolean;
  uploadProgress?: FileUploadProgress[];
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  onFilesChange,
  files = [],
  loading = false,
  uploadProgress = [],
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // Align with schema: 10MB
  acceptedTypes = ["application/pdf", "image/jpeg", "image/png"],
  className,
  disabled = false,
}: FileUploaderProps) {
  const [validationError, setValidationError] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  const errorId = useId();
  const instructionsId = useId();

  const validateFiles = useCallback((newFiles: File[]) => {
    try {
      aktrFileUploadSchema.parse({ files: newFiles });
      setValidationError("");
      return true;
    } catch (error: unknown) {
      const maybeZod = error as { errors?: Array<{ message?: string }> };
      const errorMessage =
        maybeZod?.errors?.[0]?.message || "Invalid files selected";
      setValidationError(errorMessage);
      trackValidationError(errorMessage, newFiles);
      return false;
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (validateFiles(acceptedFiles)) {
        onFilesChange(acceptedFiles);
        trackUploadStarted(acceptedFiles);

        // Track individual file additions
        acceptedFiles.forEach((file) => {
          trackFileAdded(file);
        });
      }
      setIsDragActive(false);
    },
    [onFilesChange, validateFiles]
  );

  const onDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDropRejected: (fileRejections) => {
      // Prefer specific, user-friendly errors matching schema expectations
      const codes = fileRejections.flatMap((r) => r.errors.map((e) => e.code));
      if (codes.includes("too-many-files")) {
        const msg = `Maximum ${maxFiles} files allowed`;
        setValidationError(msg);
        trackValidationError(msg, fileRejections.map((r) => r.file));
        return;
      }
      if (codes.includes("file-too-large")) {
        // Match schema wording: no space, no decimals
        const msg = "Each file must be less than 10MB";
        setValidationError(msg);
        trackValidationError(msg, fileRejections.map((r) => r.file));
        return;
      }
      if (codes.includes("file-invalid-type")) {
        const msg = "Only PDF, JPG, and PNG files are allowed";
        setValidationError(msg);
        trackValidationError(msg, fileRejections.map((r) => r.file));
        return;
      }
      // Generic fallback
      const fallback = "Invalid files selected";
      setValidationError(fallback);
      trackValidationError(fallback, fileRejections.map((r) => r.file));
    },
    onDragEnter,
    onDragLeave,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    multiple: true,
    maxFiles,
    maxSize,
    disabled: disabled || loading,
    noClick: true, // We'll handle click manually for better a11y
  });

  const removeFile = useCallback(
    (fileToRemove: File) => {
      const updatedFiles = files.filter((file) => file !== fileToRemove);
      onFilesChange(updatedFiles);
      trackFileRemoved(fileToRemove);
    },
    [files, onFilesChange]
  );

  const getProgressForFile = (file: File) => {
    return uploadProgress.find((p) => p.file === file);
  };

  const formatAcceptedTypes = () => {
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "image/jpeg": "JPG",
      "image/png": "PNG",
    };
    return acceptedTypes
      .map((type) => {
        const alias = typeMap[type];
        if (alias) {
          return alias;
        }
        const subtype = type.split("/")[1] ?? type;
        return subtype.toUpperCase();
      })
      .join(", ");
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Main Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all duration-200",
          "flex min-h-[200px] flex-col items-center justify-center p-8",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          {
            "bg-primary/5 border-primary": isDragActive,
            "border-gray-300 bg-gray-50": !isDragActive && !disabled,
            "border-gray-200 bg-gray-100 opacity-50": disabled || loading,
            "hover:border-gray-400 hover:bg-gray-100":
              !isDragActive && !disabled && !loading,
          }
        )}
      >
        <input
          {...getInputProps()}
          aria-label="File upload input for knowledge test reports"
          aria-describedby={`${instructionsId} ${validationError ? errorId : ""}`}
        />

        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={open}
          disabled={disabled || loading}
          aria-label="Click to browse files or drag and drop files here"
          className="flex h-auto flex-col items-center space-y-4 py-8"
        >
          {loading ? (
            <Loader2
              className="h-12 w-12 animate-spin text-gray-400"
              aria-hidden="true"
            />
          ) : (
            <Upload
              className={cn(
                "h-12 w-12 transition-colors",
                isDragActive ? "text-primary" : "text-gray-400"
              )}
              aria-hidden="true"
            />
          )}

          <div className="space-y-2 text-center">
            <p className="text-lg font-medium text-gray-900">
              {loading
                ? "Processing files..."
                : isDragActive
                  ? "Drop files here"
                  : "Drag & drop files here"}
            </p>
            <p className="text-sm text-gray-600">
              {loading ? "Please wait" : "or click to browse"}
            </p>
          </div>
        </Button>

        {loading && (
          <div
            role="progressbar"
            aria-label="File processing progress"
            className="mt-4 w-full max-w-xs"
          >
            <div className="h-2 rounded-full bg-gray-200">
              <div className="h-2 w-1/3 animate-pulse rounded-full bg-primary"></div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div
        id={instructionsId}
        className="space-y-1 text-center text-sm text-gray-600"
      >
        <p>Accepted file types: {formatAcceptedTypes()}</p>
        <p>Maximum file size: {formatFileSize(maxSize)} per file</p>
        <p>Maximum {maxFiles} files allowed</p>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">{validationError}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">
            Uploaded Files ({files.length})
          </h3>
          <ul className="space-y-2" role="list">
            {files.map((file, index) => {
              const progress = getProgressForFile(file);
              const isComplete = progress?.status === "complete";
              const hasError = progress?.status === "error";

              return (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="flex-shrink-0">
                      {hasError ? (
                        <AlertCircle
                          className="h-5 w-5 text-red-500"
                          aria-label="Upload error"
                        />
                      ) : isComplete ? (
                        <CheckCircle2
                          className="h-5 w-5 text-green-500"
                          aria-label="Upload complete"
                        />
                      ) : (
                        <FileText
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>

                      {/* Progress Bar */}
                      {progress && progress.status === "uploading" && (
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                            <span>Uploading...</span>
                            <span>{progress.progress}%</span>
                          </div>
                          <div
                            role="progressbar"
                            aria-valuenow={progress.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Upload progress for ${file.name}`}
                            className="h-1.5 w-full rounded-full bg-gray-200"
                          >
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {hasError && progress?.error && (
                        <p className="mt-1 text-xs text-red-600">
                          {progress.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  {!loading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      aria-label={`Remove file ${file.name}`}
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Accessibility Instructions for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isDragActive && "Files are ready to be dropped"}
        {validationError && `Error: ${validationError}`}
        {loading && "Files are being processed"}
      </div>
    </div>
  );
}
