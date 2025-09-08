/**
 * Test Data Management Infrastructure for CFIPros Integration Tests
 * Handles fixture files, dynamic test data generation, and cleanup
 * Based on environment-specific testing requirements
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { Environment, getCurrentEnvironment } from '../config/environments';

export interface TestFile {
  name: string;
  path: string;
  type: 'pdf' | 'image' | 'executable' | 'malicious';
  size: number;
  content?: Buffer;
}

export interface TestBatch {
  id: string;
  files: TestFile[];
  environment: Environment;
  cleanup: boolean;
  createdAt: Date;
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  clerkId: string;
  organizationId?: string;
  role: 'student' | 'cfi' | 'admin';
}

/**
 * Test Data Manager for fixture files and dynamic test data
 */
export class TestDataManager {
  private static instance: TestDataManager;
  private fixturesPath: string;
  private activeBatches: Map<string, TestBatch> = new Map();
  private testUsers: Map<string, TestUser> = new Map();

  private constructor() {
    this.fixturesPath = resolve(__dirname);
  }

  public static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  /**
   * Get valid test files for upload testing
   */
  public async getValidTestFiles(): Promise<TestFile[]> {
    const validFilesPath = join(this.fixturesPath, 'files', 'valid');
    const files: TestFile[] = [];

    try {
      const fileNames = await fs.readdir(validFilesPath);
      
      for (const fileName of fileNames) {
        const filePath = join(validFilesPath, fileName);
        const stats = await fs.stat(filePath);
        
        files.push({
          name: fileName,
          path: filePath,
          type: this.determineFileType(fileName),
          size: stats.size,
        });
      }
    } catch (error) {
      console.warn(`Failed to load valid test files: ${error}`);
    }

    return files;
  }

  /**
   * Get malicious test files for security testing
   */
  public async getMaliciousTestFiles(): Promise<TestFile[]> {
    const maliciousFilesPath = join(this.fixturesPath, 'files', 'malicious');
    const files: TestFile[] = [];

    try {
      const fileNames = await fs.readdir(maliciousFilesPath);
      
      for (const fileName of fileNames) {
        const filePath = join(maliciousFilesPath, fileName);
        const stats = await fs.stat(filePath);
        
        files.push({
          name: fileName,
          path: filePath,
          type: 'malicious',
          size: stats.size,
        });
      }
    } catch (error) {
      console.warn(`Failed to load malicious test files: ${error}`);
    }

    return files;
  }

  /**
   * Create a test batch with specified number of files
   */
  public async createTestBatch(
    fileCount: number,
    environment?: Environment,
    options?: {
      includeMalicious?: boolean;
      maxSize?: number;
      cleanup?: boolean;
    }
  ): Promise<TestBatch> {
    const env = environment || getCurrentEnvironment();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get appropriate files based on environment and options
    let availableFiles: TestFile[] = [];
    
    if (options?.includeMalicious) {
      availableFiles = await this.getMaliciousTestFiles();
    } else {
      availableFiles = await this.getValidTestFiles();
    }

    // Select files for the batch (limited to 30 per API contract)
    const maxFiles = Math.min(fileCount, 30);
    const selectedFiles = availableFiles.slice(0, maxFiles);

    // Filter by size if specified
    let filteredFiles = selectedFiles;
    if (options?.maxSize) {
      filteredFiles = selectedFiles.filter(file => file.size <= options.maxSize!);
    }

    const batch: TestBatch = {
      id: batchId,
      files: filteredFiles,
      environment: env,
      cleanup: options?.cleanup ?? (env !== 'local'),
      createdAt: new Date(),
    };

    this.activeBatches.set(batchId, batch);
    return batch;
  }

  /**
   * Generate dynamic test files for various scenarios
   */
  public async generateTestFile(
    type: 'pdf' | 'image' | 'large' | 'corrupted',
    size?: number
  ): Promise<TestFile> {
    const fileName = `generated_${type}_${Date.now()}.${this.getFileExtension(type)}`;
    const tempPath = join(this.fixturesPath, 'temp', fileName);
    
    let content: Buffer;
    
    switch (type) {
      case 'pdf':
        content = this.generatePDFContent(size);
        break;
      case 'image':
        content = this.generateImageContent(size);
        break;
      case 'large':
        content = this.generateLargeFileContent(size || 100 * 1024 * 1024); // 100MB default
        break;
      case 'corrupted':
        content = this.generateCorruptedContent();
        break;
      default:
        throw new Error(`Unknown test file type: ${type}`);
    }

    // Ensure temp directory exists
    await fs.mkdir(join(this.fixturesPath, 'temp'), { recursive: true });
    
    // Write the generated file
    await fs.writeFile(tempPath, content);

    return {
      name: fileName,
      path: tempPath,
      type: type as any,
      size: content.length,
      content,
    };
  }

  /**
   * Create test user accounts for authentication testing
   */
  public createTestUser(
    role: 'student' | 'cfi' | 'admin',
    environment?: Environment
  ): TestUser {
    const env = environment || getCurrentEnvironment();
    const userId = `test_user_${role}_${Date.now()}`;
    
    const user: TestUser = {
      id: userId,
      username: `${role}-${env}-${Date.now()}`,
      email: `${role}-test-${Date.now()}@cfipros-testing.com`,
      clerkId: `user_test_${userId}`,
      role,
    };

    // Add organization for CFI and admin users
    if (role === 'cfi' || role === 'admin') {
      user.organizationId = `org_test_${role}_${Date.now()}`;
    }

    this.testUsers.set(userId, user);
    return user;
  }

