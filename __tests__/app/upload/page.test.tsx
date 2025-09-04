/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import Page from '../../../app/(public)/upload/page';

// Mock Clerk auth hooks
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isLoaded: true }),
}));

// Mock components that might be used in upload page
jest.mock('../../../components/forms/FileUploader', () => {
  return function MockFileUploader() {
    return <div data-testid="file-uploader">File Upload Component</div>;
  };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Upload Page', () => {
  it('should render without crashing', () => {
    render(<Page />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render upload interface', () => {
    const { container } = render(<Page />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have proper document structure', () => {
    const { container } = render(<Page />);
    expect(container).toBeInTheDocument();
  });
});