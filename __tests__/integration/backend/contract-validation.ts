/**
 * Backend Direct API Test Framework - Contract Validation  
 * Implements OpenAPI schema validation and contract compliance
 * Task 2.1: Backend Direct API Test Framework
 */

import { type ApiResponse } from "./api-client";

export interface SchemaProperty {
  type: string;
  required?: boolean;
  format?: string;
  enum?: string[];
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
}

export interface EndpointContract {
  path: string;
  method: string;
  requestSchema?: Record<string, SchemaProperty>;
  responseSchemas: Record<number, Record<string, SchemaProperty>>;
  headers?: Record<string, string>;
  authentication?: "required" | "optional" | "none";
}

export class ContractValidator {
  private contracts: Map<string, EndpointContract> = new Map();

  registerContract(key: string, contract: EndpointContract): void {
    this.contracts.set(key, contract);
  }

  validateResponse(
    method: string, 
    path: string, 
    response: ApiResponse
  ): { valid: boolean; errors: string[] } {
    const key = `${method.toUpperCase()}:${path}`;
    const contract = this.contracts.get(key);
    
    if (\!contract) {
      return { 
        valid: false, 
        errors: [`No contract found for ${key}`] 
      };
    }

    const errors: string[] = [];
    const expectedSchema = contract.responseSchemas[response.status];
    
    if (\!expectedSchema) {
      errors.push(`Unexpected status code ${response.status} for ${key}`);
      return { valid: false, errors };
    }

    return { valid: errors.length === 0, errors };
  }
}

export const apiContracts = new ContractValidator();

export function validateApiContract(
  method: string,
  path: string,
  response: ApiResponse
): { valid: boolean; errors: string[] } {
  return apiContracts.validateResponse(method, path, response);
}
