"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileUploader, FileUploadProgress } from "./FileUploader";
import { Button } from "@/components/ui/Button";
// Telemetry for uploads is handled in API and uploader component
import { AlertCircle, ArrowRight } from "lucide-react";
import {
  trackUploadStarted,
  trackUploadCompleted,
  trackUploadFailed,
} from "@/lib/analytics/telemetry";

interface UploadState {
  files: File[];
  isUploading: boolean;
  uploadProgress: FileUploadProgress[];
  error: string | null;
}

export function AktrToAcsUploader() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({
    files: [],
    isUploading: false,
    uploadProgress: [],
    error: null,
  });

  const handleFilesChange = useCallback((files: File[]) => {
    setState((prev) => ({
      ...prev,
      files,
      error: null,
    }));
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]): Promise<{ batchId: string }> => {
      // Create FormData for multipart upload
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Initialize progress for all files
      const initialProgress: FileUploadProgress[] = files.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));

      setState((prev) => ({
        ...prev,
        uploadProgress: initialProgress,
      }));

      // Start progress simulation while uploading
      const progressInterval = setInterval(() => {
        setState((prev) => {
          const newProgress = prev.uploadProgress.map((p) => {
            if (p.status === "uploading" && p.progress < 90) {
              const increment = Math.random() * 10 + 5; // 5-15% increments up to 90%
              return {
                ...p,
                progress: Math.min(90, Math.round(p.progress + increment)),
              };
            }
            return p;
          });
          return { ...prev, uploadProgress: newProgress };
        });
      }, 300);

      const startedAt = Date.now();
      try {
        const response = await fetch("/api/extractor/extract", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Batch upload failed with status ${response.status}`
          );
        }

        const result = await response.json();

        // Complete all file progress
        setState((prev) => ({
          ...prev,
          uploadProgress: prev.uploadProgress.map((p) => ({
            ...p,
            progress: 100,
            status: "complete" as const,
          })),
        }));

        // Track success
        trackUploadCompleted(files, Date.now() - startedAt);

        // Backend returns batch_id (with underscore), frontend expects batchId (camelCase)
        return { batchId: result.batch_id };
      } catch (error) {
        clearInterval(progressInterval);

        // Mark all files as failed
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setState((prev) => ({
          ...prev,
          uploadProgress: prev.uploadProgress.map((p) => ({
            ...p,
            status: "error" as const,
            error: errorMessage,
          })),
        }));

        // Track failure
        trackUploadFailed(files, errorMessage);

        throw error;
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (state.files.length === 0) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
    }));

    try {
      // Track start
      trackUploadStarted(state.files);
      const response = await uploadFiles(state.files);

      // Navigate to batch status page with the batch ID
      router.push(`/batches/${response.batchId}`);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }));
    }
  }, [state.files, router, uploadFiles]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      uploadProgress: [],
    }));
    handleSubmit();
  }, [handleSubmit]);

  const canSubmit = state.files.length > 0 && !state.isUploading;

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Upload Knowledge Test Reports
        </h2>
        <FileUploader
          onFilesChange={handleFilesChange}
          files={state.files}
          loading={state.isUploading}
          uploadProgress={state.uploadProgress}
          disabled={state.isUploading}
        />
      </div>

      {/* Error Display */}
      {state.error && (
        <div
          role="alert"
          className="flex items-start space-x-3 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
            aria-hidden="true"
          />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
            <p className="mt-1 text-sm text-red-700">{state.error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="flex flex-col border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <p className="text-sm text-gray-600" aria-live="polite">
            {state.files.length > 0 ? (
              <>
                {state.files.length} file{state.files.length !== 1 ? "s" : ""}{" "}
                selected
                {state.isUploading && " Processing..."}
              </>
            ) : (
              "No files selected"
            )}
          </p>
          {state.files.length > 0 && !state.isUploading && (
            <p className="mt-1 text-xs text-gray-500">
              Click "Analyze Reports" to generate your ACS study plan
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={state.isUploading}
          className="w-full sm:w-auto"
        >
          {state.isUploading ? (
            "Processing Files..."
          ) : (
            <>
              Analyze Reports
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-900">
          What is a Knowledge Test Report?
        </h3>
        <p className="text-sm text-gray-600">
          After taking an FAA knowledge test, you receive an Airman Knowledge
          Test Report (AKTR) that shows which areas you missed. Upload this
          report to get targeted study recommendations based on the Airman
          Certification Standards (ACS).
        </p>
      </div>
    </div>
  );
}
