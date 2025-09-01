/**
 * Zod validation schemas for form validation
 * Provides type-safe form validation with user-friendly error messages
 */

import { z } from "zod";

// Common validation helpers
const requiredString = (message?: string) =>
  z.string().min(1, message || "This field is required");

const email = z.string().email("Please enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

// Authentication schemas
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    firstName: requiredString("First name is required"),
    lastName: requiredString("Last name is required"),
    email,
    password,
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
    token: requiredString("Reset token is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Profile schemas
export const profileSchema = z.object({
  firstName: requiredString("First name is required"),
  lastName: requiredString("Last name is required"),
  email,
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  location: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: requiredString("Current password is required"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// File upload schemas
export const fileUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one file is required")
    .max(10, "Maximum 10 files allowed")
    .refine((files) => files.every((file) => file.size <= 10 * 1024 * 1024), {
      message: "Each file must be less than 10MB",
    })
    .refine(
      (files) =>
        files.every((file) =>
          ["image/jpeg", "image/png", "image/gif", "application/pdf"].includes(
            file.type
          )
        ),
      {
        message: "Only JPEG, PNG, GIF, and PDF files are allowed",
      }
    ),
  description: z
    .string()
    .max(255, "Description must be less than 255 characters")
    .optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
});

// AKTR to ACS specific file upload schema
export const aktrFileUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one knowledge test report is required")
    .max(5, "Maximum 5 files allowed")
    .refine((files) => files.every((file) => file.size <= 10 * 1024 * 1024), {
      message: "Each file must be less than 10MB",
    })
    .refine(
      (files) =>
        files.every((file) =>
          ["application/pdf", "image/jpeg", "image/png"].includes(file.type)
        ),
      {
        message: "Only PDF, JPG, and PNG files are allowed",
      }
    ),
});

// Contact form schema
export const contactSchema = z.object({
  name: requiredString("Name is required"),
  email,
  subject: requiredString("Subject is required"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
  category: z.enum(["general", "support", "billing", "feedback"], {
    errorMap: () => ({ message: "Please select a category" }),
  }),
});

// Search schema
export const searchSchema = z.object({
  query: requiredString("Search query is required"),
  filters: z
    .object({
      category: z.string().optional(),
      dateRange: z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
        .optional(),
      tags: z.array(z.string()).optional(),
      sortBy: z.enum(["relevance", "date", "title"]).default("relevance"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email,
  preferences: z
    .object({
      weekly: z.boolean().default(true),
      monthly: z.boolean().default(false),
      announcements: z.boolean().default(true),
    })
    .optional(),
});

// Comment schema
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters"),
  parentId: z.string().optional(), // For nested comments
});

// Rating schema
export const ratingSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  review: z
    .string()
    .max(1000, "Review must be less than 1000 characters")
    .optional(),
});

// Settings schema
export const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
    sms: z.boolean().default(false),
  }),
  privacy: z.object({
    profilePublic: z.boolean().default(true),
    showEmail: z.boolean().default(false),
    allowMessages: z.boolean().default(true),
  }),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    language: z.string().default("en"),
    timezone: z.string().default("UTC"),
  }),
});

// Export types for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type AktrFileUploadFormData = z.infer<typeof aktrFileUploadSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type NewsletterFormData = z.infer<typeof newsletterSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type RatingFormData = z.infer<typeof ratingSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;

// Form validation helper
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _root: "An unexpected validation error occurred" },
    };
  }
}
