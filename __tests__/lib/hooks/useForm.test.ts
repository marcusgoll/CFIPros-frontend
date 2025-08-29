/**
 * Tests for useForm hook
 * Testing form management and validation integration
 */

import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useForm, useLoginForm, useContactForm, createFormSchema, validateField } from '@/lib/hooks/useForm';

// Mock react-hook-form
const mockRegister = jest.fn();
const mockHandleSubmit = jest.fn();
const mockWatch = jest.fn();
const mockSetValue = jest.fn();
const mockGetValues = jest.fn();
const mockReset = jest.fn();
const mockClearErrors = jest.fn();
const mockSetError = jest.fn();
const mockTrigger = jest.fn();

const mockFormState = {
  errors: {},
  isValid: true,
  isSubmitting: false,
  isDirty: false,
  isLoading: false,
  isSubmitted: false,
  isSubmitSuccessful: false,
  isValidating: false,
  submitCount: 0,
  dirtyFields: {},
  touchedFields: {},
  defaultValues: {},
};

jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    watch: mockWatch,
    setValue: mockSetValue,
    getValues: mockGetValues,
    reset: mockReset,
    clearErrors: mockClearErrors,
    setError: mockSetError,
    trigger: mockTrigger,
    formState: mockFormState,
  })),
}));

describe('useForm hook', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleSubmit.mockImplementation((successFn) => 
      jest.fn((e) => {
        e?.preventDefault?.();
        successFn({ name: 'Test', email: 'test@example.com' });
      })
    );
  });

  it('should initialize with schema and options', () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm({
        schema: testSchema,
        onSubmit: mockOnSubmit,
        defaultValues: { name: '', email: '' },
      })
    );

    expect(result.current.register).toBe(mockRegister);
    expect(result.current.handleSubmit).toBe(mockHandleSubmit);
    expect(result.current.watch).toBe(mockWatch);
    expect(result.current.formState).toBe(mockFormState);
    expect(result.current.isValid).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('should provide getError helper', () => {
    mockFormState.errors = {
      name: { message: 'Name is required', type: 'required' },
    };

    const { result } = renderHook(() => 
      useForm({ schema: testSchema })
    );

    expect(result.current.getError('name' as any)).toBe('Name is required');
    expect(result.current.getError('email' as any)).toBeUndefined();
  });

  it('should provide hasError helper', () => {
    mockFormState.errors = {
      name: { message: 'Name is required', type: 'required' },
    };

    const { result } = renderHook(() => 
      useForm({ schema: testSchema })
    );

    expect(result.current.hasError('name' as any)).toBe(true);
    expect(result.current.hasError('email' as any)).toBe(false);
  });

  it('should handle successful form submission', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => 
      useForm({
        schema: testSchema,
        onSubmit: mockOnSubmit,
      })
    );

    await act(async () => {
      result.current.submitForm();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@example.com',
    });
  });

  it('should handle form submission errors', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const mockOnError = jest.fn();
    
    const { result } = renderHook(() => 
      useForm({
        schema: testSchema,
        onSubmit: mockOnSubmit,
        onError: mockOnError,
      })
    );

    await act(async () => {
      result.current.submitForm();
    });

    expect(mockOnError).toHaveBeenCalledWith({
      _root: 'Submission failed',
    });
  });

  it('should handle validation errors', async () => {
    const mockOnError = jest.fn();
    const validationErrors = {
      name: { message: 'Name is required', type: 'required' },
    };

    mockHandleSubmit.mockImplementation((successFn, errorFn) => 
      jest.fn((e) => {
        e?.preventDefault?.();
        errorFn(validationErrors);
      })
    );

    const { result } = renderHook(() => 
      useForm({
        schema: testSchema,
        onError: mockOnError,
      })
    );

    await act(async () => {
      result.current.submitForm();
    });

    expect(mockOnError).toHaveBeenCalledWith({
      name: 'Name is required',
    });
  });

  it('should return form state properties', () => {
    const customFormState = {
      ...mockFormState,
      isValid: false,
      isSubmitting: true,
      isDirty: true,
    };

    const { useForm: mockUseFormOriginal } = jest.requireMock('react-hook-form');
    mockUseFormOriginal.mockReturnValueOnce({
      ...mockUseFormOriginal(),
      formState: customFormState,
    });

    const { result } = renderHook(() => 
      useForm({ schema: testSchema })
    );

    expect(result.current.isValid).toBe(false);
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.isDirty).toBe(true);
  });
});

describe('useLoginForm hook', () => {
  it('should create login form with correct schema', () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    expect(result.current.register).toBe(mockRegister);
    expect(result.current.handleSubmit).toBe(mockHandleSubmit);
  });

  it('should work without onSubmit callback', () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.register).toBe(mockRegister);
    expect(result.current.handleSubmit).toBe(mockHandleSubmit);
  });
});

describe('useContactForm hook', () => {
  it('should create contact form with correct schema', () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() => useContactForm(mockOnSubmit));

    expect(result.current.register).toBe(mockRegister);
    expect(result.current.handleSubmit).toBe(mockHandleSubmit);
  });

  it('should work without onSubmit callback', () => {
    const { result } = renderHook(() => useContactForm());

    expect(result.current.register).toBe(mockRegister);
    expect(result.current.handleSubmit).toBe(mockHandleSubmit);
  });
});

describe('createFormSchema utility', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  });

  it('should create form schema with validation function', () => {
    const formSchema = createFormSchema(testSchema);

    expect(formSchema.schema).toBe(testSchema);
    expect(typeof formSchema.validate).toBe('function');
  });

  it('should validate correct data', () => {
    const formSchema = createFormSchema(testSchema);
    const validData = { name: 'John', email: 'john@example.com' };

    const result = formSchema.validate(validData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(validData);
  });

  it('should return errors for invalid data', () => {
    const formSchema = createFormSchema(testSchema);
    const invalidData = { name: '', email: 'invalid-email' };

    const result = formSchema.validate(invalidData);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.name).toContain('Name is required');
    expect(result.errors?.email).toContain('Invalid email');
  });

  it('should handle unexpected validation errors', () => {
    const formSchema = createFormSchema(testSchema);

    const result = formSchema.validate(null);

    expect(result.success).toBe(false);
    expect(result.errors?._root).toBe('An unexpected validation error occurred');
  });
});

describe('validateField utility', () => {
  const nameSchema = z.string().min(1, 'Name is required');

  it('should validate correct field value', () => {
    const result = validateField(nameSchema, 'John Doe');

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error for invalid field value', () => {
    const result = validateField(nameSchema, '');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should handle Zod errors without message', () => {
    const strictSchema = z.number();
    const result = validateField(strictSchema, 'not-a-number');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Expected number, received string');
  });

  it('should handle unexpected validation errors', () => {
    // Create a schema that will throw a non-Zod error
    const schema = {
      parse: () => {
        throw new Error('Unexpected error');
      }
    } as any;

    const result = validateField(schema, 'test');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('An unexpected validation error occurred');
  });
});