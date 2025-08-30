"use client";

import React from 'react';
import { logError } from '@/lib/utils/logger';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

export class NavigationErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('Navigation error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      // Fallback UI when navigation fails
      return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  CFIPros
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                Navigation temporarily unavailable
              </div>
            </div>
          </div>
        </nav>
      );
    }

    return this.props.children;
  }
}
