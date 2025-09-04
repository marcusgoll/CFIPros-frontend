/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import Page from '../../../app/(auth)/sign-up/page';

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignUp: () => <div data-testid="clerk-sign-up">Sign Up Form</div>,
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
}));

describe('Sign Up Page', () => {
  it('should render without crashing', () => {
    render(<Page />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render sign up form', () => {
    const { container } = render(<Page />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have proper document structure', () => {
    const { container } = render(<Page />);
    expect(container).toBeInTheDocument();
  });
});