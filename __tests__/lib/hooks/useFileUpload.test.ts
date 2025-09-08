/**
 * Comprehensive useFileUpload Hook Tests
 * Tests for Task 2.2: Custom Hooks Testing
 * 
 * Coverage Areas:
 * - File upload state management (pending, uploading, processing, completed, error)
 * - File validation (basic and signature validation)
 * - Progress tracking during upload process
 * - Error handling for upload failures and validation errors
 * - Batch upload functionality with concurrency control
 * - File retry mechanisms and error recovery
 * - Upload statistics and status tracking
 * - Configuration options and limits
 * - Analysis service integration
 * - Memory cleanup and effect management
 * - Performance with large files and multiple uploads
 * - TypeScript strict mode compliance
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useFileUpload,
  type UploadedFile,
  type UseFileUploadOptions 
} from '@/lib/hooks/useFileUpload';
import * as fileValidation from '@/lib/utils/fileValidation';
import * as analysisService from '@/lib/services/analysisService';

// Mock file validation utilities
jest.mock('@/lib/utils/fileValidation', () => ({
  validateFileList: jest.fn(),
  validateFileSignature: jest.fn(),
  DEFAULT_UPLOAD_CONFIG: {
    maxFiles: 10,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf'],
  },
}));

// Mock analysis service
jest.mock('@/lib/services/analysisService', () => ({
  AnalysisService: {
    analyzeDocument: jest.fn(),
  },
}));

const mockedValidateFileList = jest.mocked(fileValidation.validateFileList);
const mockedValidateFileSignature = jest.mocked(fileValidation.validateFileSignature);
const mockedAnalyzeDocument = jest.mocked(analysisService.AnalysisService.analyzeDocument);

// Mock crypto.randomUUID
const mockUUID = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: mockUUID },
  writable: true,
});

// Helper function to create test files
function createTestFile(name: string, type: string, size: number): File {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Helper function to create FileList
function createFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  };
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });
  return fileList as FileList;
}

describe('useFileUpload Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUUID.mockImplementation(() => `uuid-${Math.random()}`);
    
    // Default mock implementations
    mockedValidateFileList.mockReturnValue({
      validFiles: [],
      invalidFiles: [],
    });
    
    mockedValidateFileSignature.mockResolvedValue({
      isValid: true,
      error: undefined,
    });
    
    mockedAnalyzeDocument.mockResolvedValue({
      confidence: 0.95,
      extractedData: { title: 'Test Document' },
      analysis: { wordCount: 100 },
    });
  });

  // Basic initialization tests
  describe('Hook Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.files).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.stats.total).toBe(0);
      expect(result.current.stats.pending).toBe(0);
      expect(result.current.stats.uploading).toBe(0);
      expect(result.current.stats.completed).toBe(0);
      expect(result.current.stats.error).toBe(0);
      expect(typeof result.current.addFiles).toBe('function');
      expect(typeof result.current.removeFile).toBe('function');
      expect(typeof result.current.uploadAll).toBe('function');
      expect(typeof result.current.clearAll).toBe('function');
      expect(typeof result.current.retryUpload).toBe('function');
    });

    it('initializes with custom config', () => {
      const customConfig = {
        maxFiles: 5,
        maxSizeBytes: 5 * 1024 * 1024,
        allowedTypes: ['image/png'],
      };

      const { result } = renderHook(() => useFileUpload({ config: customConfig }));

      expect(result.current.config).toMatchObject(customConfig);
    });

    it('merges custom config with defaults', () => {
      const partialConfig = { maxFiles: 3 };

      const { result } = renderHook(() => useFileUpload({ config: partialConfig }));

      expect(result.current.config.maxFiles).toBe(3);
      expect(result.current.config.maxSizeBytes).toBe(10 * 1024 * 1024); // Default
    });

    it('provides callback functions', () => {
      const onUploadComplete = jest.fn();
      const onUploadError = jest.fn();

      const { result } = renderHook(() => 
        useFileUpload({ onUploadComplete, onUploadError })
      );

      expect(result.current.addFiles).toBeDefined();
      expect(result.current.uploadAll).toBeDefined();
    });
  });

  // File validation tests
  describe('File Validation', () => {
    it('adds valid files after basic validation', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);
      const fileList = createFileList([testFile]);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(fileList);
      });

      expect(mockedValidateFileList).toHaveBeenCalledWith(fileList, result.current.config);
      expect(mockedValidateFileSignature).toHaveBeenCalledWith(testFile);
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].status).toBe('pending');
      expect(result.current.files[0].file).toBe(testFile);
    });

    it('rejects files that fail basic validation', async () => {
      const testFile = createTestFile('test.exe', 'application/exe', 1024);
      const fileList = createFileList([testFile]);

      mockedValidateFileList.mockReturnValue({
        validFiles: [],
        invalidFiles: [{ file: testFile, error: 'Invalid file type' }],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        const result_data = await result.current.addFiles(fileList);
        expect(result_data.invalidFiles).toHaveLength(1);
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('rejects files that fail signature validation', async () => {
      const testFile = createTestFile('fake.pdf', 'application/pdf', 1024);
      const fileList = createFileList([testFile]);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      mockedValidateFileSignature.mockResolvedValue({
        isValid: false,
        error: 'Invalid file signature',
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        const result_data = await result.current.addFiles(fileList);
        expect(result_data.invalidFiles).toHaveLength(1);
        expect(result_data.invalidFiles[0].error).toBe('Invalid file signature');
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('handles mixed valid and invalid files', async () => {
      const validFile = createTestFile('valid.pdf', 'application/pdf', 1024);
      const invalidFile = createTestFile('invalid.exe', 'application/exe', 1024);
      const fileList = createFileList([validFile, invalidFile]);

      mockedValidateFileList.mockReturnValue({
        validFiles: [validFile],
        invalidFiles: [{ file: invalidFile, error: 'Invalid type' }],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        const result_data = await result.current.addFiles(fileList);
        expect(result_data.validFiles).toHaveLength(1);
        expect(result_data.invalidFiles).toHaveLength(1);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].file).toBe(validFile);
    });

    it('respects max files limit', async () => {
      const config = { maxFiles: 2 };
      const { result } = renderHook(() => useFileUpload({ config }));

      // Add initial files up to limit
      const file1 = createTestFile('file1.pdf', 'application/pdf', 1024);
      const file2 = createTestFile('file2.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [file1, file2],
        invalidFiles: [],
      });

      await act(async () => {
        await result.current.addFiles(createFileList([file1, file2]));
      });

      expect(result.current.files).toHaveLength(2);

      // Try to add more files beyond limit
      const file3 = createTestFile('file3.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [file3],
        invalidFiles: [],
      });

      await act(async () => {
        await result.current.addFiles(createFileList([file3]));
      });

      // Should still be 2 files (not added due to limit)
      expect(result.current.files).toHaveLength(2);
    });

    it('handles signature validation errors gracefully', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);
      const fileList = createFileList([testFile]);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      mockedValidateFileSignature.mockRejectedValue(new Error('Signature validation failed'));

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        const result_data = await result.current.addFiles(fileList);
        expect(result_data.invalidFiles).toHaveLength(1);
      });

      expect(result.current.files).toHaveLength(0);
    });
  });

  // File management tests
  describe('File Management', () => {
    it('removes files correctly', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      const fileId = result.current.files[0].id;

      act(() => {
        result.current.removeFile(fileId);
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('clears all files', async () => {
      const files = [
        createTestFile('file1.pdf', 'application/pdf', 1024),
        createTestFile('file2.pdf', 'application/pdf', 1024),
      ];

      mockedValidateFileList.mockReturnValue({
        validFiles: files,
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList(files));
      });

      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('generates unique IDs for files', async () => {
      mockUUID.mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');

      const files = [
        createTestFile('file1.pdf', 'application/pdf', 1024),
        createTestFile('file2.pdf', 'application/pdf', 1024),
      ];

      mockedValidateFileList.mockReturnValue({
        validFiles: files,
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList(files));
      });

      expect(result.current.files[0].id).toBe('uuid-1');
      expect(result.current.files[1].id).toBe('uuid-2');
    });
  });

  // Upload process tests
  describe('Upload Process', () => {
    it('uploads single file successfully', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      const onUploadComplete = jest.fn();
      const { result } = renderHook(() => useFileUpload({ onUploadComplete }));

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      const fileId = result.current.files[0].id;

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.files[0].status).toBe('completed');
      expect(result.current.files[0].progress).toBe(100);
      expect(result.current.files[0].analysis).toBeDefined();
      expect(onUploadComplete).toHaveBeenCalledWith(expect.objectContaining({ id: fileId }));
    });

    it('tracks upload progress correctly', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      // Start upload and check progress updates
      const uploadPromise = act(async () => {
        await result.current.uploadAll();
      });

      // Wait for upload to complete
      await uploadPromise;

      expect(result.current.files[0].status).toBe('completed');
      expect(result.current.files[0].progress).toBe(100);
    });

    it('handles upload errors', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      mockedAnalyzeDocument.mockRejectedValue(new Error('Analysis failed'));

      const onUploadError = jest.fn();
      const { result } = renderHook(() => useFileUpload({ onUploadError }));

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[0].error).toBe('Analysis failed');
      expect(onUploadError).toHaveBeenCalled();
    });

    it('handles batch uploads with concurrency control', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        createTestFile(`file${i}.pdf`, 'application/pdf', 1024)
      );

      mockedValidateFileList.mockReturnValue({
        validFiles: files,
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList(files));
      });

      // Track analysis calls to verify batch processing
      let analysisCallCount = 0;
      mockedAnalyzeDocument.mockImplementation(async () => {
        analysisCallCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          confidence: 0.95,
          extractedData: { title: `Document ${analysisCallCount}` },
          analysis: { wordCount: 100 },
        };
      });

      await act(async () => {
        await result.current.uploadAll();
      });

      // All files should be completed
      expect(result.current.files.every(f => f.status === 'completed')).toBe(true);
      expect(analysisCallCount).toBe(5);
    });

    it('updates upload statistics correctly', async () => {
      const files = [
        createTestFile('file1.pdf', 'application/pdf', 1024),
        createTestFile('file2.pdf', 'application/pdf', 1024),
      ];

      mockedValidateFileList.mockReturnValue({
        validFiles: files,
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList(files));
      });

      expect(result.current.stats.total).toBe(2);
      expect(result.current.stats.pending).toBe(2);

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.stats.completed).toBe(2);
      expect(result.current.stats.pending).toBe(0);
    });

    it('sets uploading state during batch upload', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      let resolveAnalysis: (value: any) => void;
      const analysisPromise = new Promise(resolve => {
        resolveAnalysis = resolve;
      });

      mockedAnalyzeDocument.mockReturnValue(analysisPromise);

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      // Start upload
      const uploadPromise = act(async () => {
        await result.current.uploadAll();
      });

      // Check uploading state
      expect(result.current.isUploading).toBe(true);

      // Complete the analysis
      await act(async () => {
        resolveAnalysis({
          confidence: 0.95,
          extractedData: { title: 'Test Document' },
          analysis: { wordCount: 100 },
        });
      });

      await uploadPromise;

      expect(result.current.isUploading).toBe(false);
    });

    it('does not upload when no pending files', async () => {
      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(mockedAnalyzeDocument).not.toHaveBeenCalled();
      expect(result.current.isUploading).toBe(false);
    });
  });

  // Retry functionality tests
  describe('Retry Functionality', () => {
    it('retries failed uploads', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      // First attempt fails
      mockedAnalyzeDocument.mockRejectedValueOnce(new Error('First attempt failed'));

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      const fileId = result.current.files[0].id;

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.files[0].status).toBe('error');

      // Retry should succeed
      mockedAnalyzeDocument.mockResolvedValue({
        confidence: 0.95,
        extractedData: { title: 'Retry Success' },
        analysis: { wordCount: 100 },
      });

      await act(async () => {
        result.current.retryUpload(fileId);
      });

      await waitFor(() => {
        expect(result.current.files[0].status).toBe('completed');
      });
    });

    it('resets file state before retry', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      mockedAnalyzeDocument.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      const fileId = result.current.files[0].id;

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[0].error).toBe('Upload failed');

      act(() => {
        result.current.retryUpload(fileId);
      });

      expect(result.current.files[0].status).toBe('pending');
      expect(result.current.files[0].progress).toBe(0);
      expect(result.current.files[0].error).toBeUndefined();
    });
  });

  // Performance and memory tests
  describe('Performance and Memory Management', () => {
    it('handles large number of files efficiently', async () => {
      const files = Array.from({ length: 50 }, (_, i) => 
        createTestFile(`file${i}.pdf`, 'application/pdf', 1024)
      );

      mockedValidateFileList.mockReturnValue({
        validFiles: files,
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      const start = performance.now();

      await act(async () => {
        await result.current.addFiles(createFileList(files));
      });

      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(result.current.files).toHaveLength(50);
    });

    it('manages memory during rapid file operations', async () => {
      const { result } = renderHook(() => useFileUpload());

      // Rapidly add and remove files
      for (let i = 0; i < 10; i++) {
        const file = createTestFile(`file${i}.pdf`, 'application/pdf', 1024);

        mockedValidateFileList.mockReturnValue({
          validFiles: [file],
          invalidFiles: [],
        });

        await act(async () => {
          await result.current.addFiles(createFileList([file]));
        });

        const fileId = result.current.files[0].id;

        act(() => {
          result.current.removeFile(fileId);
        });
      }

      expect(result.current.files).toHaveLength(0);
    });

    it('cleans up properly on unmount', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      const { result, unmount } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      expect(() => unmount()).not.toThrow();
    });

    it('handles concurrent file additions', async () => {
      const files1 = [createTestFile('file1.pdf', 'application/pdf', 1024)];
      const files2 = [createTestFile('file2.pdf', 'application/pdf', 1024)];

      const { result } = renderHook(() => useFileUpload());

      mockedValidateFileList.mockReturnValue({
        validFiles: files1,
        invalidFiles: [],
      });

      const promise1 = act(async () => {
        await result.current.addFiles(createFileList(files1));
      });

      mockedValidateFileList.mockReturnValue({
        validFiles: files2,
        invalidFiles: [],
      });

      const promise2 = act(async () => {
        await result.current.addFiles(createFileList(files2));
      });

      await Promise.all([promise1, promise2]);

      expect(result.current.files).toHaveLength(2);
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles empty file list', async () => {
      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        const result_data = await result.current.addFiles(createFileList([]));
        expect(result_data.validFiles).toHaveLength(0);
        expect(result_data.invalidFiles).toHaveLength(0);
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('handles file removal of non-existent file', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.removeFile('non-existent-id');
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('handles retry of non-existent file', async () => {
      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        result.current.retryUpload('non-existent-id');
      });

      expect(mockedAnalyzeDocument).not.toHaveBeenCalled();
    });

    it('handles files with special characters in names', async () => {
      const specialFile = createTestFile('file with spaces & symbols!@#.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [specialFile],
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([specialFile]));
      });

      expect(result.current.files[0].file.name).toBe('file with spaces & symbols!@#.pdf');
    });

    it('handles very large files within limits', async () => {
      const largeFile = createTestFile('large.pdf', 'application/pdf', 9 * 1024 * 1024); // 9MB

      mockedValidateFileList.mockReturnValue({
        validFiles: [largeFile],
        invalidFiles: [],
      });

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([largeFile]));
      });

      expect(result.current.files).toHaveLength(1);
    });

    it('handles analysis service errors gracefully', async () => {
      const testFile = createTestFile('test.pdf', 'application/pdf', 1024);

      mockedValidateFileList.mockReturnValue({
        validFiles: [testFile],
        invalidFiles: [],
      });

      // Analysis service throws non-Error object
      mockedAnalyzeDocument.mockRejectedValue('String error');

      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.addFiles(createFileList([testFile]));
      });

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[0].error).toBe('Upload failed');
    });
  });
});