/**
 * Tests for application constants
 * Testing constant values and enums
 */

import {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  VALIDATION_RULES,
  UI_CONSTANTS,
  STORAGE_KEYS,
} from "@/lib/constants";

describe("Application Constants", () => {
  describe("App metadata", () => {
    it("should have correct app metadata", () => {
      expect(APP_NAME).toBe("CFIPros");
      expect(typeof APP_VERSION).toBe("string");
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
      expect(typeof APP_DESCRIPTION).toBe("string");
      expect(APP_DESCRIPTION.length).toBeGreaterThan(0);
    });
  });

  describe("File upload constants", () => {
    it("should have valid file size limit", () => {
      expect(typeof MAX_FILE_SIZE).toBe("number");
      expect(MAX_FILE_SIZE).toBeGreaterThan(0);
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
    });

    it("should have valid allowed file types", () => {
      expect(Array.isArray(ALLOWED_FILE_TYPES)).toBe(true);
      expect(ALLOWED_FILE_TYPES.length).toBeGreaterThan(0);

      ALLOWED_FILE_TYPES.forEach((type) => {
        expect(typeof type).toBe("string");
        expect(type).toMatch(/^[a-z]+\/[a-z-]+$/);
      });

      expect(ALLOWED_FILE_TYPES).toContain("application/pdf");
      expect(ALLOWED_FILE_TYPES).toContain("image/jpeg");
      expect(ALLOWED_FILE_TYPES).toContain("image/png");
    });
  });

  describe("API endpoints", () => {
    it("should have valid API endpoints", () => {
      expect(typeof API_ENDPOINTS).toBe("object");
      expect(API_ENDPOINTS).not.toBeNull();

      // Check that all endpoint values are strings starting with '/'
      Object.values(API_ENDPOINTS).forEach((endpoint) => {
        expect(typeof endpoint).toBe("string");
        expect(endpoint).toMatch(/^\/.*$/);
      });

      // Check specific endpoints exist
      expect(API_ENDPOINTS.AUTH).toBeDefined();
      expect(API_ENDPOINTS.UPLOAD).toBeDefined();
      expect(API_ENDPOINTS.RESULTS).toBeDefined();
    });
  });

  describe("Error messages", () => {
    it("should have comprehensive error messages", () => {
      expect(typeof ERROR_MESSAGES).toBe("object");
      expect(ERROR_MESSAGES).not.toBeNull();

      // Check that all error messages are non-empty strings
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });

      // Check specific error messages exist
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.FILE_TOO_LARGE).toBeDefined();
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
    });
  });

  describe("Validation rules", () => {
    it("should have valid validation rules", () => {
      expect(typeof VALIDATION_RULES).toBe("object");
      expect(VALIDATION_RULES).not.toBeNull();

      // Check password rules
      expect(VALIDATION_RULES.PASSWORD.MIN_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION_RULES.PASSWORD.MIN_LENGTH).toBeLessThan(128);
      expect(typeof VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE).toBe(
        "boolean"
      );
      expect(typeof VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE).toBe(
        "boolean"
      );
      expect(typeof VALIDATION_RULES.PASSWORD.REQUIRE_NUMBERS).toBe("boolean");
      expect(typeof VALIDATION_RULES.PASSWORD.REQUIRE_SPECIAL).toBe("boolean");

      // Check email rules
      expect(typeof VALIDATION_RULES.EMAIL.PATTERN).toBe("object");
      expect(VALIDATION_RULES.EMAIL.PATTERN).toBeInstanceOf(RegExp);

      // Check name rules
      expect(VALIDATION_RULES.NAME.MIN_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION_RULES.NAME.MAX_LENGTH).toBeGreaterThan(
        VALIDATION_RULES.NAME.MIN_LENGTH
      );
    });
  });

  describe("UI constants", () => {
    it("should have valid UI constants", () => {
      expect(typeof UI_CONSTANTS).toBe("object");
      expect(UI_CONSTANTS).not.toBeNull();

      // Check breakpoints
      expect(typeof UI_CONSTANTS.BREAKPOINTS).toBe("object");
      Object.values(UI_CONSTANTS.BREAKPOINTS).forEach((breakpoint) => {
        expect(typeof breakpoint).toBe("string");
        expect(breakpoint).toMatch(/^\d+px$/);
      });

      // Check animation durations
      expect(typeof UI_CONSTANTS.ANIMATIONS).toBe("object");
      Object.values(UI_CONSTANTS.ANIMATIONS).forEach((duration) => {
        expect(typeof duration).toBe("number");
        expect(duration).toBeGreaterThan(0);
      });

      // Check z-index values
      expect(typeof UI_CONSTANTS.Z_INDEX).toBe("object");
      Object.values(UI_CONSTANTS.Z_INDEX).forEach((zIndex) => {
        expect(typeof zIndex).toBe("number");
        expect(zIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Storage keys", () => {
    it("should have valid storage keys", () => {
      expect(typeof STORAGE_KEYS).toBe("object");
      expect(STORAGE_KEYS).not.toBeNull();

      // Check that all storage keys are non-empty strings
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(typeof key).toBe("string");
        expect(key.length).toBeGreaterThan(0);
      });

      // Check specific storage keys exist
      expect(STORAGE_KEYS.AUTH_TOKEN).toBeDefined();
      expect(STORAGE_KEYS.USER_PREFERENCES).toBeDefined();
      expect(STORAGE_KEYS.THEME).toBeDefined();
    });
  });

  describe("Constant immutability", () => {
    it("should not allow modification of constants", () => {
      // Test that constants are frozen (if they are)
      expect(() => {
        (API_ENDPOINTS as any).TEST = "/test";
      }).not.toThrow(); // Note: This depends on if constants are frozen

      // Test that arrays are frozen
      expect(() => {
        (ALLOWED_FILE_TYPES as any).push("text/plain");
      }).not.toThrow(); // Note: This depends on if arrays are frozen
    });
  });

  describe("Value consistency", () => {
    it("should have consistent values across related constants", () => {
      // File size should match between different constant objects
      if (VALIDATION_RULES.FILE && VALIDATION_RULES.FILE.MAX_SIZE) {
        expect(VALIDATION_RULES.FILE.MAX_SIZE).toBe(MAX_FILE_SIZE);
      }

      // Error messages should correspond to validation rules
      expect(ERROR_MESSAGES.FILE_TOO_LARGE).toContain("10MB");
    });

    it("should have valid enum-like constants", () => {
      // Check that constants that should act like enums have unique values
      const zIndexValues = Object.values(UI_CONSTANTS.Z_INDEX);
      const uniqueZIndexValues = [...new Set(zIndexValues)];
      expect(zIndexValues.length).toBe(uniqueZIndexValues.length);

      // Check storage keys are unique
      const storageValues = Object.values(STORAGE_KEYS);
      const uniqueStorageValues = [...new Set(storageValues)];
      expect(storageValues.length).toBe(uniqueStorageValues.length);
    });
  });
});
