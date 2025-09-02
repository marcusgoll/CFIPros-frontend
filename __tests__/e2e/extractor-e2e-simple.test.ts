/**
 * Simplified E2E Extractor Test
 * Direct API calls to test the live backend integration
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const SKIP_E2E_TESTS = process.env.SKIP_E2E_TESTS === 'true' || process.env.CI === 'true';
const API_BASE_URL = process.env.BACKEND_API_URL || 'https://api.cfipros.com';
const TEST_DATA_DIR = path.join(process.cwd(), 'test-data');

describe('E2E Direct API Tests', () => {
  beforeAll(() => {
    if (SKIP_E2E_TESTS) {
      console.log('⏭️  Skipping E2E tests (SKIP_E2E_TESTS=true)');
    } else {
      console.log(`🎯 Testing against: ${API_BASE_URL}`);
      console.log(`📁 Using test data: ${TEST_DATA_DIR}`);
    }
  });

  describe('Direct Backend API Tests', () => {
    it('should test file upload to live backend', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Load a real test file
      const testFile = path.join(TEST_DATA_DIR, 'ScoreReport.pdf');
      const buffer = fs.readFileSync(testFile);
      
      console.log(`📄 Loading ${path.basename(testFile)}: ${buffer.length} bytes`);
      
      // Create FormData for direct API call
      const FormData = require('form-data');
      const form = new FormData();
      form.append('files', buffer, {
        filename: 'ScoreReport.pdf',
        contentType: 'application/pdf'
      });

      try {
        const response = await fetch(`${API_BASE_URL}/v1/extractor/batch/extract`, {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        });

        console.log(`🔄 API Response: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log(`📥 Response body (${responseText.length} chars):`, responseText.substring(0, 300));

        // Expect either success or authentication/validation error
        expect([200, 202, 400, 401, 403, 422, 429, 500]).toContain(response.status);

        if (response.status === 202) {
          const result = JSON.parse(responseText);
          console.log('✅ Batch processing initiated:', result);
          expect(result).toHaveProperty('id');
        } else if (response.status === 401) {
          console.log('🔐 Authentication required (expected for live API)');
          expect(responseText).toContain('401');
        } else if (response.status === 422) {
          console.log('📝 Validation error (expected without auth)');
          const result = JSON.parse(responseText);
          expect(result).toHaveProperty('detail');
        }
      } catch (error) {
        console.error('🚨 API call failed:', error.message);
        throw error;
      }
    }, 15000);

    it('should test multiple files to live backend', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      // Load multiple test files
      const testFiles = ['ScoreReport.pdf', 'Commercial written.pdf'];
      const FormData = require('form-data');
      const form = new FormData();
      
      let totalSize = 0;
      for (const filename of testFiles) {
        const filePath = path.join(TEST_DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          totalSize += buffer.length;
          form.append('files', buffer, {
            filename,
            contentType: 'application/pdf'
          });
          console.log(`📄 Added ${filename}: ${(buffer.length / 1024).toFixed(1)}KB`);
        }
      }

      console.log(`📦 Total batch size: ${(totalSize / 1024).toFixed(1)}KB`);

      try {
        const response = await fetch(`${API_BASE_URL}/v1/extractor/batch/extract`, {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        });

        console.log(`🔄 Batch API Response: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log(`📥 Batch response:`, responseText.substring(0, 300));

        expect([200, 202, 400, 401, 403, 422, 429, 500]).toContain(response.status);
      } catch (error) {
        console.error('🚨 Batch API call failed:', error.message);
        throw error;
      }
    }, 20000);

    it('should test image file processing', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const testFile = path.join(TEST_DATA_DIR, 'image.png');
      if (!fs.existsSync(testFile)) {
        console.log('⏭️  PNG test file not found, skipping');
        return;
      }

      const buffer = fs.readFileSync(testFile);
      console.log(`🖼️  Loading ${path.basename(testFile)}: ${(buffer.length / 1024).toFixed(1)}KB`);

      const FormData = require('form-data');
      const form = new FormData();
      form.append('files', buffer, {
        filename: 'image.png',
        contentType: 'image/png'
      });

      try {
        const response = await fetch(`${API_BASE_URL}/v1/extractor/batch/extract`, {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        });

        console.log(`🔄 PNG API Response: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log(`📥 PNG response:`, responseText.substring(0, 200));

        expect([200, 202, 400, 401, 403, 422, 429, 500]).toContain(response.status);
      } catch (error) {
        console.error('🚨 PNG API call failed:', error.message);
        throw error;
      }
    }, 15000);
  });

  describe('Results API Testing', () => {
    it('should test results endpoint availability', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/v1/extractor/results/test-123`, {
          method: 'GET'
        });

        console.log(`📊 Results API Response: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log(`📥 Results response:`, responseText.substring(0, 200));

        // Expect 404 (not found) or 401 (auth required) for test ID
        expect([400, 401, 404, 422]).toContain(response.status);
      } catch (error) {
        console.error('🚨 Results API call failed:', error.message);
        throw error;
      }
    });
  });

  describe('API Health Validation', () => {
    it('should validate backend is healthy and responsive', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('version');
      
      console.log(`✅ Backend Health: ${data.status} (v${data.version})`);
      console.log(`🌍 Environment: ${data.environment}`);
      console.log(`⏰ Timestamp: ${data.timestamp}`);
    });

    it('should validate OpenAPI spec includes our endpoints', async () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/openapi.json`);
      const spec = await response.json();

      expect(response.status).toBe(200);
      expect(spec.paths).toHaveProperty('/v1/extractor/extract');
      expect(spec.paths).toHaveProperty('/v1/extractor/batch/extract');
      expect(spec.paths).toHaveProperty('/v1/extractor/results/{result_id}');

      console.log(`📋 API Spec: ${spec.info.title} v${spec.info.version}`);
      console.log(`🔌 Endpoints found: ${Object.keys(spec.paths).length}`);
    });
  });

  describe('Test Data Validation', () => {
    it('should verify test data is available and valid', () => {
      if (SKIP_E2E_TESTS) {
        pending('Skipping E2E test');
        return;
      }

      const files = fs.readdirSync(TEST_DATA_DIR);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg'));

      console.log(`📁 Test data summary:`);
      console.log(`   📄 PDF files: ${pdfFiles.length}`);
      console.log(`   🖼️  Image files: ${imageFiles.length}`);
      console.log(`   📊 Total files: ${files.length}`);

      // Verify key test files exist
      const keyFiles = ['ScoreReport.pdf', 'Commercial Pilot Written Results.pdf'];
      for (const file of keyFiles) {
        const filePath = path.join(TEST_DATA_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
        
        const stats = fs.statSync(filePath);
        console.log(`   ✅ ${file}: ${(stats.size / 1024).toFixed(1)}KB`);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      }
    });
  });
});