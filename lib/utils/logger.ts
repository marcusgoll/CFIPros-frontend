/* eslint-disable no-console */
// Lightweight dev-only logger to avoid no-console lint warnings in production builds

export const isDev = process.env.NODE_ENV !== 'production';

export function logError(...args: unknown[]): void {
  if (isDev) {
    console.error(...args);
  }
}

export function logWarn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args);
  }
}

export function logInfo(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}
