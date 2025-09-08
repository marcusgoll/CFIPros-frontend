/**
 * Testing Utilities for Custom Hooks and Authentication Flows
 * Provides reusable testing utilities for frontend integration tests
 */

import React, { ReactElement } from 'react';
import { render, renderHook, RenderHookOptions, RenderOptions } from '@testing-library/react';
import { act } from 'react';

// Mock Clerk Provider for authentication testing
interface MockClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string;
  lastName?: string;
  organizationMemberships?: Array<{
    organization: {
      id: string;
      name: string;
    };
    role: string;
  }>;
}

interface MockClerkSession {
  id: string;
  status: 'active' | 'expired' | 'ended';
  user: MockClerkUser;
  getToken: jest.Mock;
  lastActiveAt: Date;
  expireAt: Date;
}

interface MockClerkContextValue {
  user: MockClerkUser | null;
  session: MockClerkSession | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: jest.Mock;
  signOut: jest.Mock;
  signUp: jest.Mock;
  getToken: jest.Mock;
  organization: any;
  setActive: jest.Mock;
}

// Create mock Clerk context
const createMockClerkContext = (
  overrides: Partial<MockClerkContextValue> = {}
): MockClerkContextValue => {
  const mockGetToken = jest.fn().mockResolvedValue('mock_token_123');
  
  const defaultUser: MockClerkUser = {
    id: 'user_test_123',
    emailAddresses: [{ emailAddress: 'test@cfipros.com' }],
    firstName: 'Test',
    lastName: 'User',
    organizationMemberships: [{
      organization: {
        id: 'org_test_123',
        name: 'Test Organization'
      },
      role: 'student'
    }]
  };

  const defaultSession: MockClerkSession = {
    id: 'session_test_123',
    status: 'active',
    user: defaultUser,
    getToken: mockGetToken,
    lastActiveAt: new Date(),
    expireAt: new Date(Date.now() + 3600000)
  };

  return {
    user: defaultUser,
    session: defaultSession,
    isLoaded: true,
    isSignedIn: true,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getToken: mockGetToken,
    organization: null,
    setActive: jest.fn(),
    ...overrides
  };
};

// Mock Clerk Context Provider
const MockClerkContext = React.createContext<MockClerkContextValue | undefined>(undefined);

interface MockClerkProviderProps {
  children: React.ReactNode;
  value?: Partial<MockClerkContextValue>;
}

export const MockClerkProvider: React.FC<MockClerkProviderProps> = ({ 
  children, 
  value = {} 
}) => {
  const mockClerkValue = createMockClerkContext(value);

  return (
    <MockClerkContext.Provider value={mockClerkValue}>
      {children}
    </MockClerkContext.Provider>
  );
};

// Hook for accessing mock Clerk context in tests
export const useMockClerk = (): MockClerkContextValue => {
  const context = React.useContext(MockClerkContext);
  if (!context) {
    throw new Error('useMockClerk must be used within MockClerkProvider');
  }
  return context;
};

// Authentication test scenarios
export const authScenarios = {
  // Authenticated user with active session
  authenticated: {
    user: {
      id: 'user_authenticated_123',
      emailAddresses: [{ emailAddress: 'authenticated@cfipros.com' }],
      firstName: 'Auth',
      lastName: 'User'
    },
    session: {
      id: 'session_active_123',
      status: 'active' as const,
      getToken: jest.fn().mockResolvedValue('valid_token_123')
    },
    isLoaded: true,
    isSignedIn: true
  },

  // Unauthenticated user
  unauthenticated: {
    user: null,
    session: null,
    isLoaded: true,
    isSignedIn: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    getToken: jest.fn().mockResolvedValue(null)
  },

  // Loading state
  loading: {
    user: null,
    session: null,
    isLoaded: false,
    isSignedIn: false,
    getToken: jest.fn().mockResolvedValue(null)
  },

  // Expired session
  expired: {
    user: {
      id: 'user_expired_123',
      emailAddresses: [{ emailAddress: 'expired@cfipros.com' }]
    },
    session: {
      id: 'session_expired_123',
      status: 'expired' as const,
      getToken: jest.fn().mockRejectedValue(new Error('Token expired'))
    },
    isLoaded: true,
    isSignedIn: false
  },

  // Organization member
  orgMember: {
    user: {
      id: 'user_org_member_123',
      emailAddresses: [{ emailAddress: 'member@organization.com' }],
      firstName: 'Org',
      lastName: 'Member',
      organizationMemberships: [{
        organization: {
          id: 'org_test_456',
          name: 'Test Flight School'
        },
        role: 'member'
      }]
    },
    session: {
      id: 'session_org_123',
      status: 'active' as const,
      getToken: jest.fn().mockResolvedValue('org_token_456')
    },
    isLoaded: true,
    isSignedIn: true,
    organization: {
      id: 'org_test_456',
      name: 'Test Flight School'
    }
  },

  // Organization admin
  orgAdmin: {
    user: {
      id: 'user_org_admin_123',
      emailAddresses: [{ emailAddress: 'admin@organization.com' }],
      firstName: 'Org',
      lastName: 'Admin',
      organizationMemberships: [{
        organization: {
          id: 'org_test_456',
          name: 'Test Flight School'
        },
        role: 'admin'
      }]
    },
    session: {
      id: 'session_org_admin_123',
      status: 'active' as const,
      getToken: jest.fn().mockResolvedValue('admin_token_789')
    },
    isLoaded: true,
    isSignedIn: true,
    organization: {
      id: 'org_test_456',
      name: 'Test Flight School',
      role: 'admin'
    }
  }
};

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode; clerkValue?: Partial<MockClerkContextValue> }> = ({ 
  children, 
  clerkValue = {} 
}) => {
  return (
    <MockClerkProvider value={clerkValue}>
      {children}
    </MockClerkProvider>
  );
};

