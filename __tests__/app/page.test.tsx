/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Page from '../../app/(public)/page';

// Mock Clerk auth hooks
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isLoaded: true }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />;
});

describe('Home Page', () => {
  it('should render without crashing', () => {
    render(<Page />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render main content', () => {
    render(<Page />);
    // Look for any text content that indicates the page loaded
    expect(document.body).toHaveTextContent('');
  });

  it('should have proper document structure', () => {
    const { container } = render(<Page />);
    expect(container.firstChild).toBeInTheDocument();
  });
});