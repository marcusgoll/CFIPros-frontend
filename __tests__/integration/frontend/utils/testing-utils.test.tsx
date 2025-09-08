/**
 * Testing Utilities Verification Tests
 * Ensures all frontend test utilities function correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import {
  MockClerkProvider,
  useMockClerk,
  authScenarios,
  customRender,
  customRenderHook,
  authFlowUtils,
  fileUploadUtils,
  stateUtils,
  apiUtils
} from './testing-utils';

// Test component to verify MockClerkProvider works
const TestAuthComponent = () => {
  const { user, isSignedIn } = useMockClerk();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isSignedIn ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div data-testid="user-info">
          {user.emailAddresses[0]?.emailAddress}
        </div>
      )}
    </div>
  );
};

describe('Testing Utilities Verification', () => {
  describe('MockClerkProvider', () => {
    test('provides default authenticated context', () => {
      render(
        <MockClerkProvider>
          <TestAuthComponent />
        </MockClerkProvider>
      );
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('test@cfipros.com');
    });
    
    test('accepts custom authentication state', () => {
      render(
        <MockClerkProvider value={authScenarios.unauthenticated}>
          <TestAuthComponent />
        </MockClerkProvider>
      );
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });

  describe('customRender utility', () => {
    test('renders components with Clerk context', () => {
      customRender(<TestAuthComponent />);
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    test('accepts custom Clerk values', () => {
      customRender(<TestAuthComponent />, {
        clerkValue: authScenarios.loading
      });
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });

  describe('customRenderHook utility', () => {
    test('renders hooks with Clerk context', () => {
      const { result } = customRenderHook(() => useMockClerk());
      
      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.user?.emailAddresses[0]?.emailAddress).toBe('test@cfipros.com');
    });
    
    test('accepts custom Clerk values for hooks', () => {
      const { result } = customRenderHook(() => useMockClerk(), {
        clerkValue: authScenarios.orgAdmin
      });
      
      expect(result.current.user?.emailAddresses[0]?.emailAddress).toBe('admin@organization.com');
      expect(result.current.organization?.role).toBe('admin');
    });
  });

  describe('Auth Flow Utils', () => {
    test('simulateLogin creates user data', async () => {
      const mockSignIn = jest.fn();
      
      const user = await authFlowUtils.simulateLogin(mockSignIn, {
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      });
      
      expect(user.emailAddresses[0]?.emailAddress).toBe('test@example.com');
      expect(mockSignIn).toHaveBeenCalled();
    });
    
    test('simulateLogout calls sign out', async () => {
      const mockSignOut = jest.fn();
      
      await authFlowUtils.simulateLogout(mockSignOut);
      
      expect(mockSignOut).toHaveBeenCalled();
    });
    
    test('simulateTokenRefresh returns new token', async () => {
      const mockGetToken = jest.fn();
      
      const token = await authFlowUtils.simulateTokenRefresh(mockGetToken);
      
      expect(token).toBe('refreshed_token_456');
      expect(mockGetToken).toHaveBeenCalled();
    });
  });

  describe('File Upload Utils', () => {
    test('createTestFile creates valid File object', () => {
      const file = fileUploadUtils.createTestFile('test.pdf', 'content', 'application/pdf');
      
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.pdf');
      expect(file.type).toBe('application/pdf');
    });
    
    test('createTestFiles creates multiple files', () => {
      const files = fileUploadUtils.createTestFiles(3);
      
      expect(files).toHaveLength(3);
      expect(files[0].name).toBe('test1.pdf');
      expect(files[1].name).toBe('test2.pdf');
      expect(files[2].name).toBe('test3.pdf');
    });
    
    test('createMaliciousFile creates security test file', () => {
      const file = fileUploadUtils.createMaliciousFile();
      
      expect(file.name).toBe('malicious.php');
      expect(file.type).toBe('application/x-httpd-php');
    });
  });

  describe('State Utils', () => {
    test('waitForStateUpdate resolves when condition is met', async () => {
      let state = false;
      
      // Change state after a delay
      setTimeout(() => { state = true; }, 100);
      
      await expect(
        stateUtils.waitForStateUpdate(() => state, 1000)
      ).resolves.toBeUndefined();
    });
    
    test('waitForStateUpdate rejects on timeout', async () => {
      await expect(
        stateUtils.waitForStateUpdate(() => false, 100)
      ).rejects.toThrow('State update timeout after 100ms');
    });
    
    test('simulateCleanup runs cleanup function', () => {
      const cleanupFn = jest.fn();
      
      act(() => {
        stateUtils.simulateCleanup(cleanupFn);
      });
      
      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('API Utils', () => {
    test('createMockResponse creates valid response object', () => {
      const data = { success: true };
      const response = apiUtils.createMockResponse(data, 200);
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.json()).resolves.toEqual(data);
    });
    
    test('createMockErrorResponse creates error response', () => {
      const response = apiUtils.createMockErrorResponse('Not Found', 'NOT_FOUND', 404);
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.json()).resolves.toEqual({
        error: 'Not Found',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('Auth Scenarios', () => {
    test('authenticated scenario provides valid user', () => {
      const scenario = authScenarios.authenticated;
      
      expect(scenario.isSignedIn).toBe(true);
      expect(scenario.user?.id).toBe('user_authenticated_123');
      expect(scenario.session?.status).toBe('active');
    });
    
    test('expired scenario provides expired session', () => {
      const scenario = authScenarios.expired;
      
      expect(scenario.isSignedIn).toBe(false);
      expect(scenario.session?.status).toBe('expired');
    });
    
    test('orgMember scenario provides organization data', () => {
      const scenario = authScenarios.orgMember;
      
      expect(scenario.user?.organizationMemberships?.[0]?.role).toBe('member');
      expect(scenario.organization?.name).toBe('Test Flight School');
    });
  });
});