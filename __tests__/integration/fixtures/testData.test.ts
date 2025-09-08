/**
 * Contract Tests for Test Data Management Infrastructure
 * Validates fixture files, test data generation, and cleanup functionality
 */

import './testData.setup'; // Set up environment variables
import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  testDataManager, 
  TestDataManager, 
  getSampleFile, 
  createTestUser, 
  createStandardTestBatch,
  cleanupAllTestData,
  TestFile,
  TestBatch,
  TestUser
} from './testData';

describe('Test Data Management Infrastructure', () => {
  const fixturesPath = join(__dirname);

  beforeEach(async () => {
    // Clean up before each test to ensure isolation
    await testDataManager.cleanupTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await testDataManager.cleanupTestData();
  });

  describe('TestDataManager Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = TestDataManager.getInstance();
      const instance2 = TestDataManager.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(testDataManager);
    });
  });

  describe('Valid Test Files', () => {
    it('should load valid test files', async () => {
      const files = await testDataManager.getValidTestFiles();
      expect(Array.isArray(files)).toBe(true);
      
      // Should contain sample files
      const aktrFile = files.find(f => f.name === 'sample-aktr-report.pdf');
      const lessonFile = files.find(f => f.name === 'sample-lesson-plan.pdf');
      
      expect(aktrFile).toBeDefined();
      expect(lessonFile).toBeDefined();
      
      // Validate file structure
      if (aktrFile) {
        expect(aktrFile.type).toBe('pdf');
        expect(aktrFile.size).toBeGreaterThan(0);
        expect(aktrFile.path).toContain('valid');
      }
    });

    it('should handle missing valid files directory gracefully', async () => {
      // Create a temporary manager with non-existent path
      const tempManager = new (TestDataManager as any)();
      tempManager.fixturesPath = '/non/existent/path';
      
      const files = await tempManager.getValidTestFiles();
      expect(files).toEqual([]);
    });
  });

  describe('Malicious Test Files', () => {
    it('should load malicious test files for security testing', async () => {
      const files = await testDataManager.getMaliciousTestFiles();
      expect(Array.isArray(files)).toBe(true);
      
      // All files should be marked as malicious
      files.forEach(file => {
        expect(file.type).toBe('malicious');
        expect(file.size).toBeGreaterThan(0);
        expect(file.path).toContain('malicious');
      });
    });

    it('should handle missing malicious files directory gracefully', async () => {
      const tempManager = new (TestDataManager as any)();
      tempManager.fixturesPath = '/non/existent/path';
      
      const files = await tempManager.getMaliciousTestFiles();
      expect(files).toEqual([]);
    });
  });

  describe('Test Batch Creation', () => {
    it('should create test batch with specified file count', async () => {
      const batch = await testDataManager.createTestBatch(3);
      
      expect(batch).toBeDefined();
      expect(batch.id).toMatch(/^batch_\d+_[a-z0-9]+$/);
      expect(batch.files).toHaveLength(3);
      expect(typeof batch.environment).toBe('string');
      expect(batch.createdAt).toBeInstanceOf(Date);
      expect(typeof batch.cleanup).toBe('boolean');
    });

    it('should limit batch size to 30 files per API contract', async () => {
      const batch = await testDataManager.createTestBatch(50);
      expect(batch.files.length).toBeLessThanOrEqual(30);
    });

    it('should create batch with malicious files when requested', async () => {
      const batch = await testDataManager.createTestBatch(5, undefined, {
        includeMalicious: true,
        cleanup: true
      });
      
      // Should get all available malicious files (up to requested count)
      expect(batch.files.length).toBeGreaterThan(0);
      expect(batch.files.length).toBeLessThanOrEqual(5);
      batch.files.forEach(file => {
        expect(file.type).toBe('malicious');
      });
      expect(batch.cleanup).toBe(true);
    });

    it('should filter files by size when maxSize is specified', async () => {
      const batch = await testDataManager.createTestBatch(5, undefined, {
        maxSize: 500 // 500 byte limit to ensure small-test.pdf is included
      });
      
      batch.files.forEach(file => {
        expect(file.size).toBeLessThanOrEqual(500);
      });
      
      // Should only include the smallest files
      expect(batch.files.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Test File Generation', () => {
    it('should generate PDF test files', async () => {
      const file = await testDataManager.generateTestFile('pdf', 2048);
      
      expect(file.name).toMatch(/^generated_pdf_\d+\.pdf$/);
      expect(file.type).toBe('pdf');
      expect(file.size).toBeGreaterThan(0);
      expect(file.path).toContain('temp');
      expect(file.content).toBeInstanceOf(Buffer);
      
      // Verify file was written
      const exists = await fs.access(file.path).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should generate image test files', async () => {
      const file = await testDataManager.generateTestFile('image', 1024);
      
      expect(file.name).toMatch(/^generated_image_\d+\.jpg$/);
      expect(file.type).toBe('image');
      expect(file.size).toBeGreaterThan(0);
      expect(file.content).toBeInstanceOf(Buffer);
    });

    it('should generate large test files', async () => {
      const targetSize = 50 * 1024 * 1024; // 50MB
      const file = await testDataManager.generateTestFile('large', targetSize);
      
      expect(file.name).toMatch(/^generated_large_\d+\.pdf$/);
      expect(file.size).toBe(targetSize);
      expect(file.content?.length).toBe(targetSize);
    });

    it('should generate corrupted test files', async () => {
      const file = await testDataManager.generateTestFile('corrupted');
      
      expect(file.name).toMatch(/^generated_corrupted_\d+\.pdf$/);
      expect(file.type).toBe('corrupted');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should throw error for unknown file type', async () => {
      await expect(
        testDataManager.generateTestFile('unknown' as any)
      ).rejects.toThrow('Unknown test file type: unknown');
    });
  });

  describe('Test User Management', () => {
    it('should create test user with correct properties', () => {
      const user = testDataManager.createTestUser('student');
      
      expect(user.id).toMatch(/^test_user_student_\d+$/);
      expect(user.username).toMatch(/^student-\w+-\d+$/);
      expect(user.email).toMatch(/^student-test-\d+@cfipros-testing\.com$/);
      expect(user.clerkId).toMatch(/^user_test_test_user_student_\d+$/);
      expect(user.role).toBe('student');
      expect(user.organizationId).toBeUndefined();
    });

    it('should create CFI user with organization', () => {
      const user = testDataManager.createTestUser('cfi');
      
      expect(user.role).toBe('cfi');
      expect(user.organizationId).toMatch(/^org_test_cfi_\d+$/);
    });

    it('should create admin user with organization', () => {
      const user = testDataManager.createTestUser('admin');
      
      expect(user.role).toBe('admin');
      expect(user.organizationId).toMatch(/^org_test_admin_\d+$/);
    });

    it('should retrieve test user by ID', () => {
      const user = testDataManager.createTestUser('student');
      const retrieved = testDataManager.getTestUser(user.id);
      
      expect(retrieved).toEqual(user);
    });

    it('should return undefined for non-existent user', () => {
      const user = testDataManager.getTestUser('non-existent');
      expect(user).toBeUndefined();
    });

    it('should filter users by role', async () => {
      // Clear any existing users first
      await testDataManager.cleanupTestData();
      
      testDataManager.createTestUser('student');
      testDataManager.createTestUser('cfi');
      testDataManager.createTestUser('admin');
      testDataManager.createTestUser('student');
      
      const students = testDataManager.getTestUsersByRole('student');
      const cfis = testDataManager.getTestUsersByRole('cfi');
      const admins = testDataManager.getTestUsersByRole('admin');
      
      expect(students).toHaveLength(2);
      expect(cfis).toHaveLength(1);
      expect(admins).toHaveLength(1);
      
      students.forEach(user => expect(user.role).toBe('student'));
      cfis.forEach(user => expect(user.role).toBe('cfi'));
      admins.forEach(user => expect(user.role).toBe('admin'));
    });
  });

  describe('Batch Management', () => {
    it('should retrieve batch by ID', async () => {
      const batch = await testDataManager.createTestBatch(2);
      const retrieved = testDataManager.getBatch(batch.id);
      
      expect(retrieved).toEqual(batch);
    });

    it('should return undefined for non-existent batch', () => {
      const batch = testDataManager.getBatch('non-existent');
      expect(batch).toBeUndefined();
    });

    it('should list all active batches', async () => {
      // Clear existing batches first
      await testDataManager.cleanupTestData();
      
      const batch1 = await testDataManager.createTestBatch(1);
      const batch2 = await testDataManager.createTestBatch(2);
      
      const activeBatches = testDataManager.getActiveBatches();
      expect(activeBatches).toHaveLength(2);
      expect(activeBatches).toContain(batch1);
      expect(activeBatches).toContain(batch2);
    });

    it('should create large batch for load testing', async () => {
      const batch = await testDataManager.createLargeBatch();
      
      // Should get available files (up to 30 per API contract limit)  
      expect(batch.files.length).toBeGreaterThan(0);
      expect(batch.files.length).toBeLessThanOrEqual(30);
      expect(batch.cleanup).toBe(true);
    });

    it('should create security test batch', async () => {
      const batch = await testDataManager.createSecurityTestBatch();
      
      // Should get available malicious files (up to 5)
      expect(batch.files.length).toBeGreaterThan(0);
      expect(batch.files.length).toBeLessThanOrEqual(5);
      expect(batch.cleanup).toBe(true);
      batch.files.forEach(file => {
        expect(file.type).toBe('malicious');
      });
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup specific batch', async () => {
      const file = await testDataManager.generateTestFile('pdf');
      const batch = await testDataManager.createTestBatch(1);
      batch.files.push(file);
      
      // Verify file exists
      const existsBefore = await fs.access(file.path).then(() => true).catch(() => false);
      expect(existsBefore).toBe(true);
      
      await testDataManager.cleanupTestData(batch.id);
      
      // Batch should be removed
      expect(testDataManager.getBatch(batch.id)).toBeUndefined();
      
      // File should be deleted
      const existsAfter = await fs.access(file.path).then(() => true).catch(() => false);
      expect(existsAfter).toBe(false);
    });

    it('should cleanup all test data', async () => {
      // Clear any existing state first
      await testDataManager.cleanupTestData();
      
      const user = testDataManager.createTestUser('student');
      const file = await testDataManager.generateTestFile('image');
      await testDataManager.createTestBatch(1);
      
      // Verify data exists before cleanup
      expect(testDataManager.getActiveBatches().length).toBeGreaterThan(0);
      expect(testDataManager.getTestUser(user.id)).toBeDefined();
      
      await testDataManager.cleanupTestData();
      
      // All batches should be cleared
      expect(testDataManager.getActiveBatches()).toHaveLength(0);
      
      // Test users should be cleared
      expect(testDataManager.getTestUser(user.id)).toBeUndefined();
      
      // Generated file should be deleted
      const exists = await fs.access(file.path).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should only cleanup batches marked for cleanup', async () => {
      const cleanupBatch = await testDataManager.createTestBatch(1, 'staging', { cleanup: true });
      const keepBatch = await testDataManager.createTestBatch(1, 'local', { cleanup: false });
      
      await testDataManager.cleanupTestData();
      
      expect(testDataManager.getBatch(cleanupBatch.id)).toBeUndefined();
      expect(testDataManager.getBatch(keepBatch.id)).toBeDefined();
    });
  });

  describe('Helper Functions', () => {
    it('should get sample AKTR file', async () => {
      const file = await getSampleFile('aktr');
      
      expect(file.name).toBe('sample-aktr-report.pdf');
      expect(file.type).toBe('pdf');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should get sample lesson plan file', async () => {
      const file = await getSampleFile('lesson');
      
      expect(file.name).toBe('sample-lesson-plan.pdf');
      expect(file.type).toBe('pdf');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should throw error for missing sample file', async () => {
      // Mock empty file list
      const originalMethod = testDataManager.getValidTestFiles;
      testDataManager.getValidTestFiles = jest.fn().mockResolvedValue([]);
      
      await expect(getSampleFile('aktr')).rejects.toThrow('Sample aktr file not found');
      
      // Restore original method
      testDataManager.getValidTestFiles = originalMethod;
    });

    it('should create test user via helper function', () => {
      const user = createTestUser('cfi');
      expect(user.role).toBe('cfi');
    });

    it('should create standard test batch via helper function', async () => {
      const batch = await createStandardTestBatch(5);
      // Should get available files (up to requested count)
      expect(batch.files.length).toBeGreaterThan(0);
      expect(batch.files.length).toBeLessThanOrEqual(5);
    });

    it('should cleanup all test data via helper function', async () => {
      // Clear existing state first
      await testDataManager.cleanupTestData();
      
      await testDataManager.createTestBatch(1);
      testDataManager.createTestUser('student');
      
      // Verify data exists
      expect(testDataManager.getActiveBatches().length).toBeGreaterThan(0);
      
      await cleanupAllTestData();
      
      expect(testDataManager.getActiveBatches()).toHaveLength(0);
    });
  });

  describe('File Type Determination', () => {
    it('should correctly determine PDF file type', () => {
      const manager = testDataManager as any;
      expect(manager.determineFileType('document.pdf')).toBe('pdf');
      expect(manager.determineFileType('REPORT.PDF')).toBe('pdf');
    });

    it('should correctly determine image file types', () => {
      const manager = testDataManager as any;
      expect(manager.determineFileType('photo.jpg')).toBe('image');
      expect(manager.determineFileType('image.jpeg')).toBe('image');
      expect(manager.determineFileType('logo.png')).toBe('image');
      expect(manager.determineFileType('avatar.webp')).toBe('image');
    });

    it('should correctly determine executable file types', () => {
      const manager = testDataManager as any;
      expect(manager.determineFileType('program.exe')).toBe('executable');
      expect(manager.determineFileType('script.bat')).toBe('executable');
      expect(manager.determineFileType('install.sh')).toBe('executable');
    });

    it('should default to PDF for unknown extensions', () => {
      const manager = testDataManager as any;
      expect(manager.determineFileType('unknown.xyz')).toBe('pdf');
      expect(manager.determineFileType('noextension')).toBe('pdf');
    });
  });

  describe('File Extension Mapping', () => {
    it('should map file types to correct extensions', () => {
      const manager = testDataManager as any;
      expect(manager.getFileExtension('pdf')).toBe('pdf');
      expect(manager.getFileExtension('image')).toBe('jpg');
      expect(manager.getFileExtension('large')).toBe('pdf');
      expect(manager.getFileExtension('corrupted')).toBe('pdf');
      expect(manager.getFileExtension('unknown')).toBe('bin');
    });
  });
});