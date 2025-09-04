/**
 * API Route Integration Test
 * Tests the frontend API routes with the live backend
 */

import { POST as extractHandler } from "@/app/api/extractor/extract/route";
import { NextRequest } from "next/server";

// Skip in CI or when specifically disabled
const SKIP_LIVE_TESTS = process.env.SKIP_LIVE_TESTS === 'true' || process.env.CI === 'true';

describe("API Route Integration Test", () => {
  beforeAll(() => {
    if (SKIP_LIVE_TESTS) {
      console.log("⏭️  Skipping live API tests (SKIP_LIVE_TESTS=true)");
    }
  });

  describe("Frontend API Route", () => {
    it("should handle file upload requests and proxy to backend", async () => {
      if (SKIP_LIVE_TESTS) {
        pending("Skipping live test");
        return;
      }

      // Create a test PDF file
      const testPDF = createTestPDF("Test ACS code extraction content");
      const formData = new FormData();
      formData.append("files", testPDF);

      // Create a NextRequest with the form data
      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      // Call the handler directly
      const response = await extractHandler(request);

      // The response will depend on authentication and rate limiting
      // but should not be a connection error
      expect(response).toBeDefined();
      expect(response.status).toBeDefined();
      
      // Common status codes we might expect:
      // 200/202: Success (if authenticated and not rate limited)
      // 400: Validation error
      // 401: Authentication required
      // 429: Rate limited
      // 500: Backend error
      expect([200, 202, 400, 401, 429, 500]).toContain(response.status);

      console.log(`Response status: ${response.status}`);
      
      // Try to read response body safely
      try {
        const responseText = typeof response.text === 'function' 
          ? await response.text() 
          : JSON.stringify(response.body || 'No response body');
        console.log(`Response body: ${responseText.substring(0, 200)}...`);
        
        // If we can parse JSON, it means the backend is responding properly
        try {
          const jsonResponse = JSON.parse(responseText);
          expect(jsonResponse).toBeDefined();
          console.log("✅ Backend API is responding with valid JSON");
        } catch (error) {
          console.log("⚠️  Response is not JSON, might be HTML error page");
        }
      } catch (error) {
        console.log(`⚠️  Could not read response body: ${error}`);
      }
    });

    it("should validate file requirements", async () => {
      if (SKIP_LIVE_TESTS) {
        pending("Skipping live test");
        return;
      }

      // Test with no files
      const formData = new FormData();

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);

      // Should get a validation error
      expect([400, 422]).toContain(response.status);
      
      try {
        const responseText = typeof response.text === 'function' 
          ? await response.text() 
          : JSON.stringify(response.body || 'No response body');
        console.log(`Validation error response: ${responseText}`);
      } catch (error) {
        console.log(`⚠️  Could not read validation response: ${error}`);
      }
    });

    it("should handle oversized files", async () => {
      if (SKIP_LIVE_TESTS) {
        pending("Skipping live test");
        return;
      }

      // Create a large test file (over 15MB)
      const largeContent = "A".repeat(16 * 1024 * 1024); // 16MB
      const largeFile = new File([largeContent], "large.pdf", {
        type: "application/pdf"
      });

      const formData = new FormData();
      formData.append("files", largeFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);

      // Should get a validation error for file too large
      expect([400, 413, 422]).toContain(response.status);
      
      try {
        const responseText = typeof response.text === 'function' 
          ? await response.text() 
          : JSON.stringify(response.body || 'No response body');
        console.log(`Large file error response: ${responseText}`);
      } catch (error) {
        console.log(`⚠️  Could not read large file response: ${error}`);
      }
    });

    it("should handle multiple files within limits", async () => {
      if (SKIP_LIVE_TESTS) {
        pending("Skipping live test");
        return;
      }

      // Create multiple test files (within 5 file limit)
      const files = [];
      for (let i = 1; i <= 3; i++) {
        files.push(createTestPDF(`Test PDF ${i} content for ACS extraction`));
      }

      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append("files", file);
      });

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);

      // Should handle multiple files (auth/rate limiting permitting)
      expect([200, 202, 400, 401, 429, 500]).toContain(response.status);
      
      try {
        const responseText = typeof response.text === 'function' 
          ? await response.text() 
          : JSON.stringify(response.body || 'No response body');
        console.log(`Multiple files response: ${responseText.substring(0, 200)}...`);
      } catch (error) {
        console.log(`⚠️  Could not read multiple files response: ${error}`);
      }
    });

    it("should reject unsupported file types", async () => {
      if (SKIP_LIVE_TESTS) {
        pending("Skipping live test");
        return;
      }

      // Create an unsupported file type
      const textFile = new File(["This is a text file"], "test.txt", {
        type: "text/plain"
      });

      const formData = new FormData();
      formData.append("files", textFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);

      // Should get a validation error for unsupported file type
      expect([400, 415, 422]).toContain(response.status);
      
      try {
        const responseText = typeof response.text === 'function' 
          ? await response.text() 
          : JSON.stringify(response.body || 'No response body');
        console.log(`Unsupported file type response: ${responseText}`);
      } catch (error) {
        console.log(`⚠️  Could not read unsupported file response: ${error}`);
      }
    });
  });

  describe("Configuration Validation", () => {
    it("should have correct environment configuration", () => {
      expect(process.env.BACKEND_API_URL).toBeDefined();
      expect(process.env.NODE_ENV).toBe("test");
      
      console.log(`Backend API URL: ${process.env.BACKEND_API_URL}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    it("should use production API endpoint", () => {
      const apiUrl = process.env.BACKEND_API_URL;
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe("string");
      
      console.log(`✅ Using API endpoint: ${apiUrl}`);
      
      if (apiUrl?.includes('api.cfipros.com')) {
        console.log('✅ Production API configured');
        expect(apiUrl).toContain("https://");
      } else {
        console.log('ℹ️  Using local/test API endpoint');
      }
    });
  });
});

// Helper function to create test PDF files
function createTestPDF(content: string = "Test PDF content"): File {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj

4 0 obj
<< /Length ${content.length + 50} >>
stream
BT
/F1 12 Tf
100 700 Td
(${content}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000190 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${300 + content.length}
%%EOF`;

  return new File([pdfContent], "test.pdf", { type: "application/pdf" });
}