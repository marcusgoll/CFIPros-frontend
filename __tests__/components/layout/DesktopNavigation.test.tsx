/**
 * Comprehensive DesktopNavigation Component Tests
 * Tests for Task 2.2: Layout Components Testing
 * 
 * Coverage Areas:
 * - Desktop navigation menu rendering
 * - NavigationMenu component integration
 * - Features mega menu functionality
 * - Dynamic content from navigation config
 * - Icon rendering with Lucide React
 * - Menu triggers and content visibility
 * - Accessibility features and keyboard navigation
 * - Responsive design (desktop-only component)
 * - User interaction handling
 * - Dynamic grid layout based on columns
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopNavigation } from "@/components/layout/Navigation/DesktopNavigation";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock navigation config
jest.mock("@/lib/config/navigation", () => ({
  featuresMenu: {
    title: "Our Features",
    columns: [
      {
        items: [
          {
            title: "Upload Reports",
            description: "Upload and analyze flight training reports",
            href: "/upload",
            icon: "Upload"
          },
          {
            title: "ACS Search",
            description: "Search aviation certification standards",
            href: "/acs",
            icon: "Search"
          }
        ]
      },
      {
        items: [
          {
            title: "Study Plans",
            description: "Personalized study planning",
            href: "/study-plans",
            icon: "BookOpen"
          },
          {
            title: "Progress Tracking",
            description: "Track your learning progress",
            href: "/progress",
            icon: "TrendingUp"
          }
        ]
      }
    ]
  }
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  NavigationMenu: ({ children, ...props }: any) => (
    <nav data-testid="navigation-menu" {...props}>
      {children}
    </nav>
  ),
  NavigationMenuList: ({ children, ...props }: any) => (
    <ul data-testid="navigation-menu-list" {...props}>
      {children}
    </ul>
  ),
  NavigationMenuItem: ({ children, ...props }: any) => (
    <li data-testid="navigation-menu-item" {...props}>
      {children}
    </li>
  ),
  NavigationMenuTrigger: ({ children, className, ...props }: any) => (
    <button data-testid="navigation-menu-trigger" className={className} {...props}>
      {children}
    </button>
  ),
  NavigationMenuContent: ({ children, ...props }: any) => (
    <div data-testid="navigation-menu-content" {...props}>
      {children}
    </div>
  ),
  NavigationMenuLink: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return React.cloneElement(children, { "data-testid": "navigation-menu-link", ...props });
    }
    return (
      <div data-testid="navigation-menu-link" {...props}>
        {children}
      </div>
    );
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => {
  const mockIcon = ({ className, ...props }: any) => (
    <div data-testid="mock-icon" className={className} {...props} />
  );

  return {
    Upload: mockIcon,
    Search: mockIcon,
    BookOpen: mockIcon,
    TrendingUp: mockIcon,
  };
});

describe("DesktopNavigation Component", () => {
  // Basic rendering tests
  describe("Basic Rendering", () => {
    it("renders the desktop navigation container", () => {
      render(<DesktopNavigation />);
      const container = screen.getByTestId("navigation-menu").parentElement;
      expect(container).toHaveClass("hidden", "items-center", "lg:flex");
    });

    it("renders NavigationMenu component", () => {
      render(<DesktopNavigation />);
      expect(screen.getByTestId("navigation-menu")).toBeInTheDocument();
    });

    it("renders NavigationMenuList", () => {
      render(<DesktopNavigation />);
      expect(screen.getByTestId("navigation-menu-list")).toBeInTheDocument();
    });

    it("renders navigation menu items", () => {
      render(<DesktopNavigation />);
      const menuItems = screen.getAllByTestId("navigation-menu-item");
      expect(menuItems).toHaveLength(2); // Features menu + Research link
    });

    it("hides on mobile and shows on large screens", () => {
      render(<DesktopNavigation />);
      const container = screen.getByTestId("navigation-menu").parentElement;
      expect(container).toHaveClass("hidden", "lg:flex");
    });
  });

  // Features menu tests
  describe("Features Menu", () => {
    it("renders features menu trigger", () => {
      render(<DesktopNavigation />);
      const featuresTrigger = screen.getByTestId("navigation-menu-trigger");
      expect(featuresTrigger).toHaveTextContent("Our Features");
    });

    it("applies correct styling to features trigger", () => {
      render(<DesktopNavigation />);
      const featuresTrigger = screen.getByTestId("navigation-menu-trigger");
      expect(featuresTrigger).toHaveClass(
        "text-foreground/80",
        "hover:text-primary"
      );
    });

    it("renders features menu content", () => {
      render(<DesktopNavigation />);
      expect(screen.getByTestId("navigation-menu-content")).toBeInTheDocument();
    });

    it("applies correct content container styling", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const contentContainer = menuContent.querySelector(".min-w-\\[600px\\]");
      expect(contentContainer).toHaveClass("min-w-[600px]", "p-6");
    });

    it("creates dynamic grid layout based on columns", () => {
      render(<DesktopNavigation />);
      const gridContainer = screen.getByTestId("navigation-menu-content").querySelector(".grid");
      expect(gridContainer).toHaveClass("grid", "gap-8");
      
      // Should have 2 columns based on our mock data
      expect(gridContainer).toHaveStyle({
        gridTemplateColumns: "repeat(2, minmax(250px, 1fr))"
      });
    });

    it("renders all feature items from config", () => {
      render(<DesktopNavigation />);
      
      expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      expect(screen.getByText("ACS Search")).toBeInTheDocument();
      expect(screen.getByText("Study Plans")).toBeInTheDocument();
      expect(screen.getByText("Progress Tracking")).toBeInTheDocument();
    });

    it("renders feature item descriptions", () => {
      render(<DesktopNavigation />);
      
      expect(screen.getByText("Upload and analyze flight training reports")).toBeInTheDocument();
      expect(screen.getByText("Search aviation certification standards")).toBeInTheDocument();
      expect(screen.getByText("Personalized study planning")).toBeInTheDocument();
      expect(screen.getByText("Track your learning progress")).toBeInTheDocument();
    });

    it("renders feature item icons", () => {
      render(<DesktopNavigation />);
      const icons = screen.getAllByTestId("mock-icon");
      expect(icons).toHaveLength(4); // One for each feature item
    });

    it("applies correct icon styling", () => {
      render(<DesktopNavigation />);
      const icons = screen.getAllByTestId("mock-icon");
      icons.forEach(icon => {
        expect(icon).toHaveClass("h-5", "w-5");
      });
    });

    it("creates proper link structure for feature items", () => {
      render(<DesktopNavigation />);
      const featureLinks = screen.getAllByTestId("navigation-menu-link");
      
      // Should have links for all feature items plus research
      expect(featureLinks.length).toBeGreaterThan(0);
    });

    it("applies correct link styling to feature items", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const featureLinks = menuContent.querySelectorAll("a");
      
      featureLinks.forEach(link => {
        expect(link).toHaveClass(
          "hover:bg-accent/50",
          "group",
          "block",
          "flex",
          "items-start",
          "space-x-3",
          "rounded-md",
          "p-3",
          "transition-colors"
        );
      });
    });
  });

  // Research menu tests
  describe("Research Menu", () => {
    it("renders research menu item", () => {
      render(<DesktopNavigation />);
      const researchLink = screen.getByRole("link", { name: /research/i });
      expect(researchLink).toBeInTheDocument();
    });

    it("sets correct href for research link", () => {
      render(<DesktopNavigation />);
      const researchLink = screen.getByRole("link", { name: /research/i });
      expect(researchLink).toHaveAttribute("href", "/research");
    });

    it("applies correct styling to research link", () => {
      render(<DesktopNavigation />);
      const researchLink = screen.getByRole("link", { name: /research/i });
      expect(researchLink).toHaveClass(
        "text-foreground/80",
        "inline-flex",
        "h-10",
        "w-max",
        "items-center",
        "justify-center",
        "rounded-md",
        "px-4",
        "py-2",
        "text-sm",
        "font-medium",
        "transition-colors",
        "hover:bg-accent",
        "hover:text-primary"
      );
    });

    it("uses NavigationMenuLink wrapper", () => {
      render(<DesktopNavigation />);
      // The research link should be wrapped in NavigationMenuLink
      const menuItems = screen.getAllByTestId("navigation-menu-item");
      expect(menuItems).toHaveLength(2); // Features and Research
    });
  });

  // User interaction tests
  describe("User Interactions", () => {
    it("handles feature menu trigger clicks", async () => {
      const user = userEvent.setup();
      render(<DesktopNavigation />);
      
      const featuresTrigger = screen.getByTestId("navigation-menu-trigger");
      await user.click(featuresTrigger);
      
      expect(featuresTrigger).toBeInTheDocument();
    });

    it("handles research link clicks", async () => {
      const user = userEvent.setup();
      render(<DesktopNavigation />);
      
      const researchLink = screen.getByRole("link", { name: /research/i });
      await user.click(researchLink);
      
      expect(researchLink).toHaveAttribute("href", "/research");
    });

    it("handles feature item link clicks", async () => {
      const user = userEvent.setup();
      render(<DesktopNavigation />);
      
      const uploadLink = screen.getByText("Upload Reports").closest("a");
      expect(uploadLink).toHaveAttribute("href", "/upload");
      
      if (uploadLink) {
        await user.click(uploadLink);
        expect(uploadLink).toHaveAttribute("href", "/upload");
      }
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<DesktopNavigation />);
      
      const featuresTrigger = screen.getByTestId("navigation-menu-trigger");
      featuresTrigger.focus();
      expect(featuresTrigger).toHaveFocus();
      
      await user.tab();
      const researchLink = screen.getByRole("link", { name: /research/i });
      expect(researchLink).toHaveFocus();
    });

    it("handles hover interactions", async () => {
      const user = userEvent.setup();
      render(<DesktopNavigation />);
      
      const featuresTrigger = screen.getByTestId("navigation-menu-trigger");
      await user.hover(featuresTrigger);
      
      expect(featuresTrigger).toHaveClass("hover:text-primary");
    });
  });

  // Accessibility tests
  describe("Accessibility", () => {
    it("uses semantic navigation structure", () => {
      render(<DesktopNavigation />);
      const nav = screen.getByTestId("navigation-menu");
      expect(nav.tagName).toBe("NAV");
    });

    it("provides accessible button for menu trigger", () => {
      render(<DesktopNavigation />);
      const trigger = screen.getByTestId("navigation-menu-trigger");
      expect(trigger.tagName).toBe("BUTTON");
      expect(trigger).toHaveAccessibleName();
    });

    it("provides accessible links for all navigation items", () => {
      render(<DesktopNavigation />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("maintains proper heading hierarchy", () => {
      render(<DesktopNavigation />);
      // Feature items should have proper title structure
      const titles = screen.getAllByText(/Upload Reports|ACS Search|Study Plans|Progress Tracking/);
      titles.forEach(title => {
        expect(title).toBeInTheDocument();
      });
    });

    it("supports keyboard interaction", () => {
      render(<DesktopNavigation />);
      const focusableElements = screen.getAllByRole("button").concat(screen.getAllByRole("link"));
      
      focusableElements.forEach(element => {
        element.focus();
        expect(element).toHaveFocus();
      });
    });

    it("provides descriptive text for feature items", () => {
      render(<DesktopNavigation />);
      
      // Each feature item should have both title and description
      expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      expect(screen.getByText("Upload and analyze flight training reports")).toBeInTheDocument();
    });
  });

  // Content structure tests
  describe("Content Structure", () => {
    it("organizes feature items in columns", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const columns = menuContent.querySelectorAll(".space-y-2");
      expect(columns).toHaveLength(2); // Based on our mock config
    });

    it("applies correct spacing to feature columns", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const columns = menuContent.querySelectorAll(".space-y-2");
      
      columns.forEach(column => {
        expect(column).toHaveClass("space-y-2");
      });
    });

    it("renders feature items with proper structure", () => {
      render(<DesktopNavigation />);
      
      // Check that each feature item has icon container and text container
      const menuContent = screen.getByTestId("navigation-menu-content");
      const featureLinks = menuContent.querySelectorAll("a");
      
      expect(featureLinks.length).toBe(4); // 4 feature items from our mock
    });

    it("applies correct styling to feature item content", () => {
      render(<DesktopNavigation />);
      
      // Check title styling
      const titles = screen.getAllByText(/Upload Reports|ACS Search|Study Plans|Progress Tracking/);
      titles.forEach(title => {
        expect(title).toHaveClass(
          "font-medium",
          "text-foreground",
          "group-hover:text-primary"
        );
      });
    });

    it("applies correct styling to feature descriptions", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const descriptions = menuContent.querySelectorAll(".text-sm.text-muted-foreground");
      
      descriptions.forEach(desc => {
        expect(desc).toHaveClass("mt-1", "text-sm", "text-muted-foreground");
      });
    });
  });

  // Icon integration tests
  describe("Icon Integration", () => {
    it("renders icons for feature items with icons", () => {
      render(<DesktopNavigation />);
      const icons = screen.getAllByTestId("mock-icon");
      expect(icons).toHaveLength(4); // All feature items have icons
    });

    it("applies correct icon container styling", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const iconContainers = menuContent.querySelectorAll(".text-primary-600");
      
      iconContainers.forEach(container => {
        expect(container).toHaveClass(
          "text-primary-600",
          "mt-1",
          "flex-shrink-0"
        );
      });
    });

    it("handles missing icons gracefully", () => {
      // Mock config with an item without an icon
      jest.doMock("@/lib/config/navigation", () => ({
        featuresMenu: {
          title: "Our Features",
          columns: [
            {
              items: [
                {
                  title: "No Icon Item",
                  description: "Item without icon",
                  href: "/no-icon",
                  // No icon property
                }
              ]
            }
          ]
        }
      }));

      render(<DesktopNavigation />);
      expect(screen.getByText("No Icon Item")).toBeInTheDocument();
    });

    it("dynamically loads icons from lucide-react", () => {
      render(<DesktopNavigation />);
      // Icons should be loaded based on the icon string from config
      // This is tested through the presence of mock icons
      const icons = screen.getAllByTestId("mock-icon");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  // Responsive design tests
  describe("Responsive Design", () => {
    it("hides on mobile screens", () => {
      render(<DesktopNavigation />);
      const container = screen.getByTestId("navigation-menu").parentElement;
      expect(container).toHaveClass("hidden");
    });

    it("shows on large screens and above", () => {
      render(<DesktopNavigation />);
      const container = screen.getByTestId("navigation-menu").parentElement;
      expect(container).toHaveClass("lg:flex");
    });

    it("applies correct responsive menu content width", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const contentContainer = menuContent.querySelector("div");
      expect(contentContainer).toHaveClass("min-w-[600px]");
    });

    it("uses flexible grid layout for different column counts", () => {
      render(<DesktopNavigation />);
      const menuContent = screen.getByTestId("navigation-menu-content");
      const grid = menuContent.querySelector(".grid");
      
      // Grid should adapt based on the number of columns in config
      expect(grid).toHaveClass("grid", "gap-8");
    });
  });

  // Integration tests
  describe("Component Integration", () => {
    it("integrates with NavigationMenu UI components", () => {
      render(<DesktopNavigation />);
      
      expect(screen.getByTestId("navigation-menu")).toBeInTheDocument();
      expect(screen.getByTestId("navigation-menu-list")).toBeInTheDocument();
      expect(screen.getAllByTestId("navigation-menu-item")).toHaveLength(2);
      expect(screen.getByTestId("navigation-menu-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("navigation-menu-content")).toBeInTheDocument();
    });

    it("integrates with navigation configuration", () => {
      render(<DesktopNavigation />);
      
      // Should render content from featuresMenu config
      expect(screen.getByText("Our Features")).toBeInTheDocument();
      expect(screen.getByText("Upload Reports")).toBeInTheDocument();
      expect(screen.getByText("Study Plans")).toBeInTheDocument();
    });

    it("integrates with Next.js Link component", () => {
      render(<DesktopNavigation />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveAttribute("href");
      });
    });

    it("integrates with Lucide React icons", () => {
      render(<DesktopNavigation />);
      const icons = screen.getAllByTestId("mock-icon");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("maintains consistent styling with design system", () => {
      render(<DesktopNavigation />);
      
      // Uses consistent color classes
      const trigger = screen.getByTestId("navigation-menu-trigger");
      expect(trigger).toHaveClass("text-foreground/80", "hover:text-primary");
      
      const researchLink = screen.getByRole("link", { name: /research/i });
      expect(researchLink).toHaveClass("text-foreground/80", "hover:text-primary");
    });
  });
});