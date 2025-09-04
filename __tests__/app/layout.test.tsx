/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import RootLayout from '../../app/layout';

// Mock Clerk Provider
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="clerk-provider">{children}</div>,
}));

// Mock Next.js font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
    variable: '--font-inter',
  }),
}));

// Mock metadata export
jest.mock('../../app/layout', () => {
  const actual = jest.requireActual('../../app/layout');
  return {
    ...actual,
    metadata: {
      title: 'CFIPros',
      description: 'Aviation training platform',
    },
  };
});

describe('Root Layout', () => {
  it('should render without crashing', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should render children content', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should wrap children in ClerkProvider', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(getByTestId('clerk-provider')).toBeInTheDocument();
  });
});