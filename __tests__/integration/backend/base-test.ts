/**
 * Backend Direct API Test Framework - Base Test Classes
 * Provides common testing patterns for endpoint testing
 * Task 2.1: Backend Direct API Test Framework
 */

import { BackendApiClient, type ApiResponse } from './api-client';
import { getIntegrationConfig, type Environment } from '../config';

export interface ContractValidationOptions {
  validateSchema?: boolean;
  validateStatusCodes?: boolean;
  validateHeaders?: boolean;
  logResponses?: boolean;
}

export interface EndpointTestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth?: boolean;
  expectedStatus?: number[];
  contractValidation?: ContractValidationOptions;
}

export class BaseEndpointTest {
  protected apiClient: BackendApiClient;
  protected environment: string;
  protected config: any;

  constructor(environment?: Environment) {
    const integrationConfig = getIntegrationConfig(environment);
    this.apiClient = new BackendApiClient(environment);
    this.environment = integrationConfig.environment;
    this.config = integrationConfig.config;
  }

  async setupAuth(): Promise<void> {
    const testToken = process.env.INTEGRATION_TEST_AUTH_TOKEN;
    if (testToken) {
      this.apiClient.setAuthToken(testToken);
    }
  }

  async teardown(): Promise<void> {
    this.apiClient.clearAuth();
  }

  async testEndpointAccessible(config: EndpointTestConfig): Promise<ApiResponse> {
    const { endpoint, method, expectedStatus = [200, 201, 202, 204] } = config;
    
    console.log(`[Test] Testing ${method} ${endpoint} accessibility`);
    
    const response = await this.apiClient.request(endpoint, {
      method,
      expectStatus: expectedStatus,
    });

    expect(expectedStatus).toContain(response.status);
    return response;
  }

  async testContractCompliance(config: EndpointTestConfig, response: ApiResponse): Promise<void> {
    const validation = config.contractValidation || {};
    
    if (validation.validateStatusCodes !== false) {
      const expectedStatus = config.expectedStatus || [200, 201, 202, 204];
      expect(expectedStatus).toContain(response.status);
    }

    if (validation.validateHeaders !== false) {
      expect(response.headers).toHaveProperty('content-type');
    }

    if (validation.validateSchema !== false) {
      if (response.data && typeof response.data === 'object') {
        expect(response.data).toBeInstanceOf(Object);
        
        if (response.data.error) {
          expect(response.data).toHaveProperty('error');
          expect(typeof response.data.error).toBe('string');
          if (response.data.code) {
            expect(typeof response.data.code).toBe('string');
          }
        }
      }
    }
  }
}

export class FileUploadTestBase extends BaseEndpointTest {
  createTestFile(name: string, content: string, type: string = 'application/pdf'): File {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  }

  async testFileUpload(
    endpoint: string, 
    files: File[], 
    expectedStatus: number[] = [202]
  ): Promise<ApiResponse> {
    console.log(`[Test] Testing file upload to ${endpoint} with ${files.length} files`);
    
    const response = await this.apiClient.uploadFiles(endpoint, files, undefined, {
      expectStatus: expectedStatus,
    });

    expect(expectedStatus).toContain(response.status);
    
    if (response.status === 202) {
      expect(response.data).toHaveProperty('batch_id');
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('processing');
    }

    return response;
  }
}
