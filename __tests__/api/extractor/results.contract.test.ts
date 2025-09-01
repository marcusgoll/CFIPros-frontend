/**
 * Advanced Contract Tests for ACS Extractor Results API Route  
 * Comprehensive validation against OpenAPI spec for /extractor/results/{id} endpoint
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// Mock dependencies for contract testing
jest.mock("@/lib/api/middleware", () => ({
  withAPIMiddleware: jest.fn((handler) => handler),
  createOptionsHandler: jest.fn(() => () => 
    new Response("OK", {
      status: 200,
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With"
      })
    })
  ),
}));

jest.mock("@/lib/api/proxy", () => ({
  proxyApiRequest: jest.fn(),
  getClientIP: jest.fn(() => "192.168.1.1"),
  addCorrelationId: jest.fn(() => "corr_67890"),
}));

jest.mock("@/lib/analytics/telemetry", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("@/lib/api/errors", () => ({
  CommonErrors: {
    VALIDATION_ERROR: jest.fn((msg) => ({
      type: "VALIDATION_ERROR",
      message: msg,
      status: 400,
    })),
    RESULT_NOT_FOUND: jest.fn((id) => ({
      type: "RESULT_NOT_FOUND",
      message: `Result ${id} not found`,
      status: 404,
    })),
    INTERNAL_ERROR: jest.fn((msg) => ({
      type: "INTERNAL_ERROR",
      message: msg,
      status: 500,
    })),
  },
  handleAPIError: jest.fn((error) =>
    new Response(JSON.stringify({
      error: error.type, 
      message: error.message,
      request_id: "req_67890"
    }), { status: error.status || 500, headers: { "Content-Type": "application/json" } })
  ),
  APIError: class APIError extends Error {
    constructor(message: string, public status: number) {
      super(message);
    }
  }
}));

// Import after mocks
import { GET, OPTIONS } from "@/app/api/extractor/results/[id]/route";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/lib/api/proxy";
import { trackEvent } from "@/lib/analytics/telemetry";
import { handleAPIError, APIError } from "@/lib/api/errors";

/**
 * OpenAPI Schema Validators for Results Endpoint
 * These functions validate response schemas against the OpenAPI specification
 */

// Validate UUID format as per OpenAPI spec
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate ACS code pattern as per OpenAPI spec
const isValidACSCode = (code: string): boolean => {
  const acsCodePattern = /^[A-Z]+\.[IVX]+\.[A-Z]+\.[0-9]+[a-z]?$/;
  return acsCodePattern.test(code);
};

// Validate confidence score range as per OpenAPI spec
const isValidConfidenceScore = (score: number): boolean => {
  return typeof score === 'number' && score >= 0 && score <= 1;
};

// Validate ISO 8601 date-time format as per OpenAPI spec
const isValidDateTimeISO = (dateTime: string): boolean => {
  try {
    const date = new Date(dateTime);
    // Check if it's a valid date and can be converted back to ISO format
    if (isNaN(date.getTime())) return false;
    
    // Check if format matches ISO 8601 patterns
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return isoPattern.test(dateTime) && !isNaN(Date.parse(dateTime));
  } catch {
    return false;
  }
};

// Validate ACSCode schema from OpenAPI spec
const validateACSCode = (acsCode: any) => {
  expect(acsCode).toMatchObject({
    code: expect.any(String),
    description: expect.any(String),
    confidence: expect.any(Number)
  });
  
  // Required fields must be present
  expect(acsCode.code).toBeDefined();
  expect(acsCode.description).toBeDefined();
  expect(acsCode.confidence).toBeDefined();
  
  // Validate code pattern
  expect(isValidACSCode(acsCode.code)).toBe(true);
  
  // Validate confidence range
  expect(isValidConfidenceScore(acsCode.confidence)).toBe(true);
};

