/**
 * Comprehensive tests for Zod validation schemas
 * Tests all validation rules, error scenarios, and edge cases
 * Part of Task 2.3: Form Validation Testing
 */

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
  changePasswordSchema,
  fileUploadSchema,
  aktrFileUploadSchema,
  contactSchema,
  searchSchema,
  newsletterSchema,
  commentSchema,
  ratingSchema,
  settingsSchema,
  validateForm,
  type LoginFormData,
  type RegisterFormData,
  type ContactFormData,
  type FileUploadFormData,
  type AktrFileUploadFormData,
} from "@/lib/validation/schemas";
import { z } from "zod";

// Mock File constructor for Node.js environment
global.File = class MockFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;

  constructor(bits: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.type = options.type || "";
    this.size = options.size || 0;
    this.lastModified = options.lastModified || Date.now();
  }
} as any;

describe("Zod Validation Schemas", () => {
  describe("loginSchema", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "password123",
      rememberMe: false,
    };

    it("should validate valid login data", () => {
      const result = loginSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validLoginData);
      }
    });

    it("should require email field", () => {
      const result = loginSchema.safeParse({ password: "password123" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("email");
        expect(result.error.errors[0].message).toContain("Required");
      }
    });

    it("should validate email format", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should require password field", () => {
      const result = loginSchema.safeParse({ email: "test@example.com" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password is required");
      }
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password is required");
      }
    });

    it("should handle optional rememberMe field", () => {
      const withRememberMe = loginSchema.safeParse({
        ...validLoginData,
        rememberMe: true,
      });
      const withoutRememberMe = loginSchema.safeParse({
        email: validLoginData.email,
        password: validLoginData.password,
      });

      expect(withRememberMe.success).toBe(true);
      expect(withoutRememberMe.success).toBe(true);
    });

    it("should infer correct TypeScript types", () => {
      const data: LoginFormData = {
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      };
      expect(data.email).toEqual(expect.any(String));
      expect(data.password).toEqual(expect.any(String));
      expect(typeof data.rememberMe).toBe("boolean");
    });
  });

  describe("registerSchema", () => {
    const validRegisterData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      terms: true,
    };

    it("should validate valid registration data", () => {
      const result = registerSchema.safeParse(validRegisterData);
      expect(result.success).toBe(true);
    });

    it("should require all mandatory fields", () => {
      const result = registerSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors).toHaveLength(5); // firstName, lastName, email, password, terms
        expect(errors.some(e => e.path[0] === "firstName")).toBe(true);
        expect(errors.some(e => e.path[0] === "lastName")).toBe(true);
        expect(errors.some(e => e.path[0] === "email")).toBe(true);
        expect(errors.some(e => e.path[0] === "password")).toBe(true);
        expect(errors.some(e => e.path[0] === "terms")).toBe(true);
      }
    });

    it("should validate password complexity", () => {
      const weakPasswords = [
        "weak", // too short
        "weakpassword", // no uppercase, no number
        "WEAKPASSWORD", // no lowercase, no number
        "WeakPassword", // no number
        "weak123", // too short but has requirements
      ];

      weakPasswords.forEach(password => {
        const result = registerSchema.safeParse({
          ...validRegisterData,
          password,
          confirmPassword: password,
        });
        expect(result.success).toBe(false);
      });
    });

    it("should validate password confirmation match", () => {
      const result = registerSchema.safeParse({
        ...validRegisterData,
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Passwords do not match");
        expect(result.error.errors[0].path).toContain("confirmPassword");
      }
    });

    it("should require terms acceptance", () => {
      const result = registerSchema.safeParse({
        ...validRegisterData,
        terms: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("You must accept the terms and conditions");
      }
    });

    it("should validate email format in registration", () => {
      const result = registerSchema.safeParse({
        ...validRegisterData,
        email: "invalid.email",
      });
      expect(result.success).toBe(false);
    });

    it("should trim and validate names", () => {
      const result = registerSchema.safeParse({
        ...validRegisterData,
        firstName: "",
        lastName: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === "First name is required")).toBe(true);
        expect(result.error.errors.some(e => e.message === "Last name is required")).toBe(true);
      }
    });
  });

  describe("fileUploadSchema", () => {
    const createMockFile = (
      name: string,
      type: string,
      size: number
    ): File => {
      return new File(["content"], name, { type, size } as any);
    };

    const validFileUploadData = {
      files: [createMockFile("test.pdf", "application/pdf", 1024 * 1024)], // 1MB
      description: "Test file upload",
      tags: ["test", "document"],
    };

    it("should validate valid file upload data", () => {
      const result = fileUploadSchema.safeParse(validFileUploadData);
      expect(result.success).toBe(true);
    });

    it("should require at least one file", () => {
      const result = fileUploadSchema.safeParse({ files: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least one file is required");
      }
    });

    it("should enforce maximum file count", () => {
      const files = Array.from({ length: 11 }, (_, i) =>
        createMockFile(`test${i}.pdf`, "application/pdf", 1024)
      );
      const result = fileUploadSchema.safeParse({ files });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Maximum 10 files allowed");
      }
    });

    it("should enforce file size limits", () => {
      const files = [createMockFile("large.pdf", "application/pdf", 11 * 1024 * 1024)]; // 11MB
      const result = fileUploadSchema.safeParse({ files });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Each file must be less than 10MB");
      }
    });

    it("should enforce allowed file types", () => {
      const files = [createMockFile("test.exe", "application/exe", 1024)];
      const result = fileUploadSchema.safeParse({ files });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Only JPEG, PNG, GIF, and PDF files are allowed");
      }
    });

    it("should validate description length", () => {
      const longDescription = "a".repeat(256);
      const result = fileUploadSchema.safeParse({
        ...validFileUploadData,
        description: longDescription,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Description must be less than 255 characters");
      }
    });

    it("should enforce tag limits", () => {
      const manyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      const result = fileUploadSchema.safeParse({
        ...validFileUploadData,
        tags: manyTags,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Maximum 10 tags allowed");
      }
    });

    it("should accept optional fields", () => {
      const result = fileUploadSchema.safeParse({
        files: validFileUploadData.files,
      });
      expect(result.success).toBe(true);
    });

    it("should validate all allowed file types", () => {
      const allowedTypes = [
        { type: "image/jpeg", ext: ".jpg" },
        { type: "image/png", ext: ".png" },
        { type: "image/gif", ext: ".gif" },
        { type: "application/pdf", ext: ".pdf" },
      ];

      allowedTypes.forEach(({ type, ext }) => {
        const files = [createMockFile(`test${ext}`, type, 1024)];
        const result = fileUploadSchema.safeParse({ files });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("aktrFileUploadSchema", () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      return new File(["content"], name, { type, size } as any);
    };

    const validAktrData = {
      files: [createMockFile("aktr.pdf", "application/pdf", 1024 * 1024)],
    };

    it("should validate valid AKTR file upload", () => {
      const result = aktrFileUploadSchema.safeParse(validAktrData);
      expect(result.success).toBe(true);
    });

    it("should require at least one knowledge test report", () => {
      const result = aktrFileUploadSchema.safeParse({ files: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least one knowledge test report is required");
      }
    });

    it("should enforce maximum 5 files for AKTR", () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`aktr${i}.pdf`, "application/pdf", 1024)
      );
      const result = aktrFileUploadSchema.safeParse({ files });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Maximum 5 files allowed");
      }
    });

    it("should enforce AKTR-specific file types", () => {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      const disallowedTypes = ["image/gif", "text/plain", "application/msword"];

      allowedTypes.forEach(type => {
        const files = [createMockFile("aktr.ext", type, 1024)];
        const result = aktrFileUploadSchema.safeParse({ files });
        expect(result.success).toBe(true);
      });

      disallowedTypes.forEach(type => {
        const files = [createMockFile("aktr.ext", type, 1024)];
        const result = aktrFileUploadSchema.safeParse({ files });
        expect(result.success).toBe(false);
      });
    });

    it("should enforce file size limits for AKTR files", () => {
      const files = [createMockFile("large-aktr.pdf", "application/pdf", 11 * 1024 * 1024)];
      const result = aktrFileUploadSchema.safeParse({ files });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Each file must be less than 10MB");
      }
    });
  });

  describe("contactSchema", () => {
    const validContactData = {
      name: "John Doe",
      email: "john@example.com",
      subject: "Test Subject",
      message: "This is a test message with enough characters.",
      category: "general" as const,
    };

    it("should validate valid contact form data", () => {
      const result = contactSchema.safeParse(validContactData);
      expect(result.success).toBe(true);
    });

    it("should require all fields", () => {
      const result = contactSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors.length).toBeGreaterThanOrEqual(4);
      }
    });

    it("should enforce message length requirements", () => {
      const shortMessage = contactSchema.safeParse({
        ...validContactData,
        message: "Short",
      });
      expect(shortMessage.success).toBe(false);
      if (!shortMessage.success) {
        expect(shortMessage.error.errors[0].message).toBe("Message must be at least 10 characters");
      }

      const longMessage = contactSchema.safeParse({
        ...validContactData,
        message: "a".repeat(1001),
      });
      expect(longMessage.success).toBe(false);
      if (!longMessage.success) {
        expect(longMessage.error.errors[0].message).toBe("Message must be less than 1000 characters");
      }
    });

    it("should validate category enum", () => {
      const validCategories = ["general", "support", "billing", "feedback"];
      const invalidCategory = "invalid-category";

      validCategories.forEach(category => {
        const result = contactSchema.safeParse({
          ...validContactData,
          category,
        });
        expect(result.success).toBe(true);
      });

      const result = contactSchema.safeParse({
        ...validContactData,
        category: invalidCategory,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please select a category");
      }
    });

    it("should validate email format in contact form", () => {
      const result = contactSchema.safeParse({
        ...validContactData,
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should validate exact message length boundaries", () => {
      const exactMin = contactSchema.safeParse({
        ...validContactData,
        message: "1234567890", // exactly 10 characters
      });
      expect(exactMin.success).toBe(true);

      const exactMax = contactSchema.safeParse({
        ...validContactData,
        message: "a".repeat(1000), // exactly 1000 characters
      });
      expect(exactMax.success).toBe(true);
    });
  });

  describe("searchSchema", () => {
    it("should validate basic search query", () => {
      const result = searchSchema.safeParse({ query: "test query" });
      expect(result.success).toBe(true);
    });

    it("should require query field", () => {
      const result = searchSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Search query is required");
      }
    });

    it("should handle optional filters with defaults", () => {
      const result = searchSchema.safeParse({
        query: "test",
        filters: {
          sortBy: "date",
          sortOrder: "asc",
        },
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.filters) {
        expect(result.data.filters.sortBy).toBe("date");
        expect(result.data.filters.sortOrder).toBe("asc");
      }
    });

    it("should validate date range filters", () => {
      const result = searchSchema.safeParse({
        query: "test",
        filters: {
          dateRange: {
            from: new Date("2023-01-01"),
            to: new Date("2023-12-31"),
          },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("profileSchema", () => {
    const validProfileData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      bio: "Test bio",
      website: "https://example.com",
      location: "Test City",
    };

    it("should validate complete profile data", () => {
      const result = profileSchema.safeParse(validProfileData);
      expect(result.success).toBe(true);
    });

    it("should require mandatory fields only", () => {
      const minimalData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };
      const result = profileSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should validate bio length", () => {
      const result = profileSchema.safeParse({
        ...validProfileData,
        bio: "a".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Bio must be less than 500 characters");
      }
    });

    it("should validate website URL format", () => {
      const invalidUrl = profileSchema.safeParse({
        ...validProfileData,
        website: "not-a-url",
      });
      expect(invalidUrl.success).toBe(false);

      const validUrl = profileSchema.safeParse({
        ...validProfileData,
        website: "https://valid-url.com",
      });
      expect(validUrl.success).toBe(true);

      const emptyUrl = profileSchema.safeParse({
        ...validProfileData,
        website: "",
      });
      expect(emptyUrl.success).toBe(true);
    });
  });

  describe("settingsSchema", () => {
    it("should validate complete settings with defaults", () => {
      const result = settingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notifications.email).toBe(true);
        expect(result.data.privacy.profilePublic).toBe(true);
        expect(result.data.preferences.theme).toBe("system");
      }
    });

    it("should accept custom settings", () => {
      const customSettings = {
        notifications: { email: false, push: true, sms: true },
        privacy: { profilePublic: false, showEmail: true, allowMessages: false },
        preferences: { theme: "dark" as const, language: "es", timezone: "PST" },
      };
      const result = settingsSchema.safeParse(customSettings);
      expect(result.success).toBe(true);
    });

    it("should validate theme enum", () => {
      const validThemes = ["light", "dark", "system"];
      const invalidTheme = "invalid-theme";

      validThemes.forEach(theme => {
        const result = settingsSchema.safeParse({
          preferences: { theme },
        });
        expect(result.success).toBe(true);
      });

      const result = settingsSchema.safeParse({
        preferences: { theme: invalidTheme },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("commentSchema", () => {
    it("should validate valid comment", () => {
      const result = commentSchema.safeParse({
        content: "This is a valid comment.",
      });
      expect(result.success).toBe(true);
    });

    it("should require content", () => {
      const result = commentSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Comment cannot be empty");
      }
    });

    it("should enforce content length limit", () => {
      const result = commentSchema.safeParse({
        content: "a".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Comment must be less than 500 characters");
      }
    });

    it("should accept optional parent ID for nested comments", () => {
      const result = commentSchema.safeParse({
        content: "Reply comment",
        parentId: "parent-123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ratingSchema", () => {
    it("should validate valid rating", () => {
      const result = ratingSchema.safeParse({
        rating: 4,
        review: "Great product!",
      });
      expect(result.success).toBe(true);
    });

    it("should enforce rating boundaries", () => {
      const tooLow = ratingSchema.safeParse({ rating: 0 });
      const tooHigh = ratingSchema.safeParse({ rating: 6 });
      const justRight = ratingSchema.safeParse({ rating: 3 });

      expect(tooLow.success).toBe(false);
      expect(tooHigh.success).toBe(false);
      expect(justRight.success).toBe(true);

      if (!tooLow.success) {
        expect(tooLow.error.errors[0].message).toBe("Rating must be at least 1 star");
      }
      if (!tooHigh.success) {
        expect(tooHigh.error.errors[0].message).toBe("Rating cannot exceed 5 stars");
      }
    });

    it("should accept optional review", () => {
      const withoutReview = ratingSchema.safeParse({ rating: 5 });
      const withReview = ratingSchema.safeParse({
        rating: 5,
        review: "Excellent!",
      });

      expect(withoutReview.success).toBe(true);
      expect(withReview.success).toBe(true);
    });

    it("should enforce review length limit", () => {
      const result = ratingSchema.safeParse({
        rating: 5,
        review: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Review must be less than 1000 characters");
      }
    });
  });

  describe("Schema composition and refinements", () => {
    it("should handle password confirmation refinement", () => {
      const matchingPasswords = resetPasswordSchema.safeParse({
        password: "Password123",
        confirmPassword: "Password123",
        token: "reset-token",
      });
      expect(matchingPasswords.success).toBe(true);

      const nonMatchingPasswords = resetPasswordSchema.safeParse({
        password: "Password123",
        confirmPassword: "Different123",
        token: "reset-token",
      });
      expect(nonMatchingPasswords.success).toBe(false);
    });

    it("should handle nested object validation", () => {
      const result = settingsSchema.safeParse({
        notifications: { email: true, push: "invalid" }, // invalid boolean
      });
      expect(result.success).toBe(false);
    });

    it("should handle array validation", () => {
      const result = searchSchema.safeParse({
        query: "test",
        filters: { tags: ["tag1", "tag2", "tag3"] },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("validateForm helper function", () => {
    it("should return success for valid data", () => {
      const result = validateForm(loginSchema, {
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("should return errors for invalid data", () => {
      const result = validateForm(loginSchema, {
        email: "invalid-email",
        password: "",
      });
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(result.errors.email).toBeDefined();
        expect(result.errors.password).toBeDefined();
      }
    });

    it("should handle unexpected errors", () => {
      const invalidSchema = z.object({
        test: z.string().refine(() => {
          throw new Error("Unexpected error");
        }),
      });

      const result = validateForm(invalidSchema, { test: "value" });
      expect(result.success).toBe(false);
      expect(result.errors?._root).toBe("An unexpected validation error occurred");
    });

    it("should format error paths correctly", () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1, "Name is required"),
          }),
        }),
      });

      const result = validateForm(nestedSchema, {
        user: { profile: { name: "" } },
      });
      expect(result.success).toBe(false);
      if (result.errors) {
        expect(result.errors["user.profile.name"]).toBe("Name is required");
      }
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle null and undefined values", () => {
      const result1 = validateForm(loginSchema, null);
      const result2 = validateForm(loginSchema, undefined);
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it("should handle empty objects", () => {
      const result = validateForm(contactSchema, {});
      expect(result.success).toBe(false);
      expect(Object.keys(result.errors || {})).toHaveLength(5);
    });

    it("should handle extra properties", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        extraField: "should be ignored",
      });
      expect(result.success).toBe(true);
    });

    it("should validate exact boundary values", () => {
      // File size exactly at limit
      const exactSizeFile = new File(["x".repeat(10 * 1024 * 1024)], "test.pdf", {
        type: "application/pdf",
      } as any);
      const result = fileUploadSchema.safeParse({
        files: [exactSizeFile],
      });
      expect(result.success).toBe(true);
    });

    it("should handle special characters in strings", () => {
      const specialChars = "äöüß中文🚀";
      const result = contactSchema.safeParse({
        name: specialChars,
        email: "test@example.com",
        subject: specialChars,
        message: specialChars.repeat(5), // Make it long enough
        category: "general",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Error message formatting", () => {
    it("should provide user-friendly error messages", () => {
      const result = registerSchema.safeParse({
        firstName: "",
        lastName: "",
        email: "invalid",
        password: "weak",
        confirmPassword: "different",
        terms: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map(e => e.message);
        expect(messages).toContain("First name is required");
        expect(messages).toContain("Last name is required");
        expect(messages).toContain("Please enter a valid email address");
        expect(messages.some(m => m.includes("Password must be at least 8 characters"))).toBe(true);
        expect(messages).toContain("You must accept the terms and conditions");
      }
    });

    it("should provide specific file validation messages", () => {
      const oversizedFile = new File(["content"], "huge.pdf", {
        type: "application/pdf",
        size: 11 * 1024 * 1024,
      } as any);

      const result = fileUploadSchema.safeParse({
        files: [oversizedFile],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Each file must be less than 10MB");
      }
    });
  });

  describe("Additional schema tests", () => {
    describe("forgotPasswordSchema", () => {
      it("should validate email for password reset", () => {
        const result = forgotPasswordSchema.safeParse({
          email: "user@example.com",
        });
        expect(result.success).toBe(true);
      });

      it("should require valid email", () => {
        const result = forgotPasswordSchema.safeParse({
          email: "invalid-email",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("changePasswordSchema", () => {
      it("should validate password change with matching new passwords", () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
          confirmPassword: "NewPassword123",
        });
        expect(result.success).toBe(true);
      });

      it("should reject non-matching new passwords", () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
          confirmPassword: "DifferentPassword123",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe("Passwords do not match");
        }
      });
    });

    describe("newsletterSchema", () => {
      it("should validate newsletter subscription", () => {
        const result = newsletterSchema.safeParse({
          email: "subscriber@example.com",
          preferences: {
            weekly: true,
            monthly: false,
            announcements: true,
          },
        });
        expect(result.success).toBe(true);
      });

      it("should work with minimal data", () => {
        const result = newsletterSchema.safeParse({
          email: "subscriber@example.com",
        });
        expect(result.success).toBe(true);
      });
    });
  });
});