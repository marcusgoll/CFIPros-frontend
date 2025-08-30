// Application constants

export const APP_CONFIG = {
  name: "CFIPros",
  description: "CFI Training Platform",
  url: process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
  supportEmail: "support@cfipros.com",
} as const;

export const API_CONFIG = {
  baseUrl: process.env["API_BASE_URL"] || "https://api.cfipros.com/v1",
  timeout: parseInt(process.env["API_TIMEOUT"] || "30000"),
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

export const FILE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
} as const;

export const STORAGE_KEYS = {
  authToken: "cfipros_auth_token",
  userPreferences: "cfipros_user_prefs",
  uploadProgress: "cfipros_upload_progress",
} as const;