import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", label, error, helperText, id, ...props },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id ?? `input-${autoId}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors",
            "focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-1",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50",
            error &&
              "border-error-500 focus:border-error-500 focus:ring-error-500",
            className
          )}
          id={inputId}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-error-600 mt-1 text-sm" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
