export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
}

export const DEFAULT_UPLOAD_CONFIG: FileUploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ],
  maxFiles: 5,
};

export function validateFile(file: File, config: FileUploadConfig = DEFAULT_UPLOAD_CONFIG): FileValidationResult {
  // Check file size
  if (file.size > config.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${formatFileSize(config.maxSize)} limit`,
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported`,
    };
  }

  // Check file name for security
  if (hasUnsafeFileName(file.name)) {
    return {
      isValid: false,
      error: "File name contains unsafe characters",
    };
  }

  return { isValid: true };
}

export async function validateFileSignature(file: File): Promise<FileValidationResult> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check file signatures based on MIME type
    switch (file.type) {
      case "application/pdf":
        // PDF signature: %PDF (0x25 0x50 0x44 0x46)
        if (bytes.length >= 4 && 
            bytes[0] === 0x25 && bytes[1] === 0x50 && 
            bytes[2] === 0x44 && bytes[3] === 0x46) {
          return { isValid: true };
        }
        return { isValid: false, error: "File is not a valid PDF document" };

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        // Office documents (ZIP signature): PK (0x50 0x4B)
        if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4B) {
          return { isValid: true };
        }
        return { isValid: false, error: "File is not a valid Office document" };

      case "application/msword":
        // MS Word 97-2003 signature: D0CF11E0A1B11AE1
        if (bytes.length >= 8 &&
            bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
            bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1) {
          return { isValid: true };
        }
        return { isValid: false, error: "File is not a valid Word document" };

      case "application/vnd.ms-powerpoint":
        // MS PowerPoint 97-2003 signature: D0CF11E0A1B11AE1 (same as Word)
        if (bytes.length >= 8 &&
            bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
            bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1) {
          return { isValid: true };
        }
        return { isValid: false, error: "File is not a valid PowerPoint document" };

      case "text/plain":
        // Text files - check for common text encodings and no binary content
        const textDecoder = new TextDecoder('utf-8', { fatal: true });
        try {
          textDecoder.decode(bytes);
          return { isValid: true };
        } catch {
          return { isValid: false, error: "File appears to contain binary data, not plain text" };
        }

      default:
        // Unknown file type - allow but log warning
        console.warn(`Unknown file type for signature validation: ${file.type}`);
        return { isValid: true };
    }
  } catch (error) {
    return { 
      isValid: false, 
      error: `Unable to validate file signature: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export function validateFileList(files: FileList | File[], config: FileUploadConfig = DEFAULT_UPLOAD_CONFIG): {
  validFiles: File[];
  invalidFiles: { file: File; error: string }[];
} {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];

  // Check total file count
  if (fileArray.length > config.maxFiles) {
    return {
      validFiles: [],
      invalidFiles: fileArray.map(file => ({
        file,
        error: `Maximum ${config.maxFiles} files allowed`,
      })),
    };
  }

  // Validate each file
  for (const file of fileArray) {
    const result = validateFile(file, config);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, error: result.error! });
    }
  }

  return { validFiles, invalidFiles };
}

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) {return "0 Bytes";}
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || "";
}

export function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF Document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
    "application/msword": "Word Document",
    "text/plain": "Text File",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation",
    "application/vnd.ms-powerpoint": "PowerPoint Presentation",
  };
  
  return typeMap[mimeType] || "Unknown File Type";
}

function hasUnsafeFileName(filename: string): boolean {
  // Check for unsafe characters and patterns
  const unsafePatterns = [
    /[<>:"|?*]/,     // Windows unsafe characters
    /^\.\.?$/,       // Relative path traversal
    /\.\./,          // Path traversal
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
  ];
  
  return unsafePatterns.some(pattern => pattern.test(filename));
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[<>:"|?*]/g, "_")  // Replace unsafe characters
    .replace(/\.\./g, "_")       // Replace path traversal
    .replace(/^\.+/, "")         // Remove leading dots
    .trim();
}