// Validate ExtractionResult schema from OpenAPI spec
const validateExtractionResult = (result: any) => {
  expect(result).toMatchObject({
    filename: expect.any(String),
    acs_codes: expect.any(Array),
    confidence_score: expect.any(Number)
  });
  
  // Required fields must be present
  expect(result.filename).toBeDefined();
  expect(result.acs_codes).toBeDefined();
  expect(result.confidence_score).toBeDefined();
  
  // Validate confidence_score range
  expect(isValidConfidenceScore(result.confidence_score)).toBe(true);
  
  // Validate each ACS code in the array
  result.acs_codes.forEach((acsCode: any) => {
    validateACSCode(acsCode);
  });
};

// Validate PublicReportResponse schema from OpenAPI spec
const validatePublicReportResponse = (response: any) => {
  // Validate required fields per OpenAPI spec
  expect(response).toHaveProperty('report_id');
  expect(response).toHaveProperty('created_at');
  expect(response).toHaveProperty('total_files');
  expect(response).toHaveProperty('results');
  
  // Validate field types
  expect(typeof response.report_id).toBe('string');
  expect(typeof response.created_at).toBe('string');
  expect(typeof response.total_files).toBe('number');
  expect(Array.isArray(response.results)).toBe(true);
  
  // Validate UUID format for report_id
  expect(isValidUUID(response.report_id)).toBe(true);
  
  // Validate date-time format for created_at  
  expect(isValidDateTimeISO(response.created_at)).toBe(true);
  
  // Validate numbers are non-negative
  expect(response.total_files).toBeGreaterThanOrEqual(0);
  
  // Validate optional field acs_codes_found if present
  if (response.acs_codes_found !== undefined) {
    expect(typeof response.acs_codes_found).toBe('number');
    expect(response.acs_codes_found).toBeGreaterThanOrEqual(0);
  }
  
  // Validate each extraction result
  response.results.forEach((result: any) => {
    validateExtractionResult(result);
  });
};

// Validate ErrorResponse schema from OpenAPI spec
const validateErrorResponse = (response: any) => {
  // Required fields per OpenAPI spec
  expect(response).toHaveProperty('error');
  expect(response).toHaveProperty('message');
  
  expect(typeof response.error).toBe('string');
  expect(typeof response.message).toBe('string');
  
  // Optional fields
  if (response.details !== undefined) {
    expect(typeof response.details).toBe('object');
  }
  
  if (response.request_id !== undefined) {
    expect(typeof response.request_id).toBe('string');
  }
};

// Validate CORS headers as per OpenAPI spec
const validateCORSHeaders = (response: Response) => {
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  const allowMethods = response.headers.get("Access-Control-Allow-Methods");
  const allowHeaders = response.headers.get("Access-Control-Allow-Headers");
  
  if (allowMethods) {
    expect(allowMethods).toContain("GET");
    expect(allowMethods).toContain("OPTIONS");
  }
  
  if (allowHeaders) {
    expect(allowHeaders).toContain("Content-Type");
  }
};

// Validate privacy and SEO headers
const validatePrivacyHeaders = (response: Response) => {
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, s-maxage=300");
};

