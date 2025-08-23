"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { useFileUpload, type UploadedFile } from "@/lib/hooks/useFileUpload";
import { formatFileSize, getFileTypeLabel } from "@/lib/utils/fileValidation";
import { AnalysisService } from "@/lib/services/analysisService";

export function UploadForm() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    retryUpload,
    config,
  } = useFileUpload({
    onUploadError: (file, error) => {
      setUploadErrors(prev => [...prev, `${file.file.name}: ${error}`]);
    },
  });

  // Memoize file operations to prevent unnecessary re-renders
  const memoizedRemoveFile = useCallback((id: string) => removeFile(id), [removeFile]);
  const memoizedRetryUpload = useCallback((id: string) => retryUpload(id), [retryUpload]);

  const handleFileValidationErrors = useCallback((invalidFiles: { file: File; error: string }[]) => {
    if (invalidFiles.length > 0) {
      setUploadErrors(prev => [
        ...prev.slice(-10), // Keep only last 10 errors to prevent memory leak
        ...invalidFiles.map(({ file, error }) => `${file.name}: ${error}`)
      ].slice(0, 20)); // Never exceed 20 total errors
    }
  }, []);

  const handleProcessingError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setUploadErrors(prev => [
      ...prev.slice(-10),
      `Error processing files: ${errorMessage}`
    ].slice(0, 20));
  }, []);

  const clearErrors = useCallback(() => {
    setUploadErrors([]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const { invalidFiles } = await addFiles(e.dataTransfer.files);
      handleFileValidationErrors(invalidFiles);
    } catch (error) {
      handleProcessingError(error);
    }
  }, [addFiles, handleFileValidationErrors, handleProcessingError]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      try {
        const { invalidFiles } = await addFiles(e.target.files);
        handleFileValidationErrors(invalidFiles);
      } catch (error) {
        handleProcessingError(error);
      }
      
      // Reset input
      e.target.value = "";
    }
  }, [addFiles, handleFileValidationErrors, handleProcessingError]);

  return (
    <div className="space-y-8">
      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={clearErrors}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Statistics */}
      {files.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium text-blue-900">{stats.total}</span>
                <span className="text-blue-700"> files</span>
              </div>
              {stats.completed > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-green-600">{stats.completed}</span>
                  <span className="text-green-500"> completed</span>
                </div>
              )}
              {stats.error > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-red-600">{stats.error}</span>
                  <span className="text-red-500"> failed</span>
                </div>
              )}
            </div>
            <Button
              onClick={clearAll}
              variant="outline"
              size="sm"
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : files.length >= config.maxFiles
            ? "border-gray-200 bg-gray-100 opacity-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {files.length >= config.maxFiles 
            ? `Maximum ${config.maxFiles} files reached`
            : "Drop your files here"
          }
        </h3>
        <p className="text-gray-600 mb-6">
          {files.length >= config.maxFiles
            ? "Remove some files to upload more"
            : "Or click to browse and select files from your computer"
          }
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.pptx,.ppt"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={files.length >= config.maxFiles}
        />
        <label htmlFor="file-upload">
          <Button
            variant="primary"
            size="lg"
            className="cursor-pointer"
            disabled={files.length >= config.maxFiles}
            type="button"
          >
            Choose Files
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-4">
          Max {formatFileSize(config.maxSize)} per file • {config.maxFiles} files maximum
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Files ({stats.total})
            </h3>
            <div className="flex items-center space-x-3">
              {stats.pending > 0 && (
                <Button 
                  onClick={uploadAll} 
                  size="sm"
                  loading={isUploading}
                  disabled={isUploading}
                >
                  Upload All ({stats.pending})
                </Button>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <FileItem 
                key={file.id} 
                file={file} 
                onRemove={memoizedRemoveFile}
                onRetry={memoizedRetryUpload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

const FileItem = React.memo(function FileItem({ file, onRemove, onRetry }: FileItemProps) {
  const isProcessing = file.status === "uploading" || file.status === "processing";
  
  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {file.file.name}
            </h4>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {getFileTypeLabel(file.file.type)}
            </span>
          </div>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span>{formatFileSize(file.file.size)}</span>
            {file.analysis?.documentType && (
              <span>• {file.analysis.documentType}</span>
            )}
            {file.analysis?.confidence && (
              <span>• {Math.round(file.analysis.confidence * 100)}% confidence</span>
            )}
            {file.analysis?.processingTime && (
              <span>• {file.analysis.processingTime.toFixed(1)}s analysis</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <StatusBadge status={file.status} />
          {file.status === "error" && (
            <Button
              onClick={() => onRetry(file.id)}
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          )}
          <button
            onClick={() => onRemove(file.id)}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled={isProcessing}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                file.status === "uploading" ? "bg-blue-500" : "bg-yellow-500"
              }`}
              style={{ 
                width: file.status === "processing" ? "100%" : `${file.progress}%` 
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            {file.status === "uploading" && (
              <>Uploading... {file.progress}%</>
            )}
            {file.status === "processing" && (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Analyzing with AI...
              </>
            )}
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {file.status === "completed" && file.analysis && (
        <div className="mt-4 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-green-900 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analysis Complete
            </h5>
            <div className="flex items-center space-x-2">
              {file.analysis.confidence && (
                <span className="text-xs text-green-600">
                  {Math.round(file.analysis.confidence * 100)}% confidence
                </span>
              )}
              <span className="text-sm font-semibold text-green-700">
                Score: {file.analysis.score}%
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Key Topics */}
            {file.analysis.keyTopics && file.analysis.keyTopics.length > 0 && (
              <div>
                <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                  Key Topics Identified
                </h6>
                <div className="flex flex-wrap gap-1">
                  {file.analysis.keyTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ACS Codes */}
            <div>
              <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                Matched ACS Codes ({file.analysis.acsMatches.length})
              </h6>
              <div className="flex flex-wrap gap-1">
                {file.analysis.acsMatches.map((code) => (
                  <a
                    key={code}
                    href={`/acs/${code}`}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                  >
                    {code}
                  </a>
                ))}
              </div>
            </div>

            {/* Compliance */}
            {file.analysis.compliance && (
              <div>
                <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                  Compliance Assessment
                </h6>
                <div className="bg-gray-50 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Training Standards Compliance
                    </span>
                    <span className={`text-sm font-semibold capitalize ${getComplianceColor(file.analysis.compliance.level)}`}>
                      {file.analysis.compliance.level.replace('_', ' ')}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {file.analysis.compliance.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Suggestions */}
            <div>
              <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                Improvement Suggestions ({file.analysis.suggestions.length})
              </h6>
              <ul className="space-y-1">
                {file.analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <svg className="w-3 h-3 mt-1.5 mr-2 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {file.status === "error" && (
        <div className="mt-4 bg-red-50 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-red-900 mb-1">
                Upload Failed
              </h5>
              <p className="text-sm text-red-700">
                {file.error || "An error occurred during upload"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function getComplianceColor(level: string): string {
  return AnalysisService.getComplianceColor(level as any);
}

function StatusBadge({ status }: { status: UploadedFile["status"] }) {
  const configs = {
    pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
    uploading: { label: "Uploading", className: "bg-blue-100 text-blue-800" },
    processing: { label: "Processing", className: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Complete", className: "bg-green-100 text-green-800" },
    error: { label: "Error", className: "bg-red-100 text-red-800" },
  };

  const config = configs[status];

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}