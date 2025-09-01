/**
 * Login form component with Zod validation
 * Secure authentication form with proper validation and error handling
 */

import React, { useState } from "react";
import { useForm } from "@/lib/hooks/useForm";
import { loginSchema, type LoginFormData } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { logInfo } from "@/lib/utils/logger";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function LoginForm({
  onSubmit,
  onForgotPassword,
  onSignUp,
  className,
  isLoading: externalLoading = false,
}: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    schema: loginSchema,
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: async (data) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        if (onSubmit) {
          await onSubmit(data);
        } else {
          // Default behavior - simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          logInfo("Login data:", data);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Invalid email or password. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const isLoading = externalLoading || isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(form.submitForm)}
      className={cn("mx-auto max-w-sm space-y-6", className)}
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Don't have an account?{" "}
          {onSignUp ? (
            <button
              type="button"
              onClick={onSignUp}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </button>
          ) : (
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          )}
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Email address *
        </label>
        <Input
          {...form.register("email")}
          id="email"
          type="email"
          autoComplete="email"
          placeholder="your.email@example.com"
          disabled={isLoading}
          className={
            form.hasError("email") ? "border-red-300 focus:border-red-500" : ""
          }
        />
        <FormError error={form.getError("email")} />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Password *
        </label>
        <div className="relative">
          <Input
            {...form.register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isLoading}
            className={cn(
              "pr-10",
              form.hasError("password")
                ? "border-red-300 focus:border-red-500"
                : ""
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <FormError error={form.getError("password")} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...form.register("rememberMe")}
            id="rememberMe"
            type="checkbox"
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-75"
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-sm text-gray-900"
          >
            Remember me
          </label>
        </div>

        <div className="text-sm">
          {onForgotPassword ? (
            <button
              type="button"
              onClick={onForgotPassword}
              className="font-medium text-blue-600 hover:text-blue-500"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          ) : (
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </Link>
          )}
        </div>
      </div>

      {submitError && <FormError error={submitError} className="text-center" />}

      <LoadingState loading={isLoading}>
        <Button
          type="submit"
          disabled={!form.isValid || isLoading}
          className="w-full"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </LoadingState>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </Link>
        </p>
      </div>
    </form>
  );
}
