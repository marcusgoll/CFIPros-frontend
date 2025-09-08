/**
 * Contract Compliance Reporting and Violation Detection
 * Monitors API contract adherence and reports violations
 */

import { ContractValidator } from './api-contracts';
import type { 
  ExtractResponse, 
  ExtractorResultsResponse, 
  ErrorResponse,
  SessionResponse,
  AuthStatusResponse,
  TokenResponse,
} from './api-contracts';

export interface ContractViolation {
  endpoint: string;
  method: string;
  timestamp: Date;
  expectedSchema: string;
  actualData: unknown;
  violations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  responseStatus: number;
  requestId?: string;
}

export interface ComplianceReport {
  generatedAt: Date;
  totalRequests: number;
  compliantRequests: number;
  violations: ContractViolation[];
  complianceRate: number;
  endpointStats: Record<string, {
    total: number;
    compliant: number;
    violations: number;
    complianceRate: number;
  }>;
  summary: {
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
  };
}

export interface ApiCallMetrics {
  endpoint: string;
  method: string;
  timestamp: Date;
  responseTime: number;
  status: number;
  success: boolean;
  violation?: ContractViolation;
}

export class ContractComplianceMonitor {
  private violations: ContractViolation[] = [];
  private metrics: ApiCallMetrics[] = [];
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Enable or disable compliance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Record API call and validate response
   */
  recordApiCall(
    endpoint: string,
    method: string,
    response: Response,
    responseData: unknown,
    responseTime: number,
    requestId?: string
  ): ApiCallMetrics {
    const timestamp = new Date();
    const metrics: ApiCallMetrics = {
      endpoint,
      method,
      timestamp,
      responseTime,
      status: response.status,
      success: response.ok,
    };

    if (!this.enabled) {
      this.metrics.push(metrics);
      return metrics;
    }

    // Validate response based on endpoint
    const validation = this.validateEndpointResponse(endpoint, method, responseData, response.status);
    
    if (!validation.success) {
      const violation: ContractViolation = {
        endpoint,
        method,
        timestamp,
        expectedSchema: validation.schemaName,
        actualData: responseData,
        violations: validation.violations,
        severity: this.determineSeverity(endpoint, response.status, validation.violations),
        impact: this.determineImpact(endpoint, response.status, validation.violations),
        responseStatus: response.status,
        requestId,
      };

      this.violations.push(violation);
      metrics.violation = violation;
      metrics.success = false;
    }

    this.metrics.push(metrics);
    return metrics;
  }

  /**
   * Validate response based on endpoint and method
   */
  private validateEndpointResponse(
    endpoint: string,
    method: string,
    data: unknown,
    status: number
  ): { success: boolean; schemaName: string; violations: string[] } {
    // Handle error responses first
    if (status >= 400) {
      const validation = ContractValidator.validateErrorResponse(data);
      return {
        success: validation.success,
        schemaName: 'ErrorResponse',
        violations: validation.success ? [] : validation.violations,
      };
    }

    // Validate success responses based on endpoint
    if (endpoint.includes('/extractor/extract') && method === 'POST') {
      const validation = ContractValidator.validateExtractResponse(data);
      return {
        success: validation.success,
        schemaName: 'ExtractResponse',
        violations: validation.success ? [] : validation.violations,
      };
    }

    if (endpoint.includes('/extractor/results/') && method === 'GET') {
      const validation = ContractValidator.validateResultsResponse(data);
      return {
        success: validation.success,
        schemaName: 'ExtractorResultsResponse',
        violations: validation.success ? [] : validation.violations,
      };
    }

    if (endpoint.includes('/auth/session') && method === 'GET') {
      const validation = ContractValidator.validateSessionResponse(data);
      return {
        success: validation.success,
        schemaName: 'SessionResponse',
        violations: validation.success ? [] : validation.violations,
      };
    }

    if (endpoint.includes('/auth/status') && method === 'GET') {
      const validation = ContractValidator.validateAuthStatusResponse(data);
      return {
        success: validation.success,
        schemaName: 'AuthStatusResponse',
        violations: validation.success ? [] : validation.violations,
      };
    }

    if (endpoint.includes('/auth/refresh') && method === 'POST') {
      const validation = ContractValidator.validateTokenResponse(data);
      return {
        success: validation.success,
        schemaName: 'TokenResponse',
        violations: validation.success ? [] : validation.violations,
      };
    }

    // Unknown endpoint - assume success but log warning
    console.warn(`Unknown endpoint for contract validation: ${method} ${endpoint}`);
    return { success: true, schemaName: 'Unknown', violations: [] };
  }

