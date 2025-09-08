/**
 * API Contract Validation using Zod schemas
 * Validates request/response formats against OpenAPI specification
 */

import { z } from 'zod';

// Base validation schemas
export const UuidSchema = z.string().uuid();
export const DateTimeSchema = z.string().datetime();
export const EmailSchema = z.string().email();

// File validation schemas
export const FileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().int().positive(),
  type: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
});

// ACS Section validation schema
export const ACSSectionSchema = z.object({
  section: z.string().regex(
    /^[A-Z]{2,3}\.[IVX]+\.[A-Z]+(\.[0-9]+[a-z]?)?$/,
    'Invalid ACS section format (expected: PA.I.A, PPT.VII.A.1a, etc.)'
  ),
  task: z.string().min(1, 'Task description is required'),
  elements: z.array(z.string()).min(1, 'At least one element is required'),
  page_numbers: z.array(z.number().int().positive()).optional(),
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1'),
});

// Extracted data schema
export const ExtractedDataSchema = z.object({
  acs_sections: z.array(ACSSectionSchema),
  total_sections_found: z.number().int().min(0),
  confidence_score: z.number().min(0).max(1),
  document_type: z.enum(['aktr', 'pts', 'acs', 'other']).optional(),
});

// Extraction result schema
export const ExtractionResultSchema = z.object({
  file_id: z.string(),
  file_name: z.string(),
  status: z.enum(['success', 'failed', 'partially_processed']),
  extracted_data: ExtractedDataSchema.optional(),
  error: z.string().optional(),
  processing_time_seconds: z.number().min(0).optional(),
});

// Extraction summary schema
export const ExtractionSummarySchema = z.object({
  total_files_processed: z.number().int().min(0),
  successful_extractions: z.number().int().min(0),
  failed_extractions: z.number().int().min(0),
  total_acs_sections_found: z.number().int().min(0),
  average_confidence_score: z.number().min(0).max(1).optional(),
  processing_time_total_seconds: z.number().min(0).optional(),
  unique_sections: z.array(z.string()).optional(),
});

// Extract response schema (202 response)
export const ExtractResponseSchema = z.object({
  batch_id: UuidSchema,
  status: z.enum(['processing', 'queued']),
  estimated_completion: DateTimeSchema,
  files_count: z.number().int().min(1).max(30),
  files: z.array(FileInfoSchema).optional(),
  created_at: DateTimeSchema.optional(),
  user_id: z.string().optional(),
});

// Processing status schema
export const ProcessingStatusSchema = z.object({
  batch_id: UuidSchema,
  status: z.enum(['processing', 'queued']),
  progress: z.number().min(0).max(1),
  estimated_completion: DateTimeSchema.optional(),
  files_processed: z.number().int().min(0),
  files_total: z.number().int().min(1),
  current_file: z.string().optional(),
});

// Processing results schema (completed)
export const ProcessingResultsSchema = z.object({
  batch_id: UuidSchema,
  status: z.enum(['completed', 'failed', 'partially_completed']),
  completed_at: DateTimeSchema,
  results: z.array(ExtractionResultSchema),
  summary: ExtractionSummarySchema.optional(),
});

// User information schema
export const UserInfoSchema = z.object({
  id: z.string(),
  email: EmailSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  org_id: z.string().optional(),
  org_role: z.enum(['student', 'instructor', 'admin']),
  permissions: z.array(z.string()).optional(),
});

// Session information schema
export const SessionInfoSchema = z.object({
  id: z.string(),
  expires_at: DateTimeSchema,
  last_activity: DateTimeSchema.optional(),
});

// Session response schema
export const SessionResponseSchema = z.object({
  user: UserInfoSchema,
  session: SessionInfoSchema,
});

// Auth status response schema
export const AuthStatusResponseSchema = z.object({
  authenticated: z.boolean(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
});

// Token response schema
export const TokenResponseSchema = z.object({
  token: z.string(),
  expires_at: DateTimeSchema,
  refresh_token: z.string().optional(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.enum([
    'NO_FILE_PROVIDED',
    'INVALID_FILE_TYPE',
    'FILE_TOO_LARGE',
    'TOO_MANY_FILES',
    'UNAUTHORIZED',
    'RATE_LIMIT_EXCEEDED',
    'BATCH_NOT_FOUND',
    'VALIDATION_ERROR',
    'INTERNAL_ERROR',
    'MISSING_WEBHOOK_HEADERS',
    'TOKEN_EXPIRED',
    'INVALID_TOKEN',
  ]),
  details: z.record(z.unknown()).optional(),
  request_id: z.string().optional(),
  timestamp: DateTimeSchema.optional(),
});

// Clerk webhook payload schema
export const ClerkWebhookPayloadSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted', 'session.created', 'session.ended']),
  data: z.record(z.unknown()),
  object: z.enum(['event']),
  created: z.number().int().positive().optional(),
});

// Request validation schemas
export const FileUploadRequestSchema = z.object({
  files: z.array(z.instanceof(File)).min(1).max(30),
});

// API response union types
export const ExtractorResultsResponseSchema = z.union([
  ProcessingStatusSchema,
  ProcessingResultsSchema,
]);

