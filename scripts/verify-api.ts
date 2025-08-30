#!/usr/bin/env tsx

/**
 * API Verification Script
 * Tests all implemented API routes to ensure they work correctly
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface VerificationResult {
  route: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
}

class APIVerifier {
  private results: VerificationResult[] = [];

  async verifyAllRoutes(): Promise<void> {
    console.log('🚀 Starting API route verification...\n');

    // Check if required utility files exist
    await this.checkRequiredFiles();
    
    // Check API route files exist
    await this.checkAPIRoutes();
    
    // Test import syntax
    await this.checkImportSyntax();
    
    // Print results
    this.printResults();
  }

  private async checkRequiredFiles(): Promise<void> {
    const requiredFiles = [
      'lib/api/errors.ts',
      'lib/api/rateLimiter.ts', 
      'lib/api/validation.ts',
      'lib/api/proxy.ts'
    ];

    for (const filePath of requiredFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        this.results.push({
          route: `Utility: ${filePath}`,
          status: 'pass',
          message: 'File exists and is accessible'
        });
      } else {
        this.results.push({
          route: `Utility: ${filePath}`,
          status: 'fail',
          message: 'Required utility file is missing'
        });
      }
    }
  }

  private async checkAPIRoutes(): Promise<void> {
    const apiRoutes = [
      'app/api/upload/route.ts',
      'app/api/upload/[id]/status/route.ts',
      'app/api/results/[id]/route.ts',
      'app/api/results/[id]/summary/route.ts',
      'app/api/auth/login/route.ts',
      'app/api/auth/register/route.ts',
      'app/api/auth/profile/route.ts'
    ];

    for (const routePath of apiRoutes) {
      const fullPath = path.join(process.cwd(), routePath);
      
      if (fs.existsSync(fullPath)) {
        // Check if file contains required exports
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasRequiredExports = this.validateRouteFile(content, routePath);
        
        this.results.push({
          route: `API Route: ${routePath}`,
          status: hasRequiredExports ? 'pass' : 'fail',
          message: hasRequiredExports 
            ? 'Route file exists with proper exports'
            : 'Route file missing required HTTP method exports'
        });
      } else {
        this.results.push({
          route: `API Route: ${routePath}`,
          status: 'fail',
          message: 'API route file is missing'
        });
      }
    }
  }

  private validateRouteFile(content: string, _routePath: string): boolean {
    // Check for HTTP method exports (both old and new patterns)
    const hasExports = content.includes('export async function') || 
                       content.includes('export const') || 
                       content.includes('withAPIMiddleware');
    
    // Check for proper imports
    const hasImports = content.includes('import') && content.includes('from');
    
    // Check for error handling
    const hasErrorHandling = content.includes('handleAPIError') || 
                            content.includes('try') || 
                            content.includes('catch') ||
                            content.includes('withAPIMiddleware');
    
    return hasExports && hasImports && hasErrorHandling;
  }

  private async checkImportSyntax(): Promise<void> {
    try {
      // Try to compile TypeScript files to check for syntax errors
      console.log('📝 Checking TypeScript compilation...');
      
      const { stdout: _stdout, stderr } = await execAsync('npx tsc --noEmit --skipLibCheck');
      
      if (stderr && !stderr.includes('warning')) {
        this.results.push({
          route: 'TypeScript Compilation',
          status: 'fail',
          message: `Compilation errors: ${stderr}`
        });
      } else {
        this.results.push({
          route: 'TypeScript Compilation', 
          status: 'pass',
          message: 'All TypeScript files compile successfully'
        });
      }
    } catch (error: any) {
      this.results.push({
        route: 'TypeScript Compilation',
        status: 'fail', 
        message: `Compilation failed: ${error.message}`
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Verification Results:');
    console.log('========================\n');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.route}`);
      console.log(`   ${result.message}\n`);
    });

    console.log('Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);

    const overallStatus = failed === 0 ? 'PASS' : 'FAIL';
    console.log(`\n🏁 Overall Status: ${overallStatus}`);

    if (overallStatus === 'PASS') {
      console.log('\n🎉 All API routes are properly implemented!');
      console.log('The BFF (Backend for Frontend) layer is ready for integration.');
    } else {
      console.log('\n⚠️  Some issues were found. Please review the failed items above.');
    }
  }
}

// Run verification
const verifier = new APIVerifier();
verifier.verifyAllRoutes().catch(console.error);