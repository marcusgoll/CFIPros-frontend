/**
 * Standardized loading state components
 * Provides consistent loading indicators across the application
 */

import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingText?: string;
  errorComponent?: React.ComponentType<{ error: string; onRetry?: () => void }>;
  onRetry?: () => void;
  className?: string;
  spinnerSize?: "sm" | "md" | "lg";
}

export function LoadingState({
  loading,
  error,
  children,
  loadingText = "Loading...",
  errorComponent: ErrorComponent,
  onRetry,
  className,
  spinnerSize = "md",
}: LoadingStateProps) {
  if (error && ErrorComponent) {
    const errorProps: { error: string; onRetry?: () => void } = { error };
    if (onRetry) {
      errorProps.onRetry = onRetry;
    }
    return <ErrorComponent {...errorProps} />;
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="text-center">
          <LoadingSpinner size={spinnerSize} />
          {loadingText && <p className="mt-2 text-gray-600">{loadingText}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface PageLoadingProps {
  text?: string;
  className?: string;
}

export function PageLoading({
  text = "Loading...",
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] items-center justify-center",
        className
      )}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-600">{text}</p>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

export function InlineLoading({
  loading,
  children,
  text = "Loading...",
  className,
}: InlineLoadingProps) {
  if (loading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    );
  }

  return <>{children}</>;
}

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: unknown; // Allow other button props
}

export function ButtonLoading({
  loading,
  children,
  loadingText,
  disabled,
  className,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      type="button"
      disabled={loading || disabled}
      className={cn(
        "inline-flex items-center justify-center space-x-2",
        loading && "cursor-not-allowed opacity-75",
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({
  className,
  width,
  height,
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        rounded ? "rounded-full" : "rounded",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  showImage?: boolean;
  className?: string;
}

export function SkeletonCard({
  showImage = false,
  className,
}: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {showImage && <Skeleton height={160} className="mb-4 rounded" />}
      <Skeleton height={20} width="60%" className="mb-2" />
      <SkeletonText lines={2} />
      <div className="mt-4 flex space-x-2">
        <Skeleton height={32} width={80} rounded />
        <Skeleton height={32} width={80} rounded />
      </div>
    </div>
  );
}

/**
 * Higher-order component for adding loading states to any component
 */
interface WithLoadingProps {
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: string; onRetry?: () => void }>;
}

export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithLoadingComponent = (props: P & WithLoadingProps) => {
    const {
      loading,
      error,
      onRetry,
      loadingComponent: LoadingComponent = PageLoading,
      errorComponent: ErrorComponent,
      ...componentProps
    } = props;

    if (loading && LoadingComponent) {
      return <LoadingComponent />;
    }

    if (error) {
      if (ErrorComponent) {
        const errorProps: { error: string; onRetry?: () => void } = { error };
        if (onRetry) {
          errorProps.onRetry = onRetry;
        }
        return <ErrorComponent {...errorProps} />;
      }

      return (
        <div className="py-8 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return <WrappedComponent {...(componentProps as P)} />;
  };

  WithLoadingComponent.displayName = `withLoading(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithLoadingComponent;
}
