/**
 * API Validation Testing
 * Tests request validation, schema validation, and security checks
 */

import { NextRequest } from "next/server";
import { validateRequest } from "@/lib/api/validation";

// Mock security file upload
jest.mock("@/lib/security/fileUpload", () => ({
  FileUploadSecurity: {
    validateFile: jest.fn().mockResolvedValue({
      isSecure: true,
      warnings: [],
    }),
    getUserUploadLimits: jest.fn().mockReturnValue({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFilesPerHour: 20,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    }),
  },
}));

// Mock validation schemas
jest.mock("@/lib/validation/schemas", () => ({
  uploadSchema: {
    parse: jest.fn((data) => {
      if (!data.file) throw new Error('File is required');
      return data;
    }),
  },
  authSchema: {
    parse: jest.fn((data) => {
      if (!data.email || !data.password) {
        throw new Error('Email and password are required');
      }
      return data;
    }),
  },
}));

describe("API Validation", () => {
  let mockFileUploadSecurity: any;
  let mockUploadSchema: any;
  let mockAuthSchema: any;

  beforeEach(() => {
    const { FileUploadSecurity } = require("@/lib/security/fileUpload");
    const { uploadSchema, authSchema } = require("@/lib/validation/schemas");
    
    mockFileUploadSecurity = FileUploadSecurity;
    mockUploadSchema = uploadSchema;
    mockAuthSchema = authSchema;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("Request Validation", () => {
    it("should validate valid file upload requests", async () => {
      // Arrange
      const mockFile = new File(["test content"], "test.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", mockFile);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      mockUploadSchema.parse.mockReturnValue({ file: mockFile });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ file: mockFile });
      expect(mockUploadSchema.parse).toHaveBeenCalledWith({ file: mockFile });
      expect(mockFileUploadSecurity.validateFile).toHaveBeenCalledWith(mockFile);
    });

    it("should reject requests with invalid schema", async () => {
      // Arrange
      const formData = new FormData();
      // No file attached

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      mockUploadSchema.parse.mockImplementation(() => {
        throw new Error("File is required");
      });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File is required");
    });

    it("should reject insecure files", async () => {
      // Arrange
      const mockFile = new File(["malicious content"], "malware.exe", {
        type: "application/octet-stream",
      });
      const formData = new FormData();
      formData.append("file", mockFile);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      mockUploadSchema.parse.mockReturnValue({ file: mockFile });
      mockFileUploadSecurity.validateFile.mockResolvedValue({
        isSecure: false,
        error: "Potentially malicious file detected",
        warnings: ["Executable file type not allowed"],
      });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Potentially malicious file detected");
    });

    it("should validate JSON request bodies", async () => {
      // Arrange
      const authData = {
        email: "test@example.com",
        password: "password123",
      };

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(authData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      mockAuthSchema.parse.mockReturnValue(authData);

      // Act
      const result = await validateRequest(request, 'auth');

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(authData);
      expect(mockAuthSchema.parse).toHaveBeenCalledWith(authData);
    });

    it("should handle malformed JSON", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: "invalid json{",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const result = await validateRequest(request, 'auth');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid JSON");
    });
  });

  describe("File Security Validation", () => {
    it("should validate file types correctly", async () => {
      // Arrange
      const validFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFileUploadSecurity.validateFile.mockResolvedValue({
        isSecure: true,
        warnings: [],
      });

      const formData = new FormData();
      formData.append("file", validFile);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(true);
      expect(mockFileUploadSecurity.validateFile).toHaveBeenCalledWith(validFile);
    });

    it("should reject files exceeding size limits", async () => {
      // Arrange
      const largeFile = new File(
        ["x".repeat(20 * 1024 * 1024)], // 20MB
        "large.pdf",
        { type: "application/pdf" }
      );

      mockFileUploadSecurity.validateFile.mockResolvedValue({
        isSecure: false,
        error: "File size exceeds maximum allowed size of 10MB",
        warnings: [],
      });

      const formData = new FormData();
      formData.append("file", largeFile);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      mockUploadSchema.parse.mockReturnValue({ file: largeFile });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File size exceeds maximum");
    });

    it("should handle security validation warnings", async () => {
      // Arrange
      const suspiciousFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFileUploadSecurity.validateFile.mockResolvedValue({
        isSecure: true,
        warnings: ["File contains embedded JavaScript"],
      });

      const formData = new FormData();
      formData.append("file", suspiciousFile);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      mockUploadSchema.parse.mockReturnValue({ file: suspiciousFile });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("File contains embedded JavaScript");
    });
  });

  describe("Content Type Validation", () => {
    it("should validate correct content types", async () => {
      // Test JSON content type
      const jsonRequest = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonResult = await validateRequest(jsonRequest, 'default');
      expect(jsonResult.contentType).toBe("application/json");

      // Test form data content type
      const formData = new FormData();
      formData.append("test", "value");

      const formRequest = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: formData,
      });

      const formResult = await validateRequest(formRequest, 'upload');
      expect(formResult.contentType).toContain("multipart/form-data");
    });

    it("should reject unsupported content types", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: "<xml>test</xml>",
        headers: {
          "Content-Type": "application/xml",
        },
      });

      // Act
      const result = await validateRequest(request, 'auth');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Unsupported content type");
    });
  });

  describe("Request Size Limits", () => {
    it("should enforce request size limits", async () => {
      // Arrange - simulate large request body
      const largeData = "x".repeat(50 * 1024 * 1024); // 50MB
      
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: largeData,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": (50 * 1024 * 1024).toString(),
        },
      });

      // Act
      const result = await validateRequest(request, 'auth');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Request body too large");
    });
  });

  describe("Error Handling", () => {
    it("should handle security validation errors gracefully", async () => {
      // Arrange
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      mockFileUploadSecurity.validateFile.mockRejectedValue(
        new Error("Security service unavailable")
      );

      const formData = new FormData();
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      mockUploadSchema.parse.mockReturnValue({ file });

      // Act
      const result = await validateRequest(request, 'upload');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Validation service temporarily unavailable");
    });

    it("should handle schema parsing errors", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      });

      mockAuthSchema.parse.mockImplementation(() => {
        const error = new Error("Validation failed");
        error.name = "ZodError";
        throw error;
      });

      // Act
      const result = await validateRequest(request, 'auth');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Validation failed");
    });
  });
});