import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderNavigation } from '@/components/layout/HeaderNavigation';

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  useClerk: jest.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>
}));

describe('HeaderNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CFIPros logo', () => {
    render(<HeaderNavigation />);
    const logo = screen.getByAltText('CFIPros');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/CFIPros-logo-primary.svg');
  });

  it('renders all navigation menus', () => {
    render(<HeaderNavigation />);
    expect(screen.getAllByText('Our Features')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('Research')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('For Instructors')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('For Flight Schools')).toHaveLength(2); // Desktop and mobile
  });

  it('renders login and sign up buttons when not authenticated', () => {
    const { useUser } = require('@clerk/nextjs');
    useUser.mockReturnValue({ isSignedIn: false });
    
    render(<HeaderNavigation />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders user button when authenticated', () => {
    const { useUser } = require('@clerk/nextjs');
    useUser.mockReturnValue({ isSignedIn: true, user: { firstName: 'John' } });
    
    render(<HeaderNavigation />);
    expect(screen.getByText('User Button')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('toggles mobile menu on hamburger click', async () => {
    render(<HeaderNavigation />);
    
    // Mobile menu should be hidden initially
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    
    // Click hamburger button
    const hamburgerButton = screen.getByLabelText('Open main menu');
    fireEvent.click(hamburgerButton);
    
    // Mobile menu should be visible
    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
    
    // Click close button
    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);
    
    // Mobile menu should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });

  it('closes mobile menu when clicking outside', async () => {
    render(<HeaderNavigation />);
    
    const hamburgerButton = screen.getByLabelText('Open main menu');
    fireEvent.click(hamburgerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
    
    // Click outside the menu
    fireEvent.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });

  it('applies sticky positioning on scroll', () => {
    render(<HeaderNavigation />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('sticky', 'top-0');
  });

  it('renders mega menu for features dropdown', async () => {
    render(<HeaderNavigation />);
    const featuresButtons = screen.getAllByText('Our Features');
    const desktopFeaturesButton = featuresButtons[0]; // First one is desktop (hidden lg:flex)
    
    fireEvent.mouseEnter(desktopFeaturesButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Reports')).toBeInTheDocument();
      expect(screen.getByText('ACS Search')).toBeInTheDocument();
      expect(screen.getByText('Study Plans')).toBeInTheDocument();
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });
  });

  it('renders dropdown for instructors menu', async () => {
    render(<HeaderNavigation />);
    const instructorsButtons = screen.getAllByText('For Instructors');
    const desktopInstructorsButton = instructorsButtons[0]; // First one is desktop
    
    fireEvent.mouseEnter(desktopInstructorsButton);
    
    await waitFor(() => {
      expect(screen.getByText('For CFI/CFII')).toBeInTheDocument();
      expect(screen.getByText('Our Mission')).toBeInTheDocument();
      expect(screen.getByText('Our Principles')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation through menus', async () => {
    const user = userEvent.setup();
    render(<HeaderNavigation />);
    
    // Tab to first menu item (skip logo)
    await user.tab(); // Logo link
    await user.tab(); // Features button
    const featuresButtons = screen.getAllByText('Our Features');
    const desktopFeaturesButton = featuresButtons[0];
    expect(desktopFeaturesButton).toHaveFocus();
    
    // Open menu with Enter
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Upload Reports')).toBeInTheDocument();
    });
    
    // Close with Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Upload Reports')).not.toBeInTheDocument();
    });
  });

  it('maintains accessibility attributes', () => {
    render(<HeaderNavigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    const featuresButtons = screen.getAllByText('Our Features');
    const desktopFeaturesButton = featuresButtons[0];
    expect(desktopFeaturesButton).toHaveAttribute('aria-haspopup', 'true');
    expect(desktopFeaturesButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles mobile menu item clicks', async () => {
    render(<HeaderNavigation />);
    
    // Open mobile menu
    const hamburgerButton = screen.getByLabelText('Open main menu');
    fireEvent.click(hamburgerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
    
    // Click a menu item
    const mobileMenuItem = screen.getByText('Research');
    fireEvent.click(mobileMenuItem);
    
    // Menu should close
    await waitFor(() => {
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });

  it('renders mobile accordion for nested menus', async () => {
    render(<HeaderNavigation />);
    
    // Open mobile menu
    const hamburgerButton = screen.getByLabelText('Open main menu');
    fireEvent.click(hamburgerButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
    
    // Click on Features to expand accordion (get the mobile version)
    const mobileMenu = screen.getByTestId('mobile-menu');
    const mobileFeaturesAccordion = within(mobileMenu).getByText('Our Features');
    fireEvent.click(mobileFeaturesAccordion);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Reports')).toBeInTheDocument();
      expect(screen.getByText('ACS Search')).toBeInTheDocument();
    });
  });
});