// Type exports for TypeScript
export type FileInfo = z.infer<typeof FileInfoSchema>;
export type ACSSection = z.infer<typeof ACSSectionSchema>;
export type ExtractedData = z.infer<typeof ExtractedDataSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type ExtractionSummary = z.infer<typeof ExtractionSummarySchema>;
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;
export type ProcessingStatus = z.infer<typeof ProcessingStatusSchema>;
export type ProcessingResults = z.infer<typeof ProcessingResultsSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type SessionInfo = z.infer<typeof SessionInfoSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ClerkWebhookPayload = z.infer<typeof ClerkWebhookPayloadSchema>;
export type FileUploadRequest = z.infer<typeof FileUploadRequestSchema>;
export type ExtractorResultsResponse = z.infer<typeof ExtractorResultsResponseSchema>;

// Contract validation utilities
export class ContractValidator {
  /**
   * Validate API response against expected schema
   */
  static validateResponse<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    endpoint: string
  ): { success: true; data: T } | { success: false; error: string; violations: string[] } {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const violations = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        return {
          success: false,
          error: `Contract violation in ${endpoint}: ${error.message}`,
          violations,
        };
      }
      return {
        success: false,
        error: `Unexpected validation error in ${endpoint}: ${error}`,
        violations: [],
      };
    }
  }

  /**
   * Validate request data before sending to API
   */
  static validateRequest<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    endpoint: string
  ): { success: true; data: T } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(data, schema, endpoint);
  }

  /**
   * Validate file upload request
   */
  static validateFileUpload(files: File[]): { success: true; data: File[] } | { success: false; error: string; violations: string[] } {
    const validation = this.validateRequest(
      { files },
      FileUploadRequestSchema,
      'POST /extractor/extract'
    );
    
    if (validation.success) {
      return { success: true, data: validation.data.files };
    }
    return validation;
  }

  /**
   * Validate extract response
   */
  static validateExtractResponse(data: unknown): { success: true; data: ExtractResponse } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      ExtractResponseSchema,
      'POST /extractor/extract'
    );
  }

  /**
   * Validate results response
   */
  static validateResultsResponse(data: unknown): { success: true; data: ExtractorResultsResponse } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      ExtractorResultsResponseSchema,
      'GET /extractor/results/{batchId}'
    );
  }

  /**
   * Validate session response
   */
  static validateSessionResponse(data: unknown): { success: true; data: SessionResponse } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      SessionResponseSchema,
      'GET /auth/session'
    );
  }

  /**
   * Validate auth status response
   */
  static validateAuthStatusResponse(data: unknown): { success: true; data: AuthStatusResponse } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      AuthStatusResponseSchema,
      'GET /auth/status'
    );
  }

  /**
   * Validate token response
   */
  static validateTokenResponse(data: unknown): { success: true; data: TokenResponse } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      TokenResponseSchema,
      'POST /auth/refresh'
    );
  }

  /**
   * Validate error response
   */
  static validateErrorResponse(data: unknown): { success: true; data: ErrorResponse } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      ErrorResponseSchema,
      'Error Response'
    );
  }

  /**
   * Validate Clerk webhook payload
   */
  static validateClerkWebhook(data: unknown): { success: true; data: ClerkWebhookPayload } | { success: false; error: string; violations: string[] } {
    return this.validateResponse(
      data,
      ClerkWebhookPayloadSchema,
      'POST /auth/clerk/webhook'
    );
  }
}

// Response status validation
export const validateResponseStatus = (
  response: Response,
  expectedStatuses: number[]
): { success: true } | { success: false; error: string } => {
  if (expectedStatuses.includes(response.status)) {
    return { success: true };
  }
  return {
    success: false,
    error: `Unexpected status code: expected one of [${expectedStatuses.join(', ')}], got ${response.status}`,
  };
};

// Headers validation for CORS and rate limiting
export const validateResponseHeaders = (
  response: Response,
  endpoint: string
): { success: true; headers: Record<string, string> } | { success: false; error: string; missing: string[] } => {
  const headers: Record<string, string> = {};
  const missing: string[] = [];

  // Extract all headers
  for (const [key, value] of response.headers.entries()) {
    headers[key] = value;
  }

  // Check for CORS headers on OPTIONS requests
  if (endpoint.includes('OPTIONS')) {
    const requiredCORSHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
    ];
    
    for (const header of requiredCORSHeaders) {
      if (!response.headers.has(header)) {
        missing.push(header);
      }
    }
  }

  // Check for rate limiting headers on rate-limited endpoints
  if (response.status === 429) {
    const requiredRateLimitHeaders = [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Reset',
    ];
    
    for (const header of requiredRateLimitHeaders) {
      if (!response.headers.has(header)) {
        missing.push(header);
      }
    }
  }

  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required headers for ${endpoint}`,
      missing,
    };
  }

  return { success: true, headers };
};

// Content type validation
export const validateContentType = (
  response: Response,
  expectedType: string = 'application/json'
): { success: true } | { success: false; error: string } => {
  const contentType = response.headers.get('Content-Type');
  if (!contentType || !contentType.includes(expectedType)) {
    return {
      success: false,
      error: `Expected Content-Type to include '${expectedType}', got '${contentType || 'null'}'`,
    };
  }
  return { success: true };
};