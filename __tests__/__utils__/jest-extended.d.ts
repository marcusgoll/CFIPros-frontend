// __tests__/__utils__/jest-extended.d.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidFile(): R;
      toHaveValidationError(field: string): R;
      toBeSecureResponse(): R;
    }
  }
}

export {};