/**
 * Tests for Zod validation schemas
 * Testing form validation logic and error messages
 */

import {
  loginSchema,
  registerSchema,
  contactSchema,
  profileSchema,
  fileUploadSchema,
  validateForm,
} from "@/lib/validation/schemas";

describe("loginSchema", () => {
  it("should validate correct login data", () => {
    const validData = {
      email: "test@example.com",
      password: "password123",
      rememberMe: true,
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const invalidData = {
      email: "invalid-email",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Please enter a valid email address"
      );
    }
  });

  it("should reject empty password", () => {
    const invalidData = {
      email: "test@example.com",
      password: "",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password is required");
    }
  });

  it("should allow optional rememberMe field", () => {
    const validData = {
      email: "test@example.com",
      password: "password123",
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  const validRegistrationData = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    terms: true,
  };

  it("should validate correct registration data", () => {
    const result = registerSchema.safeParse(validRegistrationData);
    expect(result.success).toBe(true);
  });

  it("should reject weak password", () => {
    const invalidData = {
      ...validRegistrationData,
      password: "weak",
      confirmPassword: "weak",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.errors.find(
        (err) =>
          err.path.includes("password") && !err.path.includes("confirmPassword")
      );
      expect(passwordError?.message).toContain(
        "Password must be at least 8 characters"
      );
    }
  });

  it("should reject password without uppercase letter", () => {
    const invalidData = {
      ...validRegistrationData,
      password: "password123",
      confirmPassword: "password123",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.errors.find(
        (err) =>
          err.path.includes("password") && !err.path.includes("confirmPassword")
      );
      expect(passwordError?.message).toContain("uppercase letter");
    }
  });

  it("should reject mismatched passwords", () => {
    const invalidData = {
      ...validRegistrationData,
      confirmPassword: "DifferentPassword123!",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordError = result.error.errors.find((err) =>
        err.path.includes("confirmPassword")
      );
      expect(confirmPasswordError?.message).toBe("Passwords do not match");
    }
  });

  it("should reject if terms not accepted", () => {
    const invalidData = {
      ...validRegistrationData,
      terms: false,
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const termsError = result.error.errors.find((err) =>
        err.path.includes("terms")
      );
      expect(termsError?.message).toBe(
        "You must accept the terms and conditions"
      );
    }
  });

  it("should require all fields", () => {
    const invalidData = {
      email: "test@example.com",
      password: "Password123!",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("contactSchema", () => {
  const validContactData = {
    name: "John Doe",
    email: "john@example.com",
    subject: "Question about services",
    message:
      "I have a question about your services and would like more information.",
    category: "general" as const,
  };

  it("should validate correct contact data", () => {
    const result = contactSchema.safeParse(validContactData);
    expect(result.success).toBe(true);
  });

  it("should reject short message", () => {
    const invalidData = {
      ...validContactData,
      message: "Short",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messageError = result.error.errors.find((err) =>
        err.path.includes("message")
      );
      expect(messageError?.message).toBe(
        "Message must be at least 10 characters"
      );
    }
  });

  it("should reject long message", () => {
    const invalidData = {
      ...validContactData,
      message: "a".repeat(1001),
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messageError = result.error.errors.find((err) =>
        err.path.includes("message")
      );
      expect(messageError?.message).toBe(
        "Message must be less than 1000 characters"
      );
    }
  });

  it("should reject invalid category", () => {
    const invalidData = {
      ...validContactData,
      category: "invalid-category",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should require all fields", () => {
    const invalidData = {
      email: "test@example.com",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  const validProfileData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    bio: "Software developer with 5 years of experience.",
    website: "https://johndoe.com",
    location: "San Francisco, CA",
  };

  it("should validate correct profile data", () => {
    const result = profileSchema.safeParse(validProfileData);
    expect(result.success).toBe(true);
  });

  it("should allow empty optional fields", () => {
    const minimalData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    };

    const result = profileSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid website URL", () => {
    const invalidData = {
      ...validProfileData,
      website: "not-a-url",
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const websiteError = result.error.errors.find((err) =>
        err.path.includes("website")
      );
      expect(websiteError?.message).toBe("Please enter a valid URL");
    }
  });

  it("should allow empty website field", () => {
    const validData = {
      ...validProfileData,
      website: "",
    };

    const result = profileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject long bio", () => {
    const invalidData = {
      ...validProfileData,
      bio: "a".repeat(501),
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const bioError = result.error.errors.find((err) =>
        err.path.includes("bio")
      );
      expect(bioError?.message).toBe("Bio must be less than 500 characters");
    }
  });
});

describe("fileUploadSchema", () => {
  // Mock File objects for testing
  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File(["content"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("should validate correct file upload data", () => {
    const validData = {
      files: [
        createMockFile("test.jpg", "image/jpeg", 1024 * 1024), // 1MB
        createMockFile("document.pdf", "application/pdf", 2 * 1024 * 1024), // 2MB
      ],
      description: "Test files",
      tags: ["test", "upload"],
    };

    const result = fileUploadSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject empty file array", () => {
    const invalidData = {
      files: [],
      description: "No files",
    };

    const result = fileUploadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const filesError = result.error.errors.find((err) =>
        err.path.includes("files")
      );
      expect(filesError?.message).toBe("At least one file is required");
    }
  });

  it("should reject too many files", () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      createMockFile(`test${i}.jpg`, "image/jpeg", 1024)
    );

    const invalidData = { files };

    const result = fileUploadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const filesError = result.error.errors.find((err) =>
        err.path.includes("files")
      );
      expect(filesError?.message).toBe("Maximum 10 files allowed");
    }
  });

  it("should reject files that are too large", () => {
    const invalidData = {
      files: [createMockFile("large.jpg", "image/jpeg", 11 * 1024 * 1024)], // 11MB
    };

    const result = fileUploadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const filesError = result.error.errors.find((err) =>
        err.path.includes("files")
      );
      expect(filesError?.message).toBe("Each file must be less than 10MB");
    }
  });

  it("should reject unsupported file types", () => {
    const invalidData = {
      files: [createMockFile("test.txt", "text/plain", 1024)],
    };

    const result = fileUploadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const filesError = result.error.errors.find((err) =>
        err.path.includes("files")
      );
      expect(filesError?.message).toBe(
        "Only JPEG, PNG, GIF, and PDF files are allowed"
      );
    }
  });
});

describe("validateForm utility", () => {
  it("should return success for valid data", () => {
    const validData = {
      email: "test@example.com",
      password: "password123",
    };

    const result = validateForm(loginSchema, validData);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validData);
    expect(result.errors).toBeUndefined();
  });

  it("should return errors for invalid data", () => {
    const invalidData = {
      email: "invalid-email",
      password: "",
    };

    const result = validateForm(loginSchema, invalidData);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
  });

  it("should handle unexpected errors gracefully", () => {
    const result = validateForm(loginSchema, null);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();

    // Check that we get validation errors for null input
    if (result.errors) {
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    }
  });
});
