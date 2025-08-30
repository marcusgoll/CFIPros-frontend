import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, format?: { year?: string; month?: string; day?: string }): string {
  let dateObj: Date;
  if (typeof date === "string") {
    // Handle string dates with timezone consideration
    dateObj = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00');
  } else {
    dateObj = date;
  }
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }
  
  const formatOptions = format || {
    year: "numeric",
    month: "short", 
    day: "numeric",
  };
  
  return new Intl.DateTimeFormat("en-US", formatOptions as Intl.DateTimeFormatOptions).format(dateObj);
}

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second");
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
  }
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number, suffix = "..."): string {
  if (length <= 0) {
    return suffix;
  }
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length).trim() + suffix;
}

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  if (!text || !text.trim()) {
    return "";
  }
  
  return text
    .trim()
    // Normalize Unicode characters (converts café to cafe)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s.-]/g, "") // Remove non-word characters except spaces, dots, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[.-]+/g, "-") // Replace dots and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Check if a string is a valid email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // More strict email regex that rejects edge cases
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Additional checks for edge cases
  if (email.includes('..') || // No consecutive dots
      email.startsWith('.') || email.endsWith('.') || // No leading/trailing dots
      email.startsWith('@') || email.endsWith('@') || // No leading/trailing @
      email.indexOf('@') !== email.lastIndexOf('@') || // Only one @
      email.split('@')[1]?.startsWith('.') || // Domain can't start with dot
      email.split('@')[1]?.endsWith('.')) { // Domain can't end with dot
    return false;
  }
  
  return emailRegex.test(email);
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  
  // Format with appropriate decimal places
  const formatted = i === 0 ? value.toString() : value.toFixed(1);
  return `${formatted} ${sizes[i]}`;
}

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {return obj;}
  if (obj instanceof Date) {return new Date(obj.getTime()) as T;}
  if (obj instanceof Array) {return obj.map(item => deepClone(item)) as T;}
  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Generate a unique ID string
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get reduced motion variants for framer-motion
 */
export function getMotionVariants<T extends Record<string, unknown>>(
  normalVariants: T,
  reducedVariants?: Partial<T>
): T {
  if (!prefersReducedMotion()) {return normalVariants;}
  
  return {
    ...normalVariants,
    ...reducedVariants,
  };
}