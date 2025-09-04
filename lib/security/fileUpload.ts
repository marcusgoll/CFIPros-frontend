import { z } from "zod";

// Zod schema for file validation
export const FileUploadSchema = z
  .object({
    name: z.string().min(1, "Filename is required"),
    size: z.number().min(1, "File size must be greater than 0"),
    type: z.enum(["application/pdf", "image/jpeg", "image/png"], {
      errorMap: () => ({ message: "Only PDF, JPEG, and PNG files are allowed" }),
    }),
  })
  .refine((file) => file.size <= 15 * 1024 * 1024, {
    message: "File size must be 15MB or smaller",
    path: ["size"],
  });

export type FileValidationResult = {
  isSecure: boolean;
  error?: string;
  warnings?: string[];
};

/**
 * File Upload Security Validator
 * Implements multiple layers of security validation
 */
export class FileUploadSecurity {
  // Magic bytes for common file types to verify actual file content
  // @ts-expect-error - Unused but kept for future file type validation
  private static readonly MAGIC_BYTES: Record<string, Uint8Array[]> = {
    "application/pdf": [
      new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
    ],
    "image/jpeg": [
      new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
      new Uint8Array([0xff, 0xd8, 0xff, 0xe1]),
      new Uint8Array([0xff, 0xd8, 0xff, 0xee]),
    ],
    "image/png": [
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    ],
  };

  // File size limits (in bytes)
  private static readonly MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  private static readonly MIN_FILE_SIZE = 100; // 100 bytes

  // Security patterns to detect in file content
  private static readonly SECURITY_PATTERNS = [
    // JavaScript execution patterns
    /\/JS|\/JavaScript|\/Action|\/OpenAction/gi,
    // Form submission patterns
    /\/SubmitForm|\/ImportData|\/Launch/gi,
    // External resource patterns
    /\/URI|\/URL|\/GoTo/gi,
  ];

