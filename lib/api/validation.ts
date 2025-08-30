/**
 * Request validation utilities for API endpoints
 * Uses Zod for schema validation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { FileUploadSecurity } from '@/lib/security/fileUpload';

// Validation schemas
const AuthLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const AuthRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
  terms_accepted: z.boolean().refine(val => val === true, 'Terms and conditions must be accepted'),
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name too long').optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    notifications: z.boolean().optional(),
    language: z.string().optional(),
  }).optional(),
});

const ResultIdSchema = z.string().regex(
  /^[a-zA-Z0-9_-]{8,64}$/,
  'Invalid result ID format'
);

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  data?: T;
  error?: string;
  file?: File;
}

export class RequestValidator {
  /**
   * Validate file upload request with comprehensive security checks
   */
  static async fileUpload(request: NextRequest): Promise<ValidationResult<FormData>> {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return {
          isValid: false,
          error: 'No file was provided for upload',
        };
      }

      // Basic checks first (size, type, extension)
      if (file.size > config.fileUpload.maxSize) {
        return {
          isValid: false,
          error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size ${config.fileUpload.maxSize / 1024 / 1024}MB`,
        };
      }

      if (!config.fileUpload.allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `Unsupported file type: ${file.type}. Supported types: ${config.fileUpload.allowedTypes.join(', ')}`,
        };
      }

      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!config.fileUpload.allowedExtensions.includes(extension)) {
        return {
          isValid: false,
          error: `Unsupported file extension: ${extension}. Supported extensions: ${config.fileUpload.allowedExtensions.join(', ')}`,
        };
      }

      // Perform comprehensive security validation
      const securityCheck = await FileUploadSecurity.validateFile(file);
      if (!securityCheck.isSecure) {
        return {
          isValid: false,
          error: securityCheck.error || 'File failed security validation',
        };
      }

      // Generate secure metadata
      const metadata = await FileUploadSecurity.generateFileMetadata(file);
      
      // Add metadata to form data for backend processing
      formData.set('fileMetadata', JSON.stringify(metadata));

      // Log security warnings if any (in development)
      if (securityCheck.warnings && config.isDevelopment) {
        console.warn('File upload security warnings:', securityCheck.warnings);
      }

      return {
        isValid: true,
        data: formData,
        file,
      };
    } catch (error) {
      console.error('File upload validation error:', error);
      return {
        isValid: false,
        error: 'Invalid file upload request',
      };
    }
  }

  /**
   * Validate authentication request
   */
  static async auth(request: NextRequest): Promise<ValidationResult> {
    try {
      const body = await request.json();
      
      // Determine which auth schema to use based on endpoint
      const url = new URL(request.url);
      const isRegister = url.pathname.includes('register');
      
      const schema = isRegister ? AuthRegisterSchema : AuthLoginSchema;
      const validatedData = schema.parse(body);

      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          isValid: false,
          error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation error',
        };
      }

      return {
        isValid: false,
        error: 'Invalid authentication request',
      };
    }
  }

  /**
   * Validate profile update request
   */
  static async profileUpdate(request: NextRequest): Promise<ValidationResult> {
    try {
      const body = await request.json();
      const validatedData = ProfileUpdateSchema.parse(body);

      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          isValid: false,
          error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation error',
        };
      }

      return {
        isValid: false,
        error: 'Invalid profile update request',
      };
    }
  }

  /**
   * Validate result ID parameter
   */
  static resultId(id: string): ValidationResult<string> {
    try {
      const validatedId = ResultIdSchema.parse(id);
      return {
        isValid: true,
        data: validatedId,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid result ID format. ID must be 8-64 characters and contain only letters, numbers, hyphens, and underscores.',
      };
    }
  }


  /**
   * Validate JSON request body against schema
   */
  static async jsonBody<T>(
    request: NextRequest, 
    schema: z.ZodSchema<T>
  ): Promise<ValidationResult<T>> {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);

      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ');
        
        return {
          isValid: false,
          error: `Validation errors: ${errors}`,
        };
      }

      if (error instanceof SyntaxError) {
        return {
          isValid: false,
          error: 'Invalid JSON format',
        };
      }

      return {
        isValid: false,
        error: 'Request validation failed',
      };
    }
  }

  /**
   * Validate query parameters
   */
  static queryParams(
    request: NextRequest,
    schema: z.ZodSchema
  ): ValidationResult {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());
      const validatedParams = schema.parse(params);

      return {
        isValid: true,
        data: validatedParams,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          isValid: false,
          error: firstError ? `Query parameter ${firstError.path.join('.')}: ${firstError.message}` : 'Query parameter validation error',
        };
      }

      return {
        isValid: false,
        error: 'Invalid query parameters',
      };
    }
  }
}

// Export convenience instance
export const validateRequest = RequestValidator;