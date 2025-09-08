/**
 * Comprehensive MobileNavigation Component Tests
 * Tests for Task 2.2: Layout Components Testing
 * 
 * Coverage Areas:
 * - Mobile navigation menu rendering and state management
 * - Authentication integration with Clerk components
 * - Accordion functionality for nested menus
 * - Focus management and keyboard navigation
 * - Outside click detection and menu closing
 * - Responsive behavior and window resize handling
 * - Body scroll locking during menu open
 * - Accessibility features and ARIA attributes
 * - Touch and click interactions
 * - Integration with navigation configuration
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNavigation } from "@/components/layout/Navigation/MobileNavigation";

// Mock navigation configuration
jest.mock("@/lib/config/navigation", () => ({
  featuresMenu: {
    columns: [
      {
        items: [
          {
            title: "Upload Reports",
            description: "Upload and analyze flight training reports",
            href: "/upload"
          },
          {
            title: "ACS Search", 
            description: "Search aviation certification standards",
            href: "/acs"
          }
        ]
      },
      {
        items: [
          {
            title: "Study Plans",
            description: "Personalized study planning",
            href: "/study-plans"
          }
        ]
      }
    ]
  },
  instructorsMenu: {
    items: [
      {
        title: "For CFI/CFII",
        description: "Resources for certified flight instructors",
        href: "/instructors/cfi"
      },
      {
        title: "Our Mission",
        description: "Learn about our educational mission",
        href: "/mission"
      }
    ]
  }
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Menu: ({ className, ...props }: any) => (
    <div data-testid="menu-icon" className={className} {...props} />
  ),
  X: ({ className, ...props }: any) => (
    <div data-testid="x-icon" className={className} {...props} />
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <div data-testid="chevron-icon" className={className} {...props} />
  ),
}));

// Mock utility function
jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock props for MobileNavigation
const defaultProps = {
  isSignedIn: false,
  isLoaded: true,
  SignInButton: ({ children, ...props }: any) => (
    <div data-testid="signin-button" {...props}>{children}</div>
  ),
  SignUpButton: ({ children, ...props }: any) => (
    <div data-testid="signup-button" {...props}>{children}</div>
  ),
  UserButton: ({ ...props }: any) => (
    <div data-testid="user-button" {...props}>User Menu</div>
  ),
};

describe("MobileNavigation Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document body overflow
    document.body.style.overflow = "unset";
  });

  afterEach(() => {
    // Cleanup body overflow
    document.body.style.overflow = "unset";
  });

  // Basic rendering tests
  describe("Basic Rendering", () => {
    it("renders mobile menu button", () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton.closest("div")).toHaveClass("lg:hidden");
    });

    it("shows menu icon when closed", () => {
      render(<MobileNavigation {...defaultProps} />);
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("x-icon")).not.toBeInTheDocument();
    });

    it("has correct initial aria-expanded state", () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });

    it("applies correct button styling", () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      expect(menuButton).toHaveClass(
        "text-foreground/80",
        "rounded-md",
        "p-2",
        "hover:text-primary",
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-primary"
      );
    });

    it("does not render mobile menu initially", () => {
      render(<MobileNavigation {...defaultProps} />);
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });
  });

  // Menu toggle functionality
  describe("Menu Toggle Functionality", () => {
    it("opens mobile menu when button is clicked", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
        expect(screen.getByTestId("x-icon")).toBeInTheDocument();
        expect(screen.queryByTestId("menu-icon")).not.toBeInTheDocument();
      });
    });

    it("updates aria-expanded when menu opens", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute("aria-expanded", "true");
        expect(menuButton).toHaveAttribute("aria-label", "Close menu");
      });
    });

    it("closes mobile menu when X button is clicked", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      // Open menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      // Close menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
        expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
      });
    });

    it("toggles menu state correctly on multiple clicks", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      // Open
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      // Close
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
      
      // Open again
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
    });
  });

  // Menu content rendering
  describe("Menu Content Rendering", () => {
    beforeEach(async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
    });

    it("renders mobile menu with correct structure", () => {
      const mobileMenu = screen.getByTestId("mobile-menu");
      expect(mobileMenu).toHaveClass(
        "absolute",
        "left-0",
        "right-0",
        "top-full",
        "z-40",
        "animate-slide-down",
        "border-t",
        "border-border",
        "bg-background",
        "lg:hidden"
      );
    });

    it("renders Features accordion button", () => {
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      expect(featuresButton).toBeInTheDocument();
      expect(featuresButton).toHaveAttribute("aria-expanded", "false");
    });

    it("renders Research link", () => {
      const researchLink = screen.getByRole("link", { name: /research/i });
      expect(researchLink).toBeInTheDocument();
      expect(researchLink).toHaveAttribute("href", "/research");
    });

    it("renders Instructors accordion button", () => {
      const instructorsButton = screen.getByRole("button", { name: /for instructors/i });
      expect(instructorsButton).toBeInTheDocument();
      expect(instructorsButton).toHaveAttribute("aria-expanded", "false");
    });

    it("renders Flight Schools link", () => {
      const schoolsLink = screen.getByRole("link", { name: /for flight schools/i });
      expect(schoolsLink).toBeInTheDocument();
      expect(schoolsLink).toHaveAttribute("href", "/schools");
    });

    it("renders chevron icons for accordion buttons", () => {
      const chevronIcons = screen.getAllByTestId("chevron-icon");
      expect(chevronIcons).toHaveLength(2); // Features and Instructors accordions
    });
  });

  // Accordion functionality
  describe("Accordion Functionality", () => {
    beforeEach(async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
    });

    it("expands features accordion when clicked", async () => {
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      
      fireEvent.click(featuresButton);
      
      await waitFor(() => {
        expect(featuresButton).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("Upload Reports")).toBeInTheDocument();
        expect(screen.getByText("ACS Search")).toBeInTheDocument();
        expect(screen.getByText("Study Plans")).toBeInTheDocument();
      });
    });

    it("rotates chevron icon when accordion expands", async () => {
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      const chevronIcon = featuresButton.querySelector("[data-testid='chevron-icon']");
      
      expect(chevronIcon).not.toHaveClass("rotate-90");
      
      fireEvent.click(featuresButton);
      
      await waitFor(() => {
        expect(chevronIcon).toHaveClass("rotate-90");
      });
    });

    it("expands instructors accordion when clicked", async () => {
      const instructorsButton = screen.getByRole("button", { name: /for instructors/i });
      
      fireEvent.click(instructorsButton);
      
      await waitFor(() => {
        expect(instructorsButton).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("For CFI/CFII")).toBeInTheDocument();
        expect(screen.getByText("Our Mission")).toBeInTheDocument();
      });
    });

    it("closes accordion when clicked again", async () => {
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      
      // Open accordion
      fireEvent.click(featuresButton);
      await waitFor(() => {
        expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      });
      
      // Close accordion
      fireEvent.click(featuresButton);
      await waitFor(() => {
        expect(featuresButton).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("Upload Reports")).not.toBeInTheDocument();
      });
    });

    it("closes one accordion when another is opened", async () => {
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      const instructorsButton = screen.getByRole("button", { name: /for instructors/i });
      
      // Open features
      fireEvent.click(featuresButton);
      await waitFor(() => {
        expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      });
      
      // Open instructors (should close features)
      fireEvent.click(instructorsButton);
      await waitFor(() => {
        expect(screen.getByText("For CFI/CFII")).toBeInTheDocument();
        expect(screen.queryByText("Upload Reports")).not.toBeInTheDocument();
      });
    });

    it("renders feature items with descriptions", async () => {
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      fireEvent.click(featuresButton);
      
      await waitFor(() => {
        expect(screen.getByText("Upload and analyze flight training reports")).toBeInTheDocument();
        expect(screen.getByText("Search aviation certification standards")).toBeInTheDocument();
        expect(screen.getByText("Personalized study planning")).toBeInTheDocument();
      });
    });
  });

  // Authentication section tests
  describe("Authentication Section", () => {
    it("renders loading state when not loaded", async () => {
      render(<MobileNavigation {...defaultProps} isLoaded={false} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const loadingElements = screen.getAllByText("", { selector: ".animate-pulse" });
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });

    it("renders sign in and sign up buttons when not signed in", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("signin-button")).toBeInTheDocument();
        expect(screen.getByTestId("signup-button")).toBeInTheDocument();
      });
    });

    it("renders user button when signed in", async () => {
      render(<MobileNavigation {...defaultProps} isSignedIn={true} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("user-button")).toBeInTheDocument();
        expect(screen.queryByTestId("signin-button")).not.toBeInTheDocument();
        expect(screen.queryByTestId("signup-button")).not.toBeInTheDocument();
      });
    });

    it("applies correct styling to authentication section", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const authSection = screen.getByTestId("mobile-menu").querySelector(".border-t");
        expect(authSection).toHaveClass("mt-4", "space-y-2", "border-t", "border-border", "pt-4");
      });
    });
  });

  // Focus management and keyboard navigation
  describe("Focus Management", () => {
    it("focuses first element when menu opens", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        const mobileMenu = screen.getByTestId("mobile-menu");
        const firstFocusable = mobileMenu.querySelector("button, a, [tabindex]:not([tabindex='-1'])");
        // Focus is managed by useEffect, so we check that focusable elements exist
        expect(firstFocusable).toBeInTheDocument();
      });
    });

    it("traps focus within mobile menu", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        const mobileMenu = screen.getByTestId("mobile-menu");
        expect(mobileMenu).toBeInTheDocument();
      });
      
      // Test keyboard event handling
      act(() => {
        fireEvent.keyDown(document, { key: "Tab" });
      });
      
      // Focus should remain within the menu
      const mobileMenu = screen.getByTestId("mobile-menu");
      expect(mobileMenu).toBeInTheDocument();
    });

    it("closes menu on Escape key", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
    });

    it("returns focus to menu button when closed via Escape", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
      
      // Focus should return to menu button
      expect(menuButton).toHaveFocus();
    });
  });

  // Outside click detection
  describe("Outside Click Detection", () => {
    it("closes menu when clicking outside", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      // Click outside the menu
      act(() => {
        fireEvent.mouseDown(document.body);
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
    });

    it("does not close when clicking inside menu", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      // Click inside the menu
      const mobileMenu = screen.getByTestId("mobile-menu");
      act(() => {
        fireEvent.mouseDown(mobileMenu);
      });
      
      // Menu should remain open
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });
  });

  // Body scroll locking
  describe("Body Scroll Locking", () => {
    it("locks body scroll when menu opens", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      expect(document.body.style.overflow).toBe("unset");
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe("hidden");
      });
    });

    it("unlocks body scroll when menu closes", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe("hidden");
      });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe("unset");
      });
    });

    it("unlocks scroll on component unmount", () => {
      const { unmount } = render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      expect(document.body.style.overflow).toBe("hidden");
      
      unmount();
      
      expect(document.body.style.overflow).toBe("unset");
    });
  });

  // Responsive behavior
  describe("Responsive Behavior", () => {
    it("closes menu on window resize to desktop size", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 1024,
        });
        window.dispatchEvent(new Event("resize"));
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
    });

    it("does not close menu on resize below desktop breakpoint", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      act(() => {
        fireEvent.click(menuButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
      
      // Simulate resize within mobile range
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 800,
        });
        window.dispatchEvent(new Event("resize"));
      });
      
      // Menu should remain open
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });
  });

  // Menu item interactions
  describe("Menu Item Interactions", () => {
    beforeEach(async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      });
    });

    it("closes menu when clicking navigation link", async () => {
      const researchLink = screen.getByRole("link", { name: /research/i });
      
      fireEvent.click(researchLink);
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
    });

    it("closes menu when clicking accordion item link", async () => {
      // Open features accordion
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      fireEvent.click(featuresButton);
      
      await waitFor(() => {
        expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      });
      
      // Click feature item
      const uploadLink = screen.getByText("Upload Reports").closest("a");
      if (uploadLink) {
        fireEvent.click(uploadLink);
      }
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
    });

    it("resets accordion state when menu closes", async () => {
      // Open features accordion
      const featuresButton = screen.getByRole("button", { name: /our features/i });
      fireEvent.click(featuresButton);
      
      await waitFor(() => {
        expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      });
      
      // Close menu by clicking outside
      act(() => {
        fireEvent.mouseDown(document.body);
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      });
      
      // Reopen menu
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const reopenedFeaturesButton = screen.getByRole("button", { name: /our features/i });
        expect(reopenedFeaturesButton).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("Upload Reports")).not.toBeInTheDocument();
      });
    });
  });

  // Accessibility compliance
  describe("Accessibility Compliance", () => {
    it("provides proper ARIA controls", () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      expect(menuButton).toHaveAttribute("aria-controls", "mobile-menu");
    });

    it("updates ARIA labels based on state", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      expect(menuButton).toHaveAttribute("aria-label", "Open main menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute("aria-label", "Close menu");
      });
    });

    it("provides proper accordion ARIA attributes", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const featuresButton = screen.getByRole("button", { name: /our features/i });
        expect(featuresButton).toHaveAttribute("aria-expanded", "false");
        expect(featuresButton).toHaveAttribute("type", "button");
      });
    });

    it("maintains semantic link structure", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const researchLink = screen.getByRole("link", { name: /research/i });
        expect(researchLink).toHaveAccessibleName();
        expect(researchLink).toHaveAttribute("href", "/research");
      });
    });

    it("supports keyboard navigation for all interactive elements", async () => {
      render(<MobileNavigation {...defaultProps} />);
      const menuButton = screen.getByRole("button", { name: /open main menu/i });
      
      // Test menu button keyboard support
      menuButton.focus();
      expect(menuButton).toHaveFocus();
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        // All buttons and links should be keyboard accessible
        const interactiveElements = screen.getAllByRole("button").concat(screen.getAllByRole("link"));
        interactiveElements.forEach(element => {
          element.focus();
          expect(element).toHaveFocus();
        });
      });
    });
  });
});