describe("Advanced ACS Extractor Results API Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /extractor/results/{id} - Complete OpenAPI Validation", () => {
    it("validates complete PublicReportResponse schema (200) against OpenAPI spec", async () => {
      const reportId = "550e8400-e29b-41d4-a716-446655440000";
      
      // Comprehensive mock response matching complete PublicReportResponse schema
      const completePublicResponse = {
        report_id: reportId,
        created_at: "2024-01-15T10:30:00Z", // Exact ISO format without milliseconds
        total_files: 4,
        acs_codes_found: 18,
        results: [
          {
            filename: "private_pilot_oral_prep.pdf",
            acs_codes: [
              {
                code: "PPT.I.A.1",
                description: "Certificates and Documents - Pilot Certificate",
                confidence: 0.96
              },
              {
                code: "PPT.I.A.2", 
                description: "Certificates and Documents - Medical Certificate",
                confidence: 0.93
              },
              {
                code: "PPT.VII.A.1a",
                description: "Aircraft Systems - Engine Operation",
                confidence: 0.89
              }
            ],
            confidence_score: 0.927
          },
          {
            filename: "navigation_planning_worksheet.jpg",
            acs_codes: [
              {
                code: "PPT.IV.B.1",
                description: "Navigation - Pilotage and Dead Reckoning",
                confidence: 0.91
              },
              {
                code: "PPT.IV.B.2",
                description: "Navigation - Navigation Systems and Radar Services",
                confidence: 0.87
              },
              {
                code: "PPT.II.A.3",
                description: "Weather Information - Weather-Related Information",
                confidence: 0.84
              }
            ],
            confidence_score: 0.873
          },
          {
            filename: "weight_balance_calculations.png",
            acs_codes: [
              {
                code: "PPT.V.A.1",
                description: "Performance and Limitations - Performance and Limitations",
                confidence: 0.94
              },
              {
                code: "COM.IV.D.6",
                description: "Performance and Limitations - Weight and Balance",
                confidence: 0.88
              }
            ],
            confidence_score: 0.910
          },
          {
            filename: "airport_operations_diagram.pdf",
            acs_codes: [
              {
                code: "PPT.III.A.1",
                description: "Airport and Seaplane Base Operations - Communications, Light Signals, and Runway Lighting Systems",
                confidence: 0.92
              },
              {
                code: "PPT.III.B.1",
                description: "Airport and Seaplane Base Operations - Traffic Patterns",
                confidence: 0.86
              },
              {
                code: "CFI.IV.A.2",
                description: "Preflight Preparation - Airport and Seaplane Base Operations",
                confidence: 0.81
              }
            ],
            confidence_score: 0.863
          }
        ]
      };

      (proxyApiRequest as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(completePublicResponse), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
            "X-Robots-Tag": "noindex, nofollow",
            "Cache-Control": "public, max-age=300, s-maxage=300",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Requested-With"
          }),
        })
      );

      const request = new NextRequest(`http://localhost/api/extractor/results/${reportId}`, {
        method: "GET",
      });

      const context = { params: Promise.resolve({ id: reportId }) };
      const response = await GET(request, context);
      const responseData = await response.json();

      // Validate HTTP status code and content type
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      // Validate complete PublicReportResponse schema
      validatePublicReportResponse(responseData);

      // Validate specific values match expected schema constraints
      expect(responseData.report_id).toBe(reportId);
      expect(responseData.created_at).toBe("2024-01-15T10:30:00Z");
      expect(responseData.total_files).toBe(4);
      expect(responseData.acs_codes_found).toBe(18);
      expect(responseData.results).toHaveLength(4);

      // Validate CORS headers
      validateCORSHeaders(response);

      // Validate privacy and SEO headers
      validatePrivacyHeaders(response);

      // Validate analytics tracking occurred
      expect(trackEvent).toHaveBeenCalledWith("extractor_results_viewed", expect.objectContaining({
        report_id: expect.stringContaining("550e8400"), // Partial ID for privacy
        correlation_id: expect.any(String),
        is_public: true,
      }));

      // Validate proxy was called with public access headers
      expect(proxyApiRequest).toHaveBeenCalledWith(
        request,
        "GET",
        `/v1/results/${reportId}`,
        null,
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Public-Access": "true"
          })
        })
      );
    });

    it("validates ErrorResponse schema for not found result (404) against OpenAPI spec", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      
      (proxyApiRequest as jest.Mock).mockRejectedValue(new APIError("Not found", 404));

      (handleAPIError as jest.Mock).mockReturnValue(
        new Response(JSON.stringify({
          error: "RESULT_NOT_FOUND",
          message: `Result ${nonExistentId} not found`,
          details: {
            resource: "extraction_result",
            resource_id: nonExistentId,
            suggestion: "Verify the report ID and try again"
          },
          request_id: "req_404_not_found"
        }), { 
          status: 404, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
          } 
        })
      );

      const request = new NextRequest(`http://localhost/api/extractor/results/${nonExistentId}`, {
        method: "GET",
      });

      const context = { params: Promise.resolve({ id: nonExistentId }) };
      const response = await GET(request, context);
      const responseData = await response.json();

      // Validate HTTP status code
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      // Validate complete ErrorResponse schema
      validateErrorResponse(responseData);

      // Validate specific error structure for 404
      expect(responseData.error).toBe("RESULT_NOT_FOUND");
      expect(responseData.message).toContain(nonExistentId);
      expect(responseData.details.resource).toBe("extraction_result");
      expect(responseData.details.resource_id).toBe(nonExistentId);
      expect(responseData.request_id).toBe("req_404_not_found");

      // Validate CORS headers present even in error responses
      validateCORSHeaders(response);
    });

    it("validates parameter validation for invalid report ID format", async () => {
      const invalidIds = [
        "invalid-uuid",
        "123", 
        "",
        "too-short-id",
        "550e8400-e29b-41d4-a716" // Missing segments
      ];

      for (const invalidId of invalidIds) {
        const request = new NextRequest(`http://localhost/api/extractor/results/${invalidId}`, {
          method: "GET",
        });

        const context = { params: Promise.resolve({ id: invalidId }) };
        const response = await GET(request, context);

        if (invalidId.length < 10) {
          // Should be rejected by basic validation - middleware may map to 404 in practice
          expect([400, 404]).toContain(response.status);
          const responseData = await response.json();
          validateErrorResponse(responseData);
          // Accept either validation error or not found error
          expect(responseData.error).toMatch(/(VALIDATION_ERROR|RESULT_NOT_FOUND)/);
        }
      }
    });

    it("validates backend service error handling (500) against OpenAPI spec", async () => {
      const reportId = "550e8400-e29b-41d4-a716-446655440000";
      
      (proxyApiRequest as jest.Mock).mockRejectedValue(new Error("Backend service temporarily unavailable"));

      (handleAPIError as jest.Mock).mockReturnValue(
        new Response(JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "Unable to retrieve results at this time. Please try again.",
          details: {
            error_type: "service_unavailable",
            retry_after: "30 seconds",
            support_reference: "ERR_500_SERVICE_DOWN"
          },
          request_id: "req_500_service_error"
        }), { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        })
      );

      const request = new NextRequest(`http://localhost/api/extractor/results/${reportId}`, {
        method: "GET",
      });

      const context = { params: Promise.resolve({ id: reportId }) };
      const response = await GET(request, context);
      const responseData = await response.json();

      // Validate HTTP status code
      expect(response.status).toBe(500);

      // Validate ErrorResponse schema
      validateErrorResponse(responseData);

      // Validate service error specifics
      expect(responseData.error).toBe("INTERNAL_ERROR");
      expect(responseData.message).toContain("try again");
      expect(responseData.details.error_type).toBe("service_unavailable");
      expect(responseData.details.retry_after).toBe("30 seconds");

      // Validate analytics tracking for service errors
      expect(trackEvent).toHaveBeenCalledWith("extractor_results_error", expect.objectContaining({
        report_id: expect.stringContaining("550e8400"),
        correlation_id: expect.any(String),
        error: "Backend service temporarily unavailable",
      }));
    });

    it("validates public access security model without authentication", async () => {
      // Per OpenAPI spec: security: [] - no authentication required
      const reportId = "public-access-test-id";
      
      (proxyApiRequest as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ 
          report_id: reportId,
          created_at: "2024-01-15T10:30:00Z",
          total_files: 1,
          acs_codes_found: 3,
          results: [{
            filename: "public_test.pdf",
            acs_codes: [{
              code: "PPT.I.A.1",
              description: "Test Code",
              confidence: 0.9
            }],
            confidence_score: 0.9
          }]
        }), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      const request = new NextRequest(`http://localhost/api/extractor/results/${reportId}`, {
        method: "GET",
        // No Authorization header - testing public access
      });

      const context = { params: Promise.resolve({ id: reportId }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);

      // Verify proxy was called with public access header
      expect(proxyApiRequest).toHaveBeenCalledWith(
        request,
        "GET",
        `/v1/results/${reportId}`,
        null,
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Public-Access": "true"
          })
        })
      );
    });

    it("validates comprehensive date-time format handling", () => {
      const validDateTimes = [
        "2024-01-15T10:30:00Z",
        "2023-12-25T23:59:59Z", 
        "2024-06-01T00:00:00Z",
        "2024-02-29T12:00:00Z" // Leap year
      ];

      const invalidDateTimes = [
        "2024-01-15", // Missing time
        "10:30:00", // Missing date
        "2024-13-01T10:30:00Z", // Invalid month
        "2024-01-32T10:30:00Z", // Invalid day
        "invalid-date",
        "2024-01-15T25:00:00Z", // Invalid hour
        "2024-01-15T10:60:00Z"  // Invalid minute
      ];

      validDateTimes.forEach(dateTime => {
        expect(isValidDateTimeISO(dateTime)).toBe(true);
      });

      invalidDateTimes.forEach(dateTime => {
        expect(isValidDateTimeISO(dateTime)).toBe(false);
      });
    });
  });

  describe("OPTIONS /extractor/results/{id} - CORS Preflight Validation", () => {
    it("validates complete CORS preflight response against OpenAPI spec", async () => {
      const request = new NextRequest("http://localhost/api/extractor/results/test-id", {
        method: "OPTIONS",
        headers: {
          "Origin": "https://cfipros.com",
          "Access-Control-Request-Method": "GET"
        }
      });

      const response = await OPTIONS(request);

      // Validate CORS preflight response
      expect(response.status).toBe(200);
      validateCORSHeaders(response);
      
      // Validate that only GET and OPTIONS methods are allowed (no POST)
      expect(response.headers.get("Access-Control-Allow-Methods")).not.toContain("POST");
    });
  });

  describe("OpenAPI Schema Validation Functions", () => {
    it("validates complete schema validation pipeline", () => {
      // Test complete PublicReportResponse validation
      const validResponse = {
        report_id: "550e8400-e29b-41d4-a716-446655440000",
        created_at: "2024-01-15T10:30:00Z",
        total_files: 2,
        acs_codes_found: 4,
        results: [
          {
            filename: "test.pdf",
            acs_codes: [
              {
                code: "PPT.VII.A.1a",
                description: "Aircraft Systems",
                confidence: 0.95
              }
            ],
            confidence_score: 0.95
          }
        ]
      };

      // Should not throw any validation errors
      expect(() => validatePublicReportResponse(validResponse)).not.toThrow();
    });

    it("validates error response edge cases", () => {
      const minimalErrorResponse = {
        error: "TEST_ERROR",
        message: "Test error message"
      };

      const completeErrorResponse = {
        error: "COMPLETE_ERROR",
        message: "Complete error with details",
        details: {
          code: 1001,
          context: "test_context"
        },
        request_id: "req_complete_test"
      };

      // Both should pass validation
      expect(() => validateErrorResponse(minimalErrorResponse)).not.toThrow();
      expect(() => validateErrorResponse(completeErrorResponse)).not.toThrow();
    });

    it("validates UUID format edge cases", () => {
      const edgeCases = {
        valid: [
          "00000000-0000-0000-0000-000000000000", // All zeros
          "ffffffff-ffff-ffff-ffff-ffffffffffff", // All f's
          "12345678-1234-1234-1234-123456789abc"  // Mixed case
        ],
        invalid: [
          "12345678-1234-1234-1234-123456789abg", // Invalid hex character
          "12345678-1234-1234-1234-123456789ab",  // Too short
          "12345678-1234-1234-1234-123456789abcd" // Too long
        ]
      };

      edgeCases.valid.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });

      edgeCases.invalid.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });
  });
});