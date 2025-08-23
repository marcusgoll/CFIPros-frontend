/**
 * Request validation utilities for API endpoints
 * Uses Zod for schema validation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { config } from '@/lib/config';

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

export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  error?: string;
  file?: File;
}

export class RequestValidator {
  /**
   * Validate file upload request
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

      // Check file size
      if (file.size > config.fileUpload.maxSize) {
        return {
          isValid: false,
          error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size ${config.fileUpload.maxSize / 1024 / 1024}MB`,
        };
      }

      // Check file type
      if (!config.fileUpload.allowedTypes.includes(file.type as any)) {
        return {
          isValid: false,
          error: `Unsupported file type: ${file.type}. Supported types: ${config.fileUpload.allowedTypes.join(', ')}`,
        };
      }

      // Check file extension  
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!config.fileUpload.allowedExtensions.includes(extension as any)) {
        return {
          isValid: false,
          error: `Unsupported file extension: ${extension}. Supported extensions: ${config.fileUpload.allowedExtensions.join(', ')}`,
        };
      }

      // Check filename for security
      if (this.hasUnsafeFileName(file.name)) {
        return {
          isValid: false,
          error: 'Filename contains unsafe characters',
        };
      }

      return {
        isValid: true,
        data: formData,
        file,
      };
    } catch (error) {
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
   * Check for unsafe filename patterns
   */
  private static hasUnsafeFileName(filename: string): boolean {
    const unsafePatterns = [
      /[<>:"|?*]/,     // Windows unsafe characters
      /^\.\.?$/,       // Relative path traversal
      /\.\./,          // Path traversal
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /\0/,            // Null byte
      /[\x00-\x1f\x7f-\x9f]/, // Control characters
    ];
    
    return unsafePatterns.some(pattern => pattern.test(filename));
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