  /**
   * Determine severity based on endpoint and violation type
   */
  private determineSeverity(
    endpoint: string,
    status: number,
    violations: string[]
  ): ContractViolation['severity'] {
    // Critical: Authentication failures, data corruption risks
    if (endpoint.includes('/auth/') && status === 401) { return 'critical'; }
    if (violations.some(v => v.includes('batch_id') || v.includes('user_id'))) { return 'critical'; }
    if (violations.some(v => v.includes('uuid') || v.includes('format'))) { return 'high'; }

    // High: Core functionality breaking changes
    if (endpoint.includes('/extractor/')) {
      if (violations.some(v => v.includes('status') || v.includes('results'))) { return 'high'; }
    }

    // Medium: Non-breaking but important issues
    if (violations.some(v => v.includes('confidence') || v.includes('timestamp'))) { return 'medium'; }
    if (violations.length > 3) { return 'medium'; }

    // Low: Minor schema deviations
    return 'low';
  }

  /**
   * Determine impact description
   */
  private determineImpact(
    endpoint: string,
    status: number,
    violations: string[]
  ): string {
    if (endpoint.includes('/auth/')) {
      return 'Authentication flow may be compromised, affecting user security';
    }
    if (endpoint.includes('/extractor/extract')) {
      return 'File upload processing may fail or behave unexpectedly';
    }
    if (endpoint.includes('/extractor/results/')) {
      return 'Results display may be incorrect or incomplete';
    }
    if (violations.length > 5) {
      return 'Major schema deviation may cause application instability';
    }
    return 'Minor schema deviation with low impact on functionality';
  }

  /**
   * Get current compliance report
   */
  generateComplianceReport(): ComplianceReport {
    const totalRequests = this.metrics.length;
    const compliantRequests = this.metrics.filter(m => !m.violation).length;
    const complianceRate = totalRequests > 0 ? (compliantRequests / totalRequests) * 100 : 100;

    // Calculate endpoint statistics
    const endpointStats: Record<string, {
      total: number;
      compliant: number;
      violations: number;
      complianceRate: number;
    }> = {};

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = { total: 0, compliant: 0, violations: 0, complianceRate: 0 };
      }
      endpointStats[key].total++;
      if (!metric.violation) {
        endpointStats[key].compliant++;
      } else {
        endpointStats[key].violations++;
      }
    }

    // Calculate compliance rates for each endpoint
    for (const [key, stats] of Object.entries(endpointStats)) {
      stats.complianceRate = (stats.compliant / stats.total) * 100;
    }

    // Categorize violations by severity
    const summary = {
      criticalViolations: this.violations.filter(v => v.severity === 'critical').length,
      highViolations: this.violations.filter(v => v.severity === 'high').length,
      mediumViolations: this.violations.filter(v => v.severity === 'medium').length,
      lowViolations: this.violations.filter(v => v.severity === 'low').length,
    };

    return {
      generatedAt: new Date(),
      totalRequests,
      compliantRequests,
      violations: [...this.violations],
      complianceRate,
      endpointStats,
      summary,
    };
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: ContractViolation['severity']): ContractViolation[] {
    return this.violations.filter(v => v.severity === severity);
  }

  /**
   * Get violations by endpoint
   */
  getViolationsByEndpoint(endpoint: string): ContractViolation[] {
    return this.violations.filter(v => v.endpoint.includes(endpoint));
  }

  /**
   * Get recent violations (last N violations)
   */
  getRecentViolations(count: number = 10): ContractViolation[] {
    return this.violations.slice(-count);
  }

  /**
   * Clear all recorded violations and metrics
   */
  reset(): void {
    this.violations = [];
    this.metrics = [];
  }

  /**
   * Export violations for external analysis
   */
  exportViolations(): {
    violations: ContractViolation[];
    metrics: ApiCallMetrics[];
    summary: ComplianceReport;
  } {
    return {
      violations: [...this.violations],
      metrics: [...this.metrics],
      summary: this.generateComplianceReport(),
    };
  }
}

