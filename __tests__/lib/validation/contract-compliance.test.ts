/**
 * Contract Compliance Monitoring Tests
 * Tests for compliance reporting and drift detection
 */

import {
  ContractComplianceMonitor,
  ContractDriftDetector,
  createComplianceInterceptor,
} from '@/lib/validation/contract-compliance';

describe('Contract Compliance Monitoring', () => {
  let monitor: ContractComplianceMonitor;
  
  beforeEach(() => {
    monitor = new ContractComplianceMonitor();
  });

  describe('ContractComplianceMonitor', () => {
    test('records compliant API calls', () => {
      const response = new Response(JSON.stringify({
        batch_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
        estimated_completion: '2025-09-08T10:30:00Z',
        files_count: 1,
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = {
        batch_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
        estimated_completion: '2025-09-08T10:30:00Z',
        files_count: 1,
      };

      const metrics = monitor.recordApiCall(
        '/extractor/extract',
        'POST',
        response,
        responseData,
        150
      );

      expect(metrics.success).toBe(true);
      expect(metrics.violation).toBeUndefined();
      expect(metrics.responseTime).toBe(150);
    });

    test('records contract violations', () => {
      const response = new Response(JSON.stringify({
        batch_id: 'invalid-uuid',
        status: 'invalid-status',
        files_count: 'not-a-number',
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = {
        batch_id: 'invalid-uuid',
        status: 'invalid-status',
        files_count: 'not-a-number',
      };

      const metrics = monitor.recordApiCall(
        '/extractor/extract',
        'POST',
        response,
        responseData,
        200
      );

      expect(metrics.success).toBe(false);
      expect(metrics.violation).toBeDefined();
      expect(metrics.violation?.severity).toBe('high');
      expect(metrics.violation?.violations.length).toBeGreaterThan(0);
    });

    test('handles error responses correctly', () => {
      const response = new Response(JSON.stringify({
        error: 'Invalid file type',
        code: 'INVALID_FILE_TYPE',
        details: {
          accepted_types: ['application/pdf', 'image/jpeg', 'image/png'],
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = {
        error: 'Invalid file type',
        code: 'INVALID_FILE_TYPE',
        details: {
          accepted_types: ['application/pdf', 'image/jpeg', 'image/png'],
        },
      };

      const metrics = monitor.recordApiCall(
        '/extractor/extract',
        'POST',
        response,
        responseData,
        100
      );

      expect(metrics.success).toBe(true); // Valid error response
      expect(metrics.violation).toBeUndefined();
    });

    test('determines severity correctly', () => {
      // Test critical severity for auth endpoints
      const authResponse = new Response(JSON.stringify({
        error: 'Unauthorized',
        code: 'INVALID_ERROR_CODE', // Invalid code should trigger violation
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

      const metrics = monitor.recordApiCall(
        '/auth/session',
        'GET',
        authResponse,
        { error: 'Unauthorized', code: 'INVALID_ERROR_CODE' },
        50
      );

      expect(metrics.violation?.severity).toBe('critical');
    });

    test('generates compliance report', () => {
      // Record some API calls
      const successResponse = new Response(JSON.stringify({
        authenticated: true,
        user_id: 'user_123',
      }), { status: 200 });

      const errorResponse = new Response(JSON.stringify({
        batch_id: 'invalid',
        status: 'processing',
        files_count: 1,
      }), { status: 202 });

      monitor.recordApiCall('/auth/status', 'GET', successResponse, 
        { authenticated: true, user_id: 'user_123' }, 100);
      
      monitor.recordApiCall('/extractor/extract', 'POST', errorResponse, 
        { batch_id: 'invalid', status: 'processing', files_count: 1 }, 200);

      const report = monitor.generateComplianceReport();

      expect(report.totalRequests).toBe(2);
      expect(report.compliantRequests).toBe(1);
      expect(report.complianceRate).toBe(50);
      expect(report.violations).toHaveLength(1);
      expect(report.endpointStats).toHaveProperty('GET /auth/status');
      expect(report.endpointStats).toHaveProperty('POST /extractor/extract');
    });

    test('filters violations by severity', () => {
      // Create violations of different severities
      const criticalResponse = new Response(JSON.stringify({
        error: 'Unauthorized',
        code: 'INVALID_CODE',
      }), { status: 401 });

      const lowResponse = new Response(JSON.stringify({
        batch_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
        estimated_completion: '2025-09-08T10:30:00Z',
        files_count: 1,
        extra_field: 'unexpected', // Minor violation
      }), { status: 202 });

      monitor.recordApiCall('/auth/session', 'GET', criticalResponse,
        { error: 'Unauthorized', code: 'INVALID_CODE' }, 100);
      
      monitor.recordApiCall('/extractor/extract', 'POST', lowResponse,
        { batch_id: '550e8400-e29b-41d4-a716-446655440000', status: 'processing', estimated_completion: '2025-09-08T10:30:00Z', files_count: 1, extra_field: 'unexpected' }, 150);

      const criticalViolations = monitor.getViolationsBySeverity('critical');
      
      expect(criticalViolations).toHaveLength(1);
      expect(criticalViolations[0].endpoint).toBe('/auth/session');
    });

    test('can be disabled', () => {
      monitor.setEnabled(false);

      const response = new Response(JSON.stringify({
        batch_id: 'invalid-uuid',
        status: 'processing',
        files_count: 1,
      }), { status: 202 });

      const metrics = monitor.recordApiCall(
        '/extractor/extract',
        'POST',
        response,
        { batch_id: 'invalid-uuid', status: 'processing', files_count: 1 },
        100
      );

      // Should not validate when disabled
      expect(metrics.violation).toBeUndefined();
      expect(monitor.generateComplianceReport().violations).toHaveLength(0);
    });
  });

  describe('ContractDriftDetector', () => {
    let driftDetector: ContractDriftDetector;

    beforeEach(() => {
      driftDetector = new ContractDriftDetector();
    });

    test('detects no drift with similar reports', () => {
      const baseline = {
        generatedAt: new Date('2025-09-01'),
        totalRequests: 100,
        compliantRequests: 95,
        violations: [],
        complianceRate: 95,
        endpointStats: {
          'POST /extractor/extract': {
            total: 50,
            compliant: 48,
            violations: 2,
            complianceRate: 96,
          },
        },
        summary: {
          criticalViolations: 0,
          highViolations: 1,
          mediumViolations: 1,
          lowViolations: 0,
        },
      };

      const current = {
        generatedAt: new Date('2025-09-08'),
        totalRequests: 120,
        compliantRequests: 114,
        violations: [],
        complianceRate: 95,
        endpointStats: {
          'POST /extractor/extract': {
            total: 60,
            compliant: 58,
            violations: 2,
            complianceRate: 96.67,
          },
        },
        summary: {
          criticalViolations: 0,
          highViolations: 1,
          mediumViolations: 1,
          lowViolations: 0,
        },
      };

      driftDetector.setBaseline(baseline);
      driftDetector.updateCurrent(current);

      const driftAnalysis = driftDetector.detectDrift();

      expect(driftAnalysis.hasDrift).toBe(false);
      expect(driftAnalysis.complianceChange).toBe(0);
    });

    test('detects significant compliance drift', () => {
      const baseline = {
        generatedAt: new Date('2025-09-01'),
        totalRequests: 100,
        compliantRequests: 95,
        violations: [],
        complianceRate: 95,
        endpointStats: {
          'POST /extractor/extract': {
            total: 50,
            compliant: 48,
            violations: 2,
            complianceRate: 96,
          },
        },
        summary: {
          criticalViolations: 0,
          highViolations: 1,
          mediumViolations: 1,
          lowViolations: 0,
        },
      };

      const current = {
        generatedAt: new Date('2025-09-08'),
        totalRequests: 120,
        compliantRequests: 100, // 83% compliance - drop of >10%
        violations: [{
          endpoint: '/extractor/extract',
          method: 'POST',
          timestamp: new Date(),
          expectedSchema: 'ExtractResponse',
          violations: ['New violation'],
          severity: 'high' as const,
          impact: 'High impact',
          responseStatus: 202,
        }],
        complianceRate: 83.33,
        endpointStats: {
          'POST /extractor/extract': {
            total: 60,
            compliant: 45,
            violations: 15,
            complianceRate: 75,
          },
        },
        summary: {
          criticalViolations: 0,
          highViolations: 5,
          mediumViolations: 10,
          lowViolations: 5,
        },
      };

      driftDetector.setBaseline(baseline);
      driftDetector.updateCurrent(current);
      driftDetector.setDriftThreshold(5); // 5% threshold

      const driftAnalysis = driftDetector.detectDrift();

      expect(driftAnalysis.hasDrift).toBe(true);
      expect(driftAnalysis.complianceChange).toBeCloseTo(-11.67);
      expect(driftAnalysis.newViolations).toHaveLength(1);
      expect(driftAnalysis.endpointChanges['POST /extractor/extract'].significant).toBe(true);
    });

    test('identifies new violations', () => {
      const baseline = {
        generatedAt: new Date('2025-09-01'),
        totalRequests: 100,
        compliantRequests: 95,
        violations: [{
          endpoint: '/auth/session',
          method: 'GET',
          timestamp: new Date(),
          expectedSchema: 'SessionResponse',
          violations: ['Existing violation'],
          severity: 'low' as const,
          impact: 'Low impact',
          responseStatus: 200,
        }],
        complianceRate: 95,
        endpointStats: {},
        summary: {
          criticalViolations: 0,
          highViolations: 0,
          mediumViolations: 0,
          lowViolations: 1,
        },
      };

      const current = {
        generatedAt: new Date('2025-09-08'),
        totalRequests: 120,
        compliantRequests: 114,
        violations: [
          {
            endpoint: '/auth/session',
            method: 'GET',
            timestamp: new Date(),
            expectedSchema: 'SessionResponse',
            violations: ['Existing violation'],
            severity: 'low' as const,
            impact: 'Low impact',
            responseStatus: 200,
          },
          {
            endpoint: '/extractor/extract',
            method: 'POST',
            timestamp: new Date(),
            expectedSchema: 'ExtractResponse',
            violations: ['New violation'],
            severity: 'high' as const,
            impact: 'High impact',
            responseStatus: 202,
          }
        ],
        complianceRate: 95,
        endpointStats: {},
        summary: {
          criticalViolations: 0,
          highViolations: 1,
          mediumViolations: 0,
          lowViolations: 1,
        },
      };

      driftDetector.setBaseline(baseline);
      driftDetector.updateCurrent(current);

      const driftAnalysis = driftDetector.detectDrift();

      expect(driftAnalysis.newViolations).toHaveLength(1);
      expect(driftAnalysis.newViolations[0].endpoint).toBe('/extractor/extract');
    });
  });

  describe('createComplianceInterceptor', () => {
    let monitor: ContractComplianceMonitor;
    let interceptor: ReturnType<typeof createComplianceInterceptor>;

    beforeEach(() => {
      monitor = new ContractComplianceMonitor();
      interceptor = createComplianceInterceptor(monitor);
    });

    test('intercepts successful requests', async () => {
      const mockFetch = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({
          authenticated: true,
          user_id: 'user_123',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const response = await interceptor('/auth/status', { method: 'GET' }, mockFetch);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith('/auth/status', { method: 'GET' });
      
      const report = monitor.generateComplianceReport();
      expect(report.totalRequests).toBe(1);
      expect(report.compliantRequests).toBe(1);
    });

    test('intercepts failed requests', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        interceptor('/auth/status', { method: 'GET' }, mockFetch)
      ).rejects.toThrow('Network error');

      const report = monitor.generateComplianceReport();
      expect(report.totalRequests).toBe(1);
      expect(report.compliantRequests).toBe(0);
    });

    test('handles non-JSON responses', async () => {
      const mockFetch = jest.fn().mockResolvedValue(
        new Response('OK', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      );

      const response = await interceptor('/health', { method: 'GET' }, mockFetch);

      expect(response.status).toBe(200);
      
      const report = monitor.generateComplianceReport();
      expect(report.totalRequests).toBe(1);
    });
  });
});