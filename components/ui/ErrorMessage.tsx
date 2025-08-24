/**
 * Standardized error message component
 * Provides consistent error display across the application
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  error?: string | null | undefined;
  title?: string;
  variant?: 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function ErrorMessage({
  error,
  title,
  variant = 'error',
  size = 'md',
  onDismiss,
  onRetry,
  className,
  showIcon = true,
}: ErrorMessageProps) {
  if (!error) return null;

  const baseClasses = 'rounded-md border p-4 flex items-start space-x-3';
  
  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-5',
  };

  const iconClasses = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <AlertCircle
          className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconClasses[variant])}
          aria-hidden="true"
        />
      )}
      
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-medium mb-1">{title}</h3>
        )}
        <p className="text-sm leading-5">{error}</p>
        
        {(onRetry || onDismiss) && (
          <div className="mt-3 flex space-x-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
      
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 rounded-md p-1.5 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2',
            variant === 'error' && 'text-red-400 focus:ring-red-500',
            variant === 'warning' && 'text-yellow-400 focus:ring-yellow-500',
            variant === 'info' && 'text-blue-400 focus:ring-blue-500'
          )}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Specialized error components for common use cases
 */

interface FormErrorProps {
  error?: string | null | undefined;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  return (
    <ErrorMessage
      error={error}
      variant="error"
      size="sm"
      showIcon={false}
      className={cn('mt-1 border-0 bg-transparent p-0 text-red-600', className)}
    />
  );
}

interface PageErrorProps {
  error?: string | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function PageError({ 
  error, 
  title = 'Something went wrong',
  onRetry, 
  className 
}: PageErrorProps) {
  const errorMessageProps: {
    error: string;
    title: string;
    variant: 'error';
    size: 'lg';
    className: string;
    onRetry?: () => void;
  } = {
    error: error || 'An unexpected error occurred. Please try again.',
    title,
    variant: 'error',
    size: 'lg',
    className: 'max-w-md',
  };

  if (onRetry) {
    errorMessageProps.onRetry = onRetry;
  }

  return (
    <div className={cn('flex justify-center items-center min-h-[200px]', className)}>
      <ErrorMessage {...errorMessageProps} />
    </div>
  );
}

interface InlineErrorProps {
  error?: string | null;
  className?: string;
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null;
  
  return (
    <ErrorMessage
      error={error}
      variant="error"
      size="sm"
      className={cn('mb-4', className)}
    />
  );
}