// Contract drift detection
export class ContractDriftDetector {
  private baselineReport: ComplianceReport | null = null;
  private currentReport: ComplianceReport | null = null;
  private driftThreshold: number = 5; // 5% compliance decrease threshold

  /**
   * Set baseline compliance report
   */
  setBaseline(report: ComplianceReport): void {
    this.baselineReport = report;
  }

  /**
   * Update current compliance report
   */
  updateCurrent(report: ComplianceReport): void {
    this.currentReport = report;
  }

  /**
   * Set drift detection threshold (percentage)
   */
  setDriftThreshold(threshold: number): void {
    this.driftThreshold = threshold;
  }

  /**
   * Detect contract drift by comparing current vs baseline
   */
  detectDrift(): {
    hasDrift: boolean;
    complianceChange: number;
    newViolations: ContractViolation[];
    endpointChanges: Record<string, {
      endpoint: string;
      baselineCompliance: number;
      currentCompliance: number;
      change: number;
      significant: boolean;
    }>;
    summary: string;
  } {
    if (!this.baselineReport || !this.currentReport) {
      return {
        hasDrift: false,
        complianceChange: 0,
        newViolations: [],
        endpointChanges: {},
        summary: 'Insufficient data for drift detection',
      };
    }

    const complianceChange = this.currentReport.complianceRate - this.baselineReport.complianceRate;
    const hasDrift = Math.abs(complianceChange) >= this.driftThreshold;

    // Find new violations
    const baselineViolationKeys = new Set(
      this.baselineReport.violations.map(v => `${v.endpoint}-${v.method}-${v.violations.join(',')}`)
    );
    const newViolations = this.currentReport.violations.filter(v => 
      !baselineViolationKeys.has(`${v.endpoint}-${v.method}-${v.violations.join(',')}`)
    );

    // Compare endpoint-specific changes
    const endpointChanges: Record<string, {
      endpoint: string;
      baselineCompliance: number;
      currentCompliance: number;
      change: number;
      significant: boolean;
    }> = {};

    for (const [endpoint, currentStats] of Object.entries(this.currentReport.endpointStats)) {
      const baselineStats = this.baselineReport.endpointStats[endpoint];
      if (baselineStats) {
        const change = currentStats.complianceRate - baselineStats.complianceRate;
        endpointChanges[endpoint] = {
          endpoint,
          baselineCompliance: baselineStats.complianceRate,
          currentCompliance: currentStats.complianceRate,
          change,
          significant: Math.abs(change) >= this.driftThreshold,
        };
      }
    }

    // Generate summary
    let summary = `Compliance ${complianceChange >= 0 ? 'improved' : 'degraded'} by ${Math.abs(complianceChange).toFixed(2)}%`;
    if (hasDrift) {
      summary += ` (exceeds ${this.driftThreshold}% threshold)`;
    }
    if (newViolations.length > 0) {
      summary += `. ${newViolations.length} new violations detected`;
    }

    return {
      hasDrift,
      complianceChange,
      newViolations,
      endpointChanges,
      summary,
    };
  }
}

// Global compliance monitor instance
export const complianceMonitor = new ContractComplianceMonitor();
export const driftDetector = new ContractDriftDetector();

// Utility functions for integration with fetch interceptors
export const createComplianceInterceptor = (monitor: ContractComplianceMonitor) => {
  return async (
    url: string,
    options: RequestInit = {},
    originalFetch: typeof fetch = fetch
  ): Promise<Response> => {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    try {
      const response = await originalFetch(url, options);
      const responseTime = Date.now() - startTime;
      
      // Clone response to read data without consuming the stream
      const clonedResponse = response.clone();
      let responseData: unknown = null;
      
      try {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await clonedResponse.json();
        } else {
          responseData = await clonedResponse.text();
        }
      } catch (error) {
        console.warn('Failed to parse response for compliance monitoring:', error);
      }

      // Record the API call
      monitor.recordApiCall(
        url,
        method,
        response,
        responseData,
        responseTime,
        response.headers.get('X-Request-ID') || undefined
      );

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed request
      const mockResponse = new Response(null, { status: 0, statusText: 'Network Error' });
      monitor.recordApiCall(url, method, mockResponse, { error: String(error) }, responseTime);
      
      throw error;
    }
  };
};

// Export types and utilities for external usage