/**
 * Application constants
 * Centralized location for all application-wide constants
 */

// App metadata (for tests)
export const APP_NAME = 'CFIPros' as const;
export const APP_VERSION = '1.0.0' as const;
export const APP_DESCRIPTION = 'CFI Training Platform for aviation certification and training services' as const;

// Legacy app config (keep for backward compatibility)
export const APP_CONFIG = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
  supportEmail: "support@cfipros.com",
} as const;

export const API_CONFIG = {
  baseUrl: process.env["API_BASE_URL"] || "https://api.cfipros.com/v1",
  timeout: parseInt(process.env["API_TIMEOUT"] || "30000"),
} as const;

// File upload constants (for tests)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

// Legacy file config (keep for backward compatibility)
export const FILE_CONFIG = {
  maxFileSize: 25 * 1024 * 1024, // 25MB
  allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
} as const;

// API endpoints (for tests)
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  UPLOAD: '/api/upload',
  RESULTS: '/api/results',
  USERS: '/api/users',
  PROFILE: '/api/profile',
  SETTINGS: '/api/settings',
} as const;

export const ROUTES = {
  // Public routes
  home: "/",
  acs: "/acs",
  upload: "/upload",
  about: "/about",
  help: "/help",
  contact: "/contact",
  
  // Auth routes
  login: "/auth/login",
  register: "/auth/register",
  resetPassword: "/auth/reset-password",
  
  // Protected routes
  dashboard: "/dashboard",
  lessons: "/lesson",
  studyPlans: "/study-plan",
  settings: "/settings",
  analytics: "/analytics",
} as const;

// Error messages (for tests)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  INVALID_FILE_TYPE: 'File type is not supported. Please upload a PDF, JPEG, PNG, or WebP file.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

// Validation rules (for tests)
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  FILE: {
    MAX_SIZE: MAX_FILE_SIZE,
    ALLOWED_TYPES: ALLOWED_FILE_TYPES,
  },
} as const;

// UI constants (for tests)
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 1000,
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },
} as const;

// Legacy validation (keep for backward compatibility)
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

// Storage keys (updated for tests)
export const STORAGE_KEYS = {
  AUTH_TOKEN: "cfipros_auth_token",
  USER_PREFERENCES: "cfipros_user_preferences",
  THEME: "cfipros_theme",
  // Legacy keys (keep for backward compatibility)
  authToken: "cfipros_auth_token",
  userPreferences: "cfipros_user_prefs",
  uploadProgress: "cfipros_upload_progress",
} as const;