// Enhanced render function for components
export const customRender = (
  ui: ReactElement,
  options: RenderOptions & { clerkValue?: Partial<MockClerkContextValue> } = {}
) => {
  const { clerkValue, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders clerkValue={clerkValue}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Enhanced renderHook function for hooks
export const customRenderHook = <TProps, TResult>(
  render: (initialProps: TProps) => TResult,
  options: RenderHookOptions<TProps> & { clerkValue?: Partial<MockClerkContextValue> } = {}
) => {
  const { clerkValue, ...renderHookOptions } = options;
  
  return renderHook(render, {
    wrapper: ({ children }) => (
      <AllTheProviders clerkValue={clerkValue}>{children}</AllTheProviders>
    ),
    ...renderHookOptions,
  });
};

// Utility functions for authentication flow testing
export const authFlowUtils = {
  // Simulate successful authentication
  simulateLogin: async (mockSignIn: jest.Mock, userData: Partial<MockClerkUser> = {}) => {
    const user = {
      id: 'user_login_test',
      emailAddresses: [{ emailAddress: 'login@test.com' }],
      firstName: 'Login',
      lastName: 'Test',
      ...userData
    };

    const result = {
      status: 'complete',
      user,
      session: {
        id: 'session_login_test',
        status: 'active',
        user,
        getToken: jest.fn().mockResolvedValue('login_token_123')
      }
    };

    await act(async () => {
      mockSignIn.mockResolvedValueOnce(result);
      // Actually call the function to trigger the mock
      await mockSignIn();
    });

    return user;
  },

  // Simulate logout
  simulateLogout: async (mockSignOut: jest.Mock) => {
    const result = {
      status: 'complete'
    };

    await act(async () => {
      mockSignOut.mockResolvedValueOnce(result);
      // Actually call the function to trigger the mock
      await mockSignOut();
    });
  },

  // Simulate token refresh
  simulateTokenRefresh: async (mockGetToken: jest.Mock, newToken: string = 'refreshed_token_456') => {
    await act(async () => {
      mockGetToken.mockResolvedValueOnce(newToken);
      // Actually call the function to trigger the mock
      await mockGetToken();
    });

    return newToken;
  },

  // Simulate token expiry
  simulateTokenExpiry: async (mockGetToken: jest.Mock) => {
    await act(async () => {
      mockGetToken.mockRejectedValueOnce(new Error('Token expired'));
    });
  },

  // Simulate network error during auth
  simulateNetworkError: async (mockFunction: jest.Mock) => {
    await act(async () => {
      mockFunction.mockRejectedValueOnce(new Error('Network error'));
    });
  }
};

// File upload testing utilities
export const fileUploadUtils = {
  // Create test files
  createTestFile: (
    name: string = 'test.pdf',
    content: string = 'test file content',
    type: string = 'application/pdf'
  ): File => {
    return new File([content], name, { type });
  },

  // Create multiple test files
  createTestFiles: (count: number = 3): File[] => {
    return Array.from({ length: count }, (_, index) => 
      new File([`content ${index + 1}`], `test${index + 1}.pdf`, { type: 'application/pdf' })
    );
  },

  // Create malicious file for security testing
  createMaliciousFile: (): File => {
    return new File(['<?php echo "malicious"; ?>'], 'malicious.php', { type: 'application/x-httpd-php' });
  },

  // Create oversized file for testing limits
  createOversizedFile: (): File => {
    const content = 'x'.repeat(1024 * 1024 * 50); // 50MB
    return new File([content], 'large.pdf', { type: 'application/pdf' });
  }
};

// Test state management utilities
export const stateUtils = {
  // Wait for async state updates
  waitForStateUpdate: async (callback: () => boolean, timeout: number = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      
      const checkState = () => {
        if (callback()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`State update timeout after ${timeout}ms`));
        } else {
          setTimeout(checkState, 100);
        }
      };
      
      checkState();
    });
  },

  // Simulate component cleanup
  simulateCleanup: (cleanupFn?: () => void) => {
    return act(() => {
      if (cleanupFn) {
        cleanupFn();
      }
    });
  }
};

// API response testing utilities
export const apiUtils = {
  // Create mock API response
  createMockResponse: (data: any, status: number = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  }),

  // Create mock error response
  createMockErrorResponse: (error: string, code: string, status: number = 400) => ({
    ok: false,
    status,
    json: async () => ({ error, code }),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
};

// Export everything as default utilities object
export const testUtils = {
  MockClerkProvider,
  useMockClerk,
  authScenarios,
  customRender,
  customRenderHook,
  authFlowUtils,
  fileUploadUtils,
  stateUtils,
  apiUtils
};

export default testUtils;