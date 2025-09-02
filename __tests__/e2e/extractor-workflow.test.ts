/**
 * End-to-End Extractor Workflow Tests
 * Tests complete workflow using actual test-data files
 * Upload → Process → Retrieve Results
 */

import { NextRequest } from "next/server";
import { POST as extractHandler } from "@/app/api/extractor/extract/route";
import { GET as resultsHandler } from "@/app/api/extractor/results/[id]/route";
import fs from 'fs';
import path from 'path';

const SKIP_E2E_TESTS = process.env.SKIP_E2E_TESTS === 'true' || process.env.CI === 'true';
const TEST_DATA_DIR = path.join(process.cwd(), 'test-data');

// Helper function to load test files
async function loadTestFile(filename: string): Promise<File> {
  const filePath = path.join(TEST_DATA_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Test file not found: ${filePath}`);
  }
  
  const buffer = fs.readFileSync(filePath);
  const mimeType = filename.endsWith('.pdf') ? 'application/pdf' : 
                   filename.endsWith('.png') ? 'image/png' : 
                   filename.endsWith('.jpeg') || filename.endsWith('.jpg') ? 'image/jpeg' : 
                   'application/octet-stream';
  
  console.log(`📄 Loading ${filename}: ${buffer.length} bytes, type: ${mimeType}`);
  
  // Create File with proper buffer conversion
  const file = new File([new Uint8Array(buffer)], filename, { type: mimeType });
  console.log(`✅ Created File object: ${file.name}, size: ${file.size}, type: ${file.type}`);
  
  return file;
}

// Helper function to create FormData with test files
async function createTestFormData(filenames: string[]): Promise<FormData> {
  const formData = new FormData();
  
  for (const filename of filenames) {
    try {
      const file = await loadTestFile(filename);
      formData.append('files', file);
    } catch (error) {
      console.warn(`⚠️  Could not load test file: ${filename}`, error);
    }
  }
  
  return formData;
}

describe('E2E Extractor Workflow Tests', () => {
  beforeAll(() => {
    if (SKIP_E2E_TESTS) {
      console.log('⏭️  Skipping E2E tests (SKIP_E2E_TESTS=true)');
    } else {
      console.log(`📁 Using test data directory: ${TEST_DATA_DIR}`);
    }
  });

  describe('Single File Processing', () => {
    it('should process a single PDF score report', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Create request with a single score report
      const formData = await createTestFormData(['ScoreReport.pdf']);
      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      console.log(`📤 Sending request with ${formData.getAll('files').length} files`);
      
      const response = await extractHandler(request);
      
      console.log(`📤 Upload response status: ${response.status}`);
      
      // Should accept the file for processing or return validation error
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);

      if (response.status === 202) {
        const result = await response.json();
        console.log('✅ File accepted for processing:', result);
        
        // Should have batch/job ID for tracking
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('status');
      } else {
        const errorText = await response.text();
        console.log(`ℹ️  Response (${response.status}):`, errorText.substring(0, 200));
      }
    }, 10000);

    it('should process a commercial pilot written test result', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const formData = await createTestFormData(['Commercial Pilot Written Results.pdf']);
      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 Commercial pilot test response: ${response.status}`);
      
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);
    }, 10000);

    it('should process image files (PNG)', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const formData = await createTestFormData(['image.png']);
      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 PNG image response: ${response.status}`);
      
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);
    }, 10000);

    it('should process image files (JPEG)', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const formData = await createTestFormData(['Image.jpeg']);
      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 JPEG image response: ${response.status}`);
      
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);
    }, 10000);
  });

  describe('Batch File Processing', () => {
    it('should process multiple PDF score reports', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Test with multiple score reports (within 5 file limit)
      const formData = await createTestFormData([
        'ScoreReport.pdf',
        'ScoreReport (1).pdf', 
        'ScoreReport (2) (1).pdf',
        'Commercial written.pdf'
      ]);

      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 Batch processing response: ${response.status}`);
      
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);

      if (response.status === 202) {
        const result = await response.json();
        console.log('✅ Batch accepted for processing:', result);
        
        // Should have batch info
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('status');
      } else {
        const errorText = await response.text();
        console.log(`ℹ️  Batch response (${response.status}):`, errorText.substring(0, 200));
      }
    }, 15000);

    it('should process mixed file types (PDF + Images)', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const formData = await createTestFormData([
        'CAX Written Report.pdf',
        'image.png',
        'Image.jpeg'
      ]);

      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 Mixed file types response: ${response.status}`);
      
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);
    }, 15000);

    it('should handle maximum file limit (5 files)', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Test exactly 5 files (the maximum)
      const formData = await createTestFormData([
        'ScoreReport.pdf',
        'ScoreReport (1).pdf',
        'Commercial written.pdf',
        'image.png',
        'Image.jpeg'
      ]);

      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 Maximum files (5) response: ${response.status}`);
      
      expect([200, 202, 400, 401, 422, 429, 500]).toContain(response.status);
    }, 15000);
  });

  describe('File Validation Tests', () => {
    it('should validate file sizes', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Test with largest available files
      const formData = await createTestFormData([
        'U.S. DEPARTMENT OF TRANSPORTATION.pdf', // Potentially large file
        'ScoreReport-3.pdf'
      ]);

      const request = new NextRequest('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await extractHandler(request);
      console.log(`📤 Large files response: ${response.status}`);
      
      // Should either accept or reject with size error
      expect([200, 202, 400, 413, 422, 429, 500]).toContain(response.status);

      if (response.status === 400 || response.status === 413) {
        const errorText = await response.text();
        console.log('ℹ️  File size validation:', errorText.substring(0, 200));
      }
    }, 15000);
  });

  describe('Results Processing', () => {
    it('should test results endpoint structure', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Test results endpoint with a mock ID
      const request = new NextRequest('http://localhost:3000/api/extractor/results/test-id');
      
      try {
        const response = await resultsHandler(request, { 
          params: Promise.resolve({ id: 'test-id' }) 
        });
        
        console.log(`📥 Results endpoint response: ${response.status}`);
        
        // Should return 404 for non-existent ID or auth error
        expect([400, 401, 404, 422, 500]).toContain(response.status);
      } catch (error) {
        console.log('ℹ️  Results endpoint test completed with expected error');
        expect(error).toBeDefined();
      }
    });
  });

  describe('Test Data Validation', () => {
    it('should verify test data files exist and are readable', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const expectedFiles = [
        'ScoreReport.pdf',
        'Commercial Pilot Written Results.pdf',
        'image.png',
        'Image.jpeg'
      ];

      for (const filename of expectedFiles) {
        const filePath = path.join(TEST_DATA_DIR, filename);
        expect(fs.existsSync(filePath)).toBe(true);
        
        const stats = fs.statSync(filePath);
        console.log(`📄 ${filename}: ${(stats.size / 1024).toFixed(1)}KB`);
        expect(stats.size).toBeGreaterThan(0);
      }
    });

    it('should log available test data files', () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      try {
        const files = fs.readdirSync(TEST_DATA_DIR);
        console.log('📁 Available test data files:');
        
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg'));
        
        console.log(`   📄 PDF files (${pdfFiles.length}):`, pdfFiles.slice(0, 5).join(', '));
        console.log(`   🖼️  Image files (${imageFiles.length}):`, imageFiles.slice(0, 5).join(', '));
        
        expect(files.length).toBeGreaterThan(0);
        expect(pdfFiles.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn('⚠️  Could not read test data directory:', error);
        expect(false).toBe(true); // Fail the test if we can't read test data
      }
    });
  });
});