// Common types used throughout the application

export interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ACSCode {
  code: string;
  title: string;
  area: string;
  task: string;
  element?: string;
  description?: string;
  officialText?: string;
  summary?: string;
  commonPitfalls?: string[];
}

export interface UploadResult {
  reportId: string;
  processingTimeMs: number;
  confidence: "high" | "medium" | "low";
  examName?: string;
  score?: number;
  acsCode: {
    code: string;
    description: string;
    weakArea: boolean;
  }[];
  studyPlan?: {
    planId: string;
    estimatedStudyHours: number;
    priorityAreas: string[];
  };
}

export interface StudyPlan {
  planId: string;
  createdAt: string;
  status: "active" | "completed" | "paused";
  targetScore: number;
  currentScoreEstimate: number;
  estimatedCompletionWeeks: number;
  totalStudyHours: number;
  sections: StudyPlanSection[];
  effectivenessScore: number;
  completionPercentage: number;
}

export interface StudyPlanSection {
  sectionId: string;
  title: string;
  description: string;
  priority: number;
  estimatedHours: number;
  acsCodes: string[];
  resources: string[];
  milestones: {
    title: string;
    targetDate: string;
    completed?: boolean;
  }[];
  completed?: boolean;
}

export interface APIError {
  error: string;
  message: string;
  details?: string;
  validationErrors?: Record<string, string>;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  total: number;
  hasMore: boolean;
}

// Form types
export interface UploadFormData {
  files: File[];
  examType?: string;
  studentId?: string;
  notes?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  organization?: string;
  message: string;
}

export interface StudyPlanGenerationData {
  reportIds: string[];
  targetScore: number;
  studyHoursPerWeek: number;
  learningPreferences: {
    learningStyle: "visual" | "auditory" | "kinesthetic";
    difficultyPreference: "progressive" | "challenging";
  };
  deadline?: string;
}

// UI Component types
export interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number" | "tel";
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

// Utility types
export type LoadingState = "idle" | "loading" | "success" | "error";

export type SortOrder = "asc" | "desc";

export interface SortConfig {
  key: string;
  direction: SortOrder;
}

export interface FilterConfig {
  [key: string]: string | string[] | number | boolean;
}

// API specific types
export interface APIResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
  expires_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  terms_accepted: boolean;
  organization?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  organization?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailUpdates: boolean;
}

export interface RedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  setEx: (key: string, seconds: number, value: string) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface MockAPIClient {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  uploadFile: jest.Mock;
}

export interface RouteContext {
  params: Promise<{ [key: string]: string }>;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export interface BackendErrorResponse {
  error?: string;
  message?: string;
  detail?: string;
  status?: number;
}

export interface TestMockFunctions {
  [key: string]: jest.Mock;
}