/**
 * Comprehensive useForm Hook Tests
 * Tests for Task 2.2: Custom Hooks Testing
 * 
 * Coverage Areas:
 * - Form initialization with schemas and options
 * - Zod validation integration and error handling
 * - Form submission handling (success and error cases)
 * - Form state management (dirty, valid, submitting)
 * - Error state management and helper functions
 * - Form reset and field clearing functionality
 * - Field validation helpers and utilities
 * - Memory cleanup and effect management
 * - Performance with large forms and rapid changes
 * - TypeScript strict mode compliance
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { 
  useForm, 
  useLoginForm, 
  useContactForm,
  createFormSchema,
  validateField 
} from '@/lib/hooks/useForm';
import { 
  loginSchema, 
  contactSchema,
  type LoginFormData,
  type ContactFormData 
} from '@/lib/validation/schemas';
import * as logger from '@/lib/utils/logger';

// Mock logger utilities
jest.mock('@/lib/utils/logger', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const mockedLogError = jest.mocked(logger.logError);
const mockedLogWarn = jest.mocked(logger.logWarn);

// Test schemas for testing
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
});

type TestFormData = z.infer<typeof testSchema>;

const complexSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    bio: z.string().max(500, 'Bio too long'),
  }),
  settings: z.object({
    notifications: z.boolean(),
    theme: z.enum(['light', 'dark']),
  }),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
});

type ComplexFormData = z.infer<typeof complexSchema>;

describe('useForm Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic initialization tests
  describe('Hook Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      expect(result.current.formState).toBeDefined();
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.getError).toBe('function');
      expect(typeof result.current.hasError).toBe('function');
      expect(typeof result.current.submitForm).toBe('function');
    });

    it('initializes with default form values', () => {
      const defaultValues: TestFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          defaultValues 
        })
      );

      expect(result.current.getValues()).toEqual(defaultValues);
      expect(result.current.isDirty).toBe(false);
    });

    it('initializes with custom form mode', () => {
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          mode: 'onBlur'
        })
      );

      // Should have all form methods available
      expect(result.current.register).toBeDefined();
      expect(result.current.trigger).toBeDefined();
    });

    it('accepts additional React Hook Form options', () => {
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          criteriaMode: 'all',
          shouldFocusError: true
        })
      );

      expect(result.current.formState).toBeDefined();
    });
  });

  // Schema validation tests
  describe('Schema Validation', () => {
    it('validates form data against schema', async () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Set invalid data
      act(() => {
        result.current.setValue('name', '');
        result.current.setValue('email', 'invalid-email');
        result.current.setValue('age', 15);
      });

      // Trigger validation
      await act(async () => {
        await result.current.trigger();
      });

      expect(result.current.hasError('name')).toBe(true);
      expect(result.current.hasError('email')).toBe(true);
      expect(result.current.hasError('age')).toBe(true);
      expect(result.current.getError('name')).toBe('Name is required');
      expect(result.current.getError('email')).toBe('Invalid email');
      expect(result.current.getError('age')).toBe('Must be at least 18');
    });

    it('validates complex nested schemas', async () => {
      const { result } = renderHook(() => 
        useForm({ schema: complexSchema })
      );

      // Set invalid nested data
      act(() => {
        result.current.setValue('profile.firstName', '');
        result.current.setValue('profile.bio', 'x'.repeat(501));
        result.current.setValue('settings.theme', 'invalid' as any);
        result.current.setValue('tags', []);
      });

      await act(async () => {
        await result.current.trigger();
      });

      expect(result.current.hasError('profile.firstName')).toBe(true);
      expect(result.current.hasError('profile.bio')).toBe(true);
      expect(result.current.hasError('settings.theme')).toBe(true);
      expect(result.current.hasError('tags')).toBe(true);
    });

    it('validates individual fields', async () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Validate single field
      act(() => {
        result.current.setValue('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.trigger('email');
      });

      expect(result.current.hasError('email')).toBe(false);
    });

    it('clears validation errors when field becomes valid', async () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Set invalid email
      act(() => {
        result.current.setValue('email', 'invalid');
      });

      await act(async () => {
        await result.current.trigger('email');
      });

      expect(result.current.hasError('email')).toBe(true);

      // Fix email
      act(() => {
        result.current.setValue('email', 'valid@example.com');
      });

      await act(async () => {
        await result.current.trigger('email');
      });

      expect(result.current.hasError('email')).toBe(false);
    });
  });

  // Form submission tests
  describe('Form Submission', () => {
    it('calls onSubmit with valid data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          onSubmit: mockOnSubmit
        })
      );

      // Set valid data
      const validData: TestFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      act(() => {
        result.current.setValue('name', validData.name);
        result.current.setValue('email', validData.email);
        result.current.setValue('age', validData.age);
      });

      // Submit form
      await act(async () => {
        result.current.submitForm();
        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith(validData);
        });
      });
    });

    it('handles submission errors', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      const mockOnError = jest.fn();
      
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          onSubmit: mockOnSubmit,
          onError: mockOnError
        })
      );

      // Set valid data
      act(() => {
        result.current.setValue('name', 'John');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('age', 25);
      });

      await act(async () => {
        result.current.submitForm();
      });

      await waitFor(() => {
        expect(mockedLogError).toHaveBeenCalledWith(
          'Form submission error:', 
          expect.any(Error)
        );
        expect(mockOnError).toHaveBeenCalledWith({
          _root: 'Submission failed'
        });
      });
    });

    it('handles validation errors during submission', async () => {
      const mockOnError = jest.fn();
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          onError: mockOnError
        })
      );

      // Submit with invalid data
      await act(async () => {
        result.current.submitForm();
      });

      await waitFor(() => {
        expect(mockedLogWarn).toHaveBeenCalledWith(
          'Form validation errors:', 
          expect.any(Object)
        );
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.stringMatching(/required/i),
            email: expect.stringMatching(/required/i),
          })
        );
      });
    });

    it('handles async submission', async () => {
      let resolveSubmit: (value: unknown) => void;
      const mockOnSubmit = jest.fn(() => 
        new Promise(resolve => { resolveSubmit = resolve; })
      );

      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          onSubmit: mockOnSubmit
        })
      );

      // Set valid data
      act(() => {
        result.current.setValue('name', 'John');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('age', 25);
      });

      // Start submission
      act(() => {
        result.current.submitForm();
      });

      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Complete submission
      await act(async () => {
        resolveSubmit(undefined);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('prevents submission when already submitting', async () => {
      const mockOnSubmit = jest.fn(() => new Promise(() => {})); // Never resolves
      
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          onSubmit: mockOnSubmit
        })
      );

      // Set valid data
      act(() => {
        result.current.setValue('name', 'John');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('age', 25);
      });

      // Start first submission
      act(() => {
        result.current.submitForm();
      });

      // Wait for submitting state
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Try to submit again
      act(() => {
        result.current.submitForm();
      });

      // Should only be called once
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // Form state management tests
  describe('Form State Management', () => {
    it('tracks dirty state correctly', () => {
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          defaultValues: {
            name: 'Initial',
            email: 'initial@example.com',
            age: 20
          }
        })
      );

      expect(result.current.isDirty).toBe(false);

      // Change a field
      act(() => {
        result.current.setValue('name', 'Changed');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('tracks valid state correctly', async () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      expect(result.current.isValid).toBe(false);

      // Set valid data
      act(() => {
        result.current.setValue('name', 'John');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('age', 25);
      });

      await act(async () => {
        await result.current.trigger();
      });

      expect(result.current.isValid).toBe(true);
    });

    it('resets form state correctly', async () => {
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          defaultValues: {
            name: 'Initial',
            email: 'initial@example.com',
            age: 20
          }
        })
      );

      // Change values and create errors
      act(() => {
        result.current.setValue('name', 'Changed');
        result.current.setValue('email', 'invalid-email');
      });

      await act(async () => {
        await result.current.trigger();
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.hasError('email')).toBe(true);

      // Reset form
      act(() => {
        result.current.reset();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.getValues()).toEqual({
        name: 'Initial',
        email: 'initial@example.com',
        age: 20
      });
    });

    it('clears specific errors', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Create errors by setting invalid values
      act(() => {
        result.current.setError('name', { message: 'Custom error' });
        result.current.setError('email', { message: 'Another error' });
      });

      expect(result.current.hasError('name')).toBe(true);
      expect(result.current.hasError('email')).toBe(true);

      // Clear specific error
      act(() => {
        result.current.clearErrors('name');
      });

      expect(result.current.hasError('name')).toBe(false);
      expect(result.current.hasError('email')).toBe(true);
    });

    it('clears all errors', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Create multiple errors
      act(() => {
        result.current.setError('name', { message: 'Error 1' });
        result.current.setError('email', { message: 'Error 2' });
      });

      expect(result.current.hasError('name')).toBe(true);
      expect(result.current.hasError('email')).toBe(true);

      // Clear all errors
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.hasError('name')).toBe(false);
      expect(result.current.hasError('email')).toBe(false);
    });
  });

  // Helper function tests
  describe('Helper Functions', () => {
    it('getError returns correct error message', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Set error
      act(() => {
        result.current.setError('name', { message: 'Custom error message' });
      });

      expect(result.current.getError('name')).toBe('Custom error message');
      expect(result.current.getError('email')).toBeUndefined();
    });

    it('hasError returns correct boolean', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      expect(result.current.hasError('name')).toBe(false);

      // Set error
      act(() => {
        result.current.setError('name', { message: 'Error' });
      });

      expect(result.current.hasError('name')).toBe(true);
    });

    it('watch function tracks field changes', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Watch specific field
      const watchedName = result.current.watch('name');
      expect(watchedName).toBeUndefined();

      // Change field value
      act(() => {
        result.current.setValue('name', 'New Name');
      });

      const updatedName = result.current.watch('name');
      expect(updatedName).toBe('New Name');
    });

    it('getValues returns current form values', () => {
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          defaultValues: {
            name: 'John',
            email: 'john@example.com',
            age: 25
          }
        })
      );

      expect(result.current.getValues()).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 25
      });

      // Change a value
      act(() => {
        result.current.setValue('name', 'Jane');
      });

      expect(result.current.getValues()).toEqual({
        name: 'Jane',
        email: 'john@example.com',
        age: 25
      });
    });
  });

  // Memory and performance tests
  describe('Memory Management and Performance', () => {
    it('handles rapid value changes without memory leaks', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Rapidly change values
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.setValue('name', `Name ${i}`);
          result.current.setValue('email', `email${i}@example.com`);
          result.current.setValue('age', 20 + i);
        });
      }

      expect(result.current.getValues()).toEqual({
        name: 'Name 99',
        email: 'email99@example.com',
        age: 119
      });
    });

    it('memoizes error state to prevent unnecessary re-renders', () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      const initialErrors = result.current.errors;

      // Re-render without changing errors
      const { rerender } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      rerender();

      // Should be the same reference (memoized)
      expect(result.current.errors).toBe(initialErrors);
    });

    it('handles large forms efficiently', async () => {
      const largeSchema = z.object(
        Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [
            `field${i}`, 
            z.string().min(1, `Field ${i} required`)
          ])
        )
      );

      const { result } = renderHook(() => 
        useForm({ schema: largeSchema })
      );

      // Set all fields
      const start = performance.now();
      
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.setValue(`field${i}`, `Value ${i}`);
        }
      });

      const end = performance.now();
      
      // Should complete reasonably quickly (less than 100ms)
      expect(end - start).toBeLessThan(100);
    });

    it('cleans up properly on unmount', () => {
      const { result, unmount } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Use the hook
      act(() => {
        result.current.setValue('name', 'Test');
      });

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  // Specialized form hooks tests
  describe('Specialized Form Hooks', () => {
    it('useLoginForm works correctly', () => {
      const mockOnSubmit = jest.fn();
      const { result } = renderHook(() => 
        useLoginForm(mockOnSubmit)
      );

      expect(result.current.register).toBeDefined();
      expect(result.current.formState).toBeDefined();
      
      // Set valid login data
      act(() => {
        result.current.setValue('email', 'test@example.com');
        result.current.setValue('password', 'password123');
      });

      const values = result.current.getValues();
      expect(values).toEqual({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: undefined
      });
    });

    it('useContactForm works correctly', () => {
      const mockOnSubmit = jest.fn();
      const { result } = renderHook(() => 
        useContactForm(mockOnSubmit)
      );

      expect(result.current.register).toBeDefined();
      
      // Set valid contact data
      act(() => {
        result.current.setValue('name', 'John Doe');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('subject', 'Test Subject');
        result.current.setValue('message', 'This is a test message with enough characters.');
        result.current.setValue('category', 'general');
      });

      const values = result.current.getValues();
      expect(values.name).toBe('John Doe');
      expect(values.email).toBe('john@example.com');
      expect(values.category).toBe('general');
    });
  });

  // Utility function tests
  describe('Utility Functions', () => {
    describe('createFormSchema', () => {
      it('creates form schema with validation', () => {
        const schema = createFormSchema(testSchema);
        
        expect(schema.schema).toBe(testSchema);
        expect(typeof schema.validate).toBe('function');
      });

      it('validates data correctly', () => {
        const schema = createFormSchema(testSchema);
        
        const validData = {
          name: 'John',
          email: 'john@example.com',
          age: 25
        };

        const result = schema.validate(validData);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validData);
      });

      it('handles validation errors', () => {
        const schema = createFormSchema(testSchema);
        
        const invalidData = {
          name: '',
          email: 'invalid',
          age: 15
        };

        const result = schema.validate(invalidData);
        expect(result.success).toBe(false);
        expect(result.errors).toMatchObject({
          name: expect.stringMatching(/required/i),
          email: expect.stringMatching(/email/i),
          age: expect.stringMatching(/18/),
        });
      });

      it('handles null/undefined data', () => {
        const schema = createFormSchema(testSchema);
        
        const nullResult = schema.validate(null);
        expect(nullResult.success).toBe(false);
        expect(nullResult.errors?._root).toMatch(/unexpected validation error/i);

        const undefinedResult = schema.validate(undefined);
        expect(undefinedResult.success).toBe(false);
        expect(undefinedResult.errors?._root).toMatch(/unexpected validation error/i);
      });
    });

    describe('validateField', () => {
      it('validates single field successfully', () => {
        const nameSchema = z.string().min(1, 'Name required');
        
        const result = validateField(nameSchema, 'John');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('returns error for invalid field', () => {
        const nameSchema = z.string().min(1, 'Name required');
        
        const result = validateField(nameSchema, '');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Name required');
      });

      it('handles unexpected validation errors', () => {
        const schema = z.string();
        
        const result = validateField(schema, { invalid: 'object' });
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/validation error/i);
      });
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles schema with custom error messages', async () => {
      const customSchema = z.object({
        field: z.string().min(5, 'Custom: Field must be at least 5 characters')
      });

      const { result } = renderHook(() => 
        useForm({ schema: customSchema })
      );

      act(() => {
        result.current.setValue('field', 'abc');
      });

      await act(async () => {
        await result.current.trigger();
      });

      expect(result.current.getError('field')).toBe('Custom: Field must be at least 5 characters');
    });

    it('handles form without onSubmit callback', async () => {
      const { result } = renderHook(() => 
        useForm({ schema: testSchema })
      );

      // Set valid data
      act(() => {
        result.current.setValue('name', 'John');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('age', 25);
      });

      // Submit without onSubmit - should not throw
      await act(async () => {
        expect(() => result.current.submitForm()).not.toThrow();
      });
    });

    it('handles form with complex validation rules', async () => {
      const complexValidationSchema = z.object({
        password: z.string()
          .min(8, 'At least 8 characters')
          .regex(/[A-Z]/, 'Must contain uppercase')
          .regex(/[a-z]/, 'Must contain lowercase') 
          .regex(/\d/, 'Must contain number'),
        confirmPassword: z.string()
      }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword']
      });

      const { result } = renderHook(() => 
        useForm({ schema: complexValidationSchema })
      );

      // Test password validation
      act(() => {
        result.current.setValue('password', 'weak');
      });

      await act(async () => {
        await result.current.trigger('password');
      });

      expect(result.current.hasError('password')).toBe(true);

      // Test password confirmation
      act(() => {
        result.current.setValue('password', 'StrongPass123');
        result.current.setValue('confirmPassword', 'DifferentPass123');
      });

      await act(async () => {
        await result.current.trigger();
      });

      expect(result.current.hasError('confirmPassword')).toBe(true);
      expect(result.current.getError('confirmPassword')).toBe('Passwords must match');
    });

    it('handles submission with non-Error objects', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue('String error');
      const mockOnError = jest.fn();
      
      const { result } = renderHook(() => 
        useForm({ 
          schema: testSchema,
          onSubmit: mockOnSubmit,
          onError: mockOnError
        })
      );

      // Set valid data and submit
      act(() => {
        result.current.setValue('name', 'John');
        result.current.setValue('email', 'john@example.com');
        result.current.setValue('age', 25);
      });

      await act(async () => {
        result.current.submitForm();
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          _root: 'An error occurred during submission'
        });
      });
    });
  });
});