  /**
   * Get test user by ID
   */
  public getTestUser(userId: string): TestUser | undefined {
    return this.testUsers.get(userId);
  }

  /**
   * Get all test users by role
   */
  public getTestUsersByRole(role: 'student' | 'cfi' | 'admin'): TestUser[] {
    return Array.from(this.testUsers.values()).filter(user => user.role === role);
  }

  /**
   * Clean up test data based on environment settings
   */
  public async cleanupTestData(batchId?: string): Promise<void> {
    if (batchId) {
      await this.cleanupBatch(batchId);
    } else {
      // Clean up all batches that require cleanup
      for (const [id, batch] of this.activeBatches) {
        if (batch.cleanup) {
          await this.cleanupBatch(id);
        }
      }
    }

    // Clean up temporary files
    await this.cleanupTempFiles();
    
    // Clear test users (they're in memory only)
    this.testUsers.clear();
  }

  /**
   * Get batch by ID
   */
  public getBatch(batchId: string): TestBatch | undefined {
    return this.activeBatches.get(batchId);
  }

  /**
   * Get all active batches
   */
  public getActiveBatches(): TestBatch[] {
    return Array.from(this.activeBatches.values());
  }

  /**
   * Create large batch for load testing (up to 30 files per API contract)
   */
  public async createLargeBatch(environment?: Environment): Promise<TestBatch> {
    return this.createTestBatch(30, environment, { cleanup: true });
  }

  /**
   * Create security test batch with malicious files
   */
  public async createSecurityTestBatch(environment?: Environment): Promise<TestBatch> {
    return this.createTestBatch(5, environment, { 
      includeMalicious: true, 
      cleanup: true 
    });
  }

  // Private helper methods

  private determineFileType(fileName: string): TestFile['type'] {
    const ext = fileName.toLowerCase().split('.').pop();
    
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return 'image';
      case 'exe':
      case 'bat':
      case 'sh':
        return 'executable';
      default:
        return 'pdf'; // Default assumption
    }
  }

  private getFileExtension(type: string): string {
    switch (type) {
      case 'pdf':
        return 'pdf';
      case 'image':
        return 'jpg';
      case 'large':
        return 'pdf';
      case 'corrupted':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  private generatePDFContent(size?: number): Buffer {
    const targetSize = size || 1024; // 1KB default
    const baseContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${Math.max(50, targetSize - 200)}
>>
stream
BT
/F1 12 Tf
50 750 Td
(Generated Test PDF Content) Tj
`;

    // Pad with additional content to reach target size
    const padding = 'A'.repeat(Math.max(0, targetSize - baseContent.length - 50));
    
    const fullContent = baseContent + padding + `
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${baseContent.length + padding.length}
%%EOF`;

    return Buffer.from(fullContent);
  }

  private generateImageContent(size?: number): Buffer {
    // Generate a simple bitmap-like structure
    const targetSize = size || 1024;
    const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
    const padding = Buffer.alloc(Math.max(0, targetSize - header.length));
    return Buffer.concat([header, padding]);
  }

  private generateLargeFileContent(size: number): Buffer {
    return Buffer.alloc(size, 0x41); // Fill with 'A' characters
  }

  private generateCorruptedContent(): Buffer {
    // Generate content that looks like a PDF but has corrupted structure
    return Buffer.from('%PDF-1.4\nCorrupted content that should fail parsing\n%%EOF');
  }

  private async cleanupBatch(batchId: string): Promise<void> {
    const batch = this.activeBatches.get(batchId);
    if (!batch) return;

    // Clean up generated files (but not fixtures)
    for (const file of batch.files) {
      if (file.path.includes('temp') || file.path.includes('generated')) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.warn(`Failed to delete test file ${file.path}: ${error}`);
        }
      }
    }

    this.activeBatches.delete(batchId);
  }

  private async cleanupTempFiles(): Promise<void> {
    const tempPath = join(this.fixturesPath, 'temp');
    
    try {
      const files = await fs.readdir(tempPath);
      
      for (const file of files) {
        await fs.unlink(join(tempPath, file));
      }
      
      await fs.rmdir(tempPath);
    } catch (error) {
      // Temp directory may not exist, which is fine
    }
  }
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();

/**
 * Helper functions for common test data operations
 */

/**
 * Get a single valid test file
 */
export async function getSampleFile(type: 'aktr' | 'lesson' = 'aktr'): Promise<TestFile> {
  const files = await testDataManager.getValidTestFiles();
  const fileName = type === 'aktr' ? 'sample-aktr-report.pdf' : 'sample-lesson-plan.pdf';
  
  const file = files.find(f => f.name === fileName);
  if (!file) {
    throw new Error(`Sample ${type} file not found`);
  }
  
  return file;
}

/**
 * Create a test user for the current environment
 */
export function createTestUser(role: 'student' | 'cfi' | 'admin' = 'student'): TestUser {
  return testDataManager.createTestUser(role);
}

/**
 * Clean up all test data
 */
export async function cleanupAllTestData(): Promise<void> {
  await testDataManager.cleanupTestData();
}

/**
 * Create a standard test batch
 */
export async function createStandardTestBatch(fileCount = 3): Promise<TestBatch> {
  return testDataManager.createTestBatch(fileCount);
}