/**
 * Custom form hook with Zod validation
 * Integrates React Hook Form with Zod schemas for type-safe form handling
 */

import {
  useForm as useReactHookForm,
  UseFormProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback, useMemo } from "react";
import { logError, logWarn } from "@/lib/utils/logger";

interface UseFormOptions<T extends FieldValues>
  extends Omit<UseFormProps<T>, "resolver"> {
  schema: z.ZodSchema<T>;
  onSubmit?: ((data: T) => void | Promise<void>) | undefined;
  onError?: ((errors: Record<string, string>) => void) | undefined;
}

interface UseFormReturn<T extends FieldValues> {
  // React Hook Form methods
  register: ReturnType<typeof useReactHookForm<T>>["register"];
  handleSubmit: ReturnType<typeof useReactHookForm<T>>["handleSubmit"];
  watch: ReturnType<typeof useReactHookForm<T>>["watch"];
  setValue: ReturnType<typeof useReactHookForm<T>>["setValue"];
  getValues: ReturnType<typeof useReactHookForm<T>>["getValues"];
  reset: ReturnType<typeof useReactHookForm<T>>["reset"];
  clearErrors: ReturnType<typeof useReactHookForm<T>>["clearErrors"];
  setError: ReturnType<typeof useReactHookForm<T>>["setError"];
  trigger: ReturnType<typeof useReactHookForm<T>>["trigger"];

  // Form state
  formState: ReturnType<typeof useReactHookForm<T>>["formState"];
  errors: ReturnType<typeof useReactHookForm<T>>["formState"]["errors"];
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;

  // Helper methods
  getError: (field: Path<T>) => string | undefined;
  hasError: (field: Path<T>) => boolean;
  submitForm: () => void;
}

export function useForm<T extends FieldValues>({
  schema,
  onSubmit,
  onError,
  ...options
}: UseFormOptions<T>): UseFormReturn<T> {
  const form = useReactHookForm<T>({
    resolver: zodResolver(schema),
    mode: "onChange",
    ...options,
  });

  const { formState, handleSubmit: rhfHandleSubmit } = form;

  // Memoize error state to prevent unnecessary re-renders
  const errorState = useMemo(() => formState.errors, [formState.errors]);

  // Helper to get error message for a field
  const getError = useCallback(
    (field: Path<T>): string | undefined => {
      const error = errorState[field];
      if (error && typeof error.message === "string") {
        return error.message;
      }
      return undefined;
    },
    [errorState]
  );

  // Helper to check if field has error
  const hasError = useCallback(
    (field: Path<T>): boolean => {
      return Boolean(errorState[field]);
    },
    [errorState]
  );

  // Enhanced submit handler
  const submitForm = useCallback(() => {
    rhfHandleSubmit(
      async (data: T) => {
        try {
          if (onSubmit) {
            await onSubmit(data);
          }
        } catch (error) {
          logError("Form submission error:", error);
          if (onError) {
            onError({
              _root:
                error instanceof Error
                  ? error.message
                  : "An error occurred during submission",
            });
          }
        }
      },
      (errors) => {
        logWarn("Form validation errors:", errors);
        if (onError) {
          const errorMessages: Record<string, string> = {};
          Object.entries(errors).forEach(([key, error]) => {
            if (error && typeof error.message === "string") {
              errorMessages[key] = error.message;
            }
          });
          onError(errorMessages);
        }
      }
    )();
  }, [rhfHandleSubmit, onSubmit, onError]);

  return {
    // React Hook Form methods
    register: form.register,
    handleSubmit: rhfHandleSubmit,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    reset: form.reset,
    clearErrors: form.clearErrors,
    setError: form.setError,
    trigger: form.trigger,

    // Form state
    formState,
    errors: errorState,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,

    // Helper methods
    getError,
    hasError,
    submitForm,
  };
}

// Import schemas to use proper types
import {
  loginSchema,
  contactSchema,
  type LoginFormData,
  type ContactFormData,
} from "@/lib/validation/schemas";

// Specialized hooks for common forms with proper typing
export function useLoginForm(
  onSubmit?: (data: LoginFormData) => void | Promise<void>
) {
  return useForm({
    schema: loginSchema,
    onSubmit,
  });
}

export function useContactForm(
  onSubmit?: (data: ContactFormData) => void | Promise<void>
) {
  return useForm({
    schema: contactSchema,
    onSubmit,
  });
}

// Form validation utilities
export function createFormSchema<T>(schema: z.ZodSchema<T>) {
  return {
    schema,
    validate: (data: unknown) => {
      try {
        if (data === null || data === undefined) {
          return {
            success: false,
            errors: { _root: "An unexpected validation error occurred" },
          };
        }
        return { success: true, data: schema.parse(data) };
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
    },
  };
}

// Field validation helper
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): {
  isValid: boolean;
  error?: string;
} {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      isValid: false,
      error: "An unexpected validation error occurred",
    };
  }
}
