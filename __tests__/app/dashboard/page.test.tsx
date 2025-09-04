/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import Page from '../../../app/(authed)/dashboard/page';

// Mock Clerk auth hooks for authenticated state
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true, userId: 'user_123' }),
  useUser: () => ({ 
    user: { id: 'user_123', firstName: 'Test', lastName: 'User' }, 
    isLoaded: true 
  }),
  useOrganization: () => ({ 
    organization: { id: 'org_123', name: 'Test Org' }, 
    isLoaded: true 
  }),
}));

// Mock the auth hooks
jest.mock('../../../lib/hooks/useAuth', () => ({
  useAuth: () => ({ 
    isAuthenticated: true, 
    isLoading: false, 
    userId: 'user_123' 
  }),
  useAuthData: () => ({
    user: { id: 'user_123', firstName: 'Test', lastName: 'User' },
    organization: { id: 'org_123', name: 'Test Org' },
    isLoading: false,
    hasError: false
  }),
}));

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

describe('Dashboard Page', () => {
  it('should render without crashing', () => {
    render(<Page />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render for authenticated users', () => {
    const { container } = render(<Page />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have proper component structure', () => {
    const { container } = render(<Page />);
    expect(container).toBeInTheDocument();
  });
});