  /**
   * Main validation entry point
   */
  static async validateFile(file: File): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isSecure: false,
      warnings: [],
    };

    try {
      // 1. Basic metadata validation
      const metadataValidation = this.validateMetadata(file);
      if (!metadataValidation.isSecure) {
        return metadataValidation;
      }

      // 2. File signature validation (magic bytes)
      const signatureValidation = await this.verifyMagicBytes(file);
      if (!signatureValidation.isSecure) {
        return signatureValidation;
      }

      // 3. Content scanning for security threats
      const contentValidation = await this.scanFileContent(file);
      if (!contentValidation.isSecure) {
        return contentValidation;
      }

      // 4. Advanced PDF security checks
      if (file.type === "application/pdf") {
        const pdfValidation = await this.validatePDFSecurity(file);
        if (!pdfValidation.isSecure) {
          return pdfValidation;
        }
        // Merge warnings
        if (pdfValidation.warnings) {
          result.warnings = [...(result.warnings || []), ...pdfValidation.warnings];
        }
      }

      result.isSecure = true;
      return result;
    } catch (err) {
      return {
        isSecure: false,
        error: `File validation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Validate file metadata (name, size, type)
   */
  private static validateMetadata(file: File): FileValidationResult {
    try {
      FileUploadSchema.parse(file);
      return { isSecure: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => issue.message).join(", ");
        return {
          isSecure: false,
          error: issues,
        };
      }
      return {
        isSecure: false,
        error: "Invalid file metadata",
      };
    }
  }

  /**
   * Verify file magic bytes match declared MIME type
   */
  private static async verifyMagicBytes(file: File): Promise<FileValidationResult> {
    try {
      const buffer = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Convert first few bytes to string for basic validation
      const headerText = Array.from(bytes.slice(0, 4)).join(",");
      
      switch (file.type) {
        case "application/pdf":
          // Check for PDF signature: %PDF
          if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            return { isSecure: true };
          }
          break;
          
        case "image/jpeg":
          // Check for JPEG signature: FF D8 FF
          if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
            return { isSecure: true };
          }
          break;
          
        case "image/png":
          // Check for PNG signature: 89 50 4E 47
          if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
            return { isSecure: true };
          }
          break;
          
        default:
          return {
            isSecure: false,
            error: `Unsupported file type: ${file.type}`,
          };
      }
      
      // If we get here, magic bytes don't match
      try {
        // eslint-disable-next-line no-console
        console.error("[FileUploadSecurity] PDF header mismatch:", JSON.stringify(headerText));
      } catch {}
      return {
        isSecure: false,
        error: "File signature does not match declared type (possible file type spoofing)",
      };
    } catch (err) {
      return {
        isSecure: false,
        error: `Unable to verify file signature: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Helper: Read file as text
   */
  private static async readFileAsText(file: File, bytes: number): Promise<string> {
    const buffer = await file.slice(0, bytes).arrayBuffer();
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  }

  /**
   * Scan file content for security threats
   */
  private static async scanFileContent(file: File): Promise<FileValidationResult> {
    try {
      // For performance, only scan first 64KB of file
      const scanSize = Math.min(file.size, 64 * 1024);
      const buffer = await file.slice(0, scanSize).arrayBuffer();
      const content = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

      // Scan for security patterns
      for (const pattern of this.SECURITY_PATTERNS) {
        if (pattern.test(content)) {
          return {
            isSecure: false,
            error: "File contains potentially dangerous content",
          };
        }
      }

      return { isSecure: true };
    } catch {
      // If we can't decode the content, it's likely a binary file - that's OK
      return { isSecure: true };
    }
  }

  /**
   * Advanced PDF security validation
   */
  private static async validatePDFSecurity(file: File): Promise<FileValidationResult> {
    try {
      // Read more of the PDF for analysis
      const scanSize = Math.min(file.size, 256 * 1024); // 256KB
      const buffer = await file.slice(0, scanSize).arrayBuffer();
      const content = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

      const warnings: string[] = [];

      // Check for JavaScript in PDF
      if (/\/JS\s*[\[<(]|\/JavaScript\s*[\[<(]/gi.test(content)) {
        return {
          isSecure: false,
          error: "PDF contains potentially dangerous JavaScript",
        };
      }

      // Check for embedded actions
      if (/\/Action\s*[\[<(]|\/OpenAction\s*[\[<(]/gi.test(content)) {
        warnings.push("PDF contains actions (may auto-execute)");
      }

      // Check for forms
      if (/\/AcroForm\s*[\[<(]|\/XFA\s*[\[<(]/gi.test(content)) {
        warnings.push("PDF contains forms");
      }

      // Check for external references
      if (/\/URI\s*[\[<(]|\/URL\s*[\[<(]/gi.test(content)) {
        warnings.push("PDF contains external references");
      }

      // Check for embedded files
      if (/\/EmbeddedFile\s*[\[<(]/gi.test(content)) {
        warnings.push("PDF contains embedded files");
      }

      return {
        isSecure: true,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (err) {
      return {
        isSecure: false,
        error: `PDF security validation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Validate file array (for batch uploads)
   */
  static async validateFiles(files: File[]): Promise<{
    isValid: boolean;
    results: FileValidationResult[];
    error?: string;
  }> {
    if (files.length === 0) {
      return {
        isValid: false,
        results: [],
        error: "At least one file is required",
      };
    }

    if (files.length > 5) {
      return {
        isValid: false,
        results: [],
        error: "Maximum 5 files allowed",
      };
    }

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total

    if (totalSize > maxTotalSize) {
      return {
        isValid: false,
        results: [],
        error: "Total file size cannot exceed 50MB",
      };
    }

    // Validate each file
    const results = await Promise.all(
      files.map((file) => this.validateFile(file))
    );

    // Check if any files failed validation
    const hasFailures = results.some((result) => !result.isSecure);

    return {
      isValid: !hasFailures,
      results,
      error: hasFailures
        ? "One or more files failed security validation"
        : undefined,
    };
  }

  /**
   * Validate single file for upload
   */
  static async validateSingleFile(file: File): Promise<{
    isValid: boolean;
    result: FileValidationResult;
  }> {
    const result = await this.validateFile(file);
    return {
      isValid: result.isSecure,
      result,
    };
  }

  /**
   * Get file type from extension (fallback)
   */
  private static getMimeTypeFromExtension(filename: string): string | null {
    const ext = this.getFileExtension(filename);
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };
    return mimeMap[ext] || null;
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : "";
  }

  /**
   * Helper: Read file bytes
   */
  // @ts-expect-error - Unused but kept for future security features
  private static async readFileBytes(
    file: File,
    bytes: number
  ): Promise<ArrayBuffer> {
    // Prefer reading the full file via File.arrayBuffer to avoid slice brand issues
    // Normalize to Blob to avoid cross-realm brand issues
    const normalized = new Blob([file]);
    const slice = normalized.slice(0, bytes);
    return slice.arrayBuffer();
  }

  /**
   * Helper: Convert ArrayBuffer to Uint8Array
   */
  private static bufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
    return new Uint8Array(buffer);
  }


  /**
   * Validate file upload with user authentication context
   * Provides enhanced security logging and user-specific limits
   */
  static async validateFileWithAuth(
    file: File,
    userId: string,
    userRole?: string
  ): Promise<FileValidationResult & { metadata?: any }> {
    // Import logging utility
    const { logInfo, logWarn } = await import("@/lib/utils/logger");

    // Perform standard security validation
    const baseValidation = await this.validateFile(file);
    
    if (!baseValidation.isSecure) {
      // Log security violations with user context
      logWarn("File upload security violation", {
        userId,
        userRole,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        error: baseValidation.error,
      });
      
      return baseValidation;
    }

    // Generate basic file metadata  
    const metadata = {
      sanitizedName: this.createSafeFilename(file.name),
      hash: await this.generateFileHash(file),
      uploadId: this.generateUploadId(),
    };
    
    // Log successful validation
    logInfo("File upload validated", {
      userId,
      userRole,
      filename: metadata.sanitizedName,
      fileType: file.type,
      fileSize: file.size,
      hash: metadata.hash,
    });

    // Apply role-based size restrictions if needed
    if (userRole === 'student' && file.size > 5 * 1024 * 1024) { // 5MB for students
      return {
        isSecure: false,
        error: "File size exceeds limit for student accounts (5MB maximum)",
      };
    }

    return {
      ...baseValidation,
      metadata,
    };
  }

  /**
   * Get user-specific upload limits based on role
   */
  static getUserUploadLimits(userRole?: string): {
    maxFileSize: number;
    maxFilesPerHour: number;
    allowedTypes: string[];
  } {
    const limits = {
      student: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFilesPerHour: 5,
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      },
      cfi: {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        maxFilesPerHour: 20,
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      },
      school_admin: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFilesPerHour: 50,
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      },
      default: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFilesPerHour: 10,
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      },
    };

    return limits[userRole as keyof typeof limits] || limits.default;
  }

  /**
   * Helper: Check if file contains suspicious patterns
   */
  private static containsSuspiciousContent(content: string): boolean {
    // Check for script tags
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
      return true;
    }

    // Check for data URLs
    if (/data:\s*[^;]+;base64/gi.test(content)) {
      return true;
    }

    // Check for embedded executables
    if (/\.(exe|scr|bat|cmd|com|pif)/gi.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * Create safe filename
   */
  static createSafeFilename(originalName: string): string {
    // Remove any potentially dangerous characters
    const safeName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "");

    // Ensure it has an extension
    if (!safeName.includes(".")) {
      return `${safeName}.unknown`;
    }

    return safeName;
  }

  /**
   * Generate unique upload ID
   */
  static generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate file hash for deduplication and integrity
   */
  private static async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}