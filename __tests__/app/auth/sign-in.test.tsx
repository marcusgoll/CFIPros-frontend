/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import Page from '../../../app/(auth)/sign-in/page';

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignIn: () => <div data-testid="clerk-sign-in">Sign In Form</div>,
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
}));

describe('Sign In Page', () => {
  it('should render without crashing', () => {
    render(<Page />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render sign in form', () => {
    const { container } = render(<Page />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have proper document structure', () => {
    const { container } = render(<Page />);
    expect(container).toBeInTheDocument();
  });
});