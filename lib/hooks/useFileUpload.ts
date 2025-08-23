"use client";

import { useState, useCallback } from "react";
import { validateFileList, validateFileSignature, DEFAULT_UPLOAD_CONFIG, type FileUploadConfig } from "@/lib/utils/fileValidation";
import { AnalysisService, type DocumentAnalysis } from "@/lib/services/analysisService";

export interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  analysis?: DocumentAnalysis;
  error?: string;
}

export interface UseFileUploadOptions {
  config?: Partial<FileUploadConfig>;
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (file: UploadedFile, error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const config = { ...DEFAULT_UPLOAD_CONFIG, ...options.config };

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const { validFiles, invalidFiles: basicInvalidFiles } = validateFileList(newFiles, config);

    // Perform signature validation on basic valid files
    const signatureValidationResults = await Promise.all(
      validFiles.map(async (file) => {
        const signatureResult = await validateFileSignature(file);
        return { file, signatureResult };
      })
    );

    // Separate files that pass signature validation
    const finalValidFiles: File[] = [];
    const signatureInvalidFiles: { file: File; error: string }[] = [];

    signatureValidationResults.forEach(({ file, signatureResult }) => {
      if (signatureResult.isValid) {
        finalValidFiles.push(file);
      } else {
        signatureInvalidFiles.push({ file, error: signatureResult.error || "Invalid file signature" });
      }
    });

    // Combine all invalid files
    const allInvalidFiles = [...basicInvalidFiles, ...signatureInvalidFiles];

    // Add valid files
    const uploadedFiles: UploadedFile[] = finalValidFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
      progress: 0,
    }));

    setFiles(prev => {
      const totalFiles = prev.length + uploadedFiles.length;
      if (totalFiles > config.maxFiles) {
        return prev; // Don't add if it would exceed limit
      }
      return [...prev, ...uploadedFiles];
    });

    return { validFiles: finalValidFiles, invalidFiles: allInvalidFiles };
  }, [config]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);


  const simulateUpload = useCallback(async (fileId: string) => {
    // Find the file first
    const currentFiles = files;
    const fileToUpload = currentFiles.find(f => f.id === fileId);
    
    if (!fileToUpload || fileToUpload.status !== "pending") {
      return; // Exit if file not found or not pending
    }

    // Start upload - atomic update to uploading status
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: "uploading" as const, progress: 0 } : f
    ));

    const file = fileToUpload.file;

    try {
      // Simulate upload progress
      for (let progress = 10; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }

      // Update to processing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "processing" as const, progress: 100 } : f
      ));

      // Use the analysis service for realistic results
      const analysis = await AnalysisService.analyzeDocument({
        fileId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: "completed" as const,
          analysis 
        } : f
      ));

      options.onUploadComplete?.(fileToUpload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: "error" as const, 
          error: errorMessage 
        } : f
      ));
      if (fileToUpload) {
        options.onUploadError?.(fileToUpload, errorMessage);
      }
    }
  }, [options]);

  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Upload files in batches to prevent overwhelming the server
      const batchSize = 2; // Max 2 concurrent uploads
      
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        const batch = pendingFiles.slice(i, i + batchSize);
        await Promise.all(
          batch.map(file => simulateUpload(file.id))
        );
      }
    } finally {
      setIsUploading(false);
    }
  }, [files, simulateUpload]);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const retryUpload = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const { error, ...fileWithoutError } = f;
        return { ...fileWithoutError, status: "pending" as const, progress: 0 };
      }
      return f;
    }));
    simulateUpload(fileId);
  }, [simulateUpload]);

  // Statistics
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === "pending").length,
    uploading: files.filter(f => f.status === "uploading").length,
    processing: files.filter(f => f.status === "processing").length,
    completed: files.filter(f => f.status === "completed").length,
    error: files.filter(f => f.status === "error").length,
  };

  return {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    retryUpload,
    config,
  };
}

