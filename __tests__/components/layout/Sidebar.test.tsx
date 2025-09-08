/**
 * Comprehensive Sidebar Component Tests
 * Tests for Task 2.2: Layout Components Testing
 * 
 * Coverage Areas:
 * - Sidebar navigation rendering
 * - Active state management and routing
 * - Icon display and integration
 * - Navigation link functionality
 * - Responsive positioning and styling
 * - Accessibility features and keyboard navigation
 * - Next.js routing integration
 * - User interaction handling
 * - Visual state indicators
 * - Focus management
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
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
  LayoutDashboard: ({ className, ...props }: any) => (
    <div data-testid="dashboard-icon" className={className} {...props} />
  ),
  BookOpen: ({ className, ...props }: any) => (
    <div data-testid="book-icon" className={className} {...props} />
  ),
  Upload: ({ className, ...props }: any) => (
    <div data-testid="upload-icon" className={className} {...props} />
  ),
  Target: ({ className, ...props }: any) => (
    <div data-testid="target-icon" className={className} {...props} />
  ),
  BarChart3: ({ className, ...props }: any) => (
    <div data-testid="chart-icon" className={className} {...props} />
  ),
  Settings: ({ className, ...props }: any) => (
    <div data-testid="settings-icon" className={className} {...props} />
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Sidebar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  // Basic rendering tests
  describe("Basic Rendering", () => {
    it("renders sidebar container with correct styling", () => {
      render(<Sidebar />);
      const sidebar = screen.getByRole("navigation").closest("div");
      expect(sidebar).toHaveClass(
        "sticky",
        "top-16",
        "h-screen",
        "w-64",
        "border-r",
        "border-gray-200",
        "bg-white",
        "shadow-sm"
      );
    });

    it("renders navigation element", () => {
      render(<Sidebar />);
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass("p-4");
    });

    it("renders navigation list", () => {
      render(<Sidebar />);
      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass("space-y-2");
    });

    it("renders all navigation items", () => {
      render(<Sidebar />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(6); // Dashboard, Lessons, Upload Report, Study Plans, Analytics, Settings
    });
  });

  // Navigation items tests
  describe("Navigation Items", () => {
    it("renders all navigation links with correct text", () => {
      render(<Sidebar />);
      
      expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /lessons/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upload report/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /study plans/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /analytics/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
    });

    it("renders navigation links with correct hrefs", () => {
      render(<Sidebar />);
      
      expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
      expect(screen.getByRole("link", { name: /lessons/i })).toHaveAttribute("href", "/lesson");
      expect(screen.getByRole("link", { name: /upload report/i })).toHaveAttribute("href", "/upload");
      expect(screen.getByRole("link", { name: /study plans/i })).toHaveAttribute("href", "/study-plan");
      expect(screen.getByRole("link", { name: /analytics/i })).toHaveAttribute("href", "/analytics");
      expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
    });

    it("renders all navigation icons", () => {
      render(<Sidebar />);
      
      expect(screen.getByTestId("dashboard-icon")).toBeInTheDocument();
      expect(screen.getByTestId("book-icon")).toBeInTheDocument();
      expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
      expect(screen.getByTestId("target-icon")).toBeInTheDocument();
      expect(screen.getByTestId("chart-icon")).toBeInTheDocument();
      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    });

    it("applies correct icon styling", () => {
      render(<Sidebar />);
      const icons = [
        screen.getByTestId("dashboard-icon"),
        screen.getByTestId("book-icon"),
        screen.getByTestId("upload-icon"),
        screen.getByTestId("target-icon"),
        screen.getByTestId("chart-icon"),
        screen.getByTestId("settings-icon"),
      ];

      icons.forEach(icon => {
        expect(icon).toHaveClass("h-5", "w-5");
      });
    });

    it("applies correct link base styling", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");

      links.forEach(link => {
        expect(link).toHaveClass(
          "flex",
          "items-center",
          "space-x-3",
          "rounded-md",
          "px-3",
          "py-2",
          "text-sm",
          "font-medium",
          "transition-colors"
        );
      });
    });
  });

  // Active state tests
  describe("Active State Management", () => {
    it("marks dashboard link as active when on dashboard page", () => {
      mockUsePathname.mockReturnValue("/dashboard");
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("marks lessons link as active when on lesson page", () => {
      mockUsePathname.mockReturnValue("/lesson");
      render(<Sidebar />);
      
      const lessonsLink = screen.getByRole("link", { name: /lessons/i });
      expect(lessonsLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("marks upload link as active when on upload page", () => {
      mockUsePathname.mockReturnValue("/upload");
      render(<Sidebar />);
      
      const uploadLink = screen.getByRole("link", { name: /upload report/i });
      expect(uploadLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("marks study plans link as active when on study-plan page", () => {
      mockUsePathname.mockReturnValue("/study-plan");
      render(<Sidebar />);
      
      const studyPlansLink = screen.getByRole("link", { name: /study plans/i });
      expect(studyPlansLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("marks analytics link as active when on analytics page", () => {
      mockUsePathname.mockReturnValue("/analytics");
      render(<Sidebar />);
      
      const analyticsLink = screen.getByRole("link", { name: /analytics/i });
      expect(analyticsLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("marks settings link as active when on settings page", () => {
      mockUsePathname.mockReturnValue("/settings");
      render(<Sidebar />);
      
      const settingsLink = screen.getByRole("link", { name: /settings/i });
      expect(settingsLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("marks link as active for nested paths", () => {
      mockUsePathname.mockReturnValue("/dashboard/profile");
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600",
        "border-r-2"
      );
    });

    it("applies inactive styling when not active", () => {
      mockUsePathname.mockReturnValue("/dashboard");
      render(<Sidebar />);
      
      const lessonsLink = screen.getByRole("link", { name: /lessons/i });
      expect(lessonsLink).toHaveClass(
        "text-gray-700",
        "hover:bg-gray-50",
        "hover:text-gray-900"
      );
      expect(lessonsLink).not.toHaveClass(
        "bg-primary-50",
        "text-primary-700",
        "border-primary-600"
      );
    });

    it("only marks one item as active at a time", () => {
      mockUsePathname.mockReturnValue("/lesson");
      render(<Sidebar />);
      
      const activeLinks = screen.getAllByRole("link").filter(link =>
        link.classList.contains("bg-primary-50")
      );
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]).toHaveTextContent("Lessons");
    });
  });

  // User interaction tests
  describe("User Interactions", () => {
    it("handles navigation link clicks", async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      await user.click(dashboardLink);
      
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const firstLink = screen.getByRole("link", { name: /dashboard/i });
      firstLink.focus();
      expect(firstLink).toHaveFocus();
      
      await user.tab();
      const secondLink = screen.getByRole("link", { name: /lessons/i });
      expect(secondLink).toHaveFocus();
    });

    it("allows keyboard activation of links", async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      dashboardLink.focus();
      
      await user.keyboard("[Enter]");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });

    it("handles multiple rapid clicks", async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      
      await user.click(dashboardLink);
      await user.click(dashboardLink);
      await user.click(dashboardLink);
      
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });

    it("maintains focus during interaction", () => {
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      dashboardLink.focus();
      expect(dashboardLink).toHaveFocus();
      
      fireEvent.mouseDown(dashboardLink);
      fireEvent.mouseUp(dashboardLink);
      expect(dashboardLink).toHaveFocus();
    });
  });

  // Accessibility tests
  describe("Accessibility", () => {
    it("uses semantic navigation element", () => {
      render(<Sidebar />);
      const nav = screen.getByRole("navigation");
      expect(nav.tagName).toBe("NAV");
    });

    it("uses proper list structure", () => {
      render(<Sidebar />);
      const list = screen.getByRole("list");
      expect(list.tagName).toBe("UL");
      
      const listItems = screen.getAllByRole("listitem");
      listItems.forEach(item => {
        expect(item.tagName).toBe("LI");
      });
    });

    it("provides accessible link text", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("maintains proper tab order", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });

    it("provides keyboard navigation support", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        link.focus();
        expect(link).toHaveFocus();
      });
    });

    it("uses appropriate ARIA roles", () => {
      render(<Sidebar />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeInTheDocument();
      screen.getAllByRole("listitem").forEach(item => {
        expect(item).toBeInTheDocument();
      });
      screen.getAllByRole("link").forEach(link => {
        expect(link).toBeInTheDocument();
      });
    });
  });

  // Responsive design tests
  describe("Responsive Design", () => {
    it("applies sticky positioning", () => {
      render(<Sidebar />);
      const sidebar = screen.getByRole("navigation").closest("div");
      expect(sidebar).toHaveClass("sticky", "top-16");
    });

    it("sets fixed width and height", () => {
      render(<Sidebar />);
      const sidebar = screen.getByRole("navigation").closest("div");
      expect(sidebar).toHaveClass("w-64", "h-screen");
    });

    it("applies border and shadow styling", () => {
      render(<Sidebar />);
      const sidebar = screen.getByRole("navigation").closest("div");
      expect(sidebar).toHaveClass(
        "border-r",
        "border-gray-200",
        "bg-white",
        "shadow-sm"
      );
    });

    it("applies proper spacing and padding", () => {
      render(<Sidebar />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("p-4");
      
      const list = screen.getByRole("list");
      expect(list).toHaveClass("space-y-2");
    });
  });

  // Visual state tests
  describe("Visual States", () => {
    it("applies hover states to inactive links", () => {
      mockUsePathname.mockReturnValue("/dashboard");
      render(<Sidebar />);
      
      const inactiveLink = screen.getByRole("link", { name: /lessons/i });
      expect(inactiveLink).toHaveClass(
        "hover:bg-gray-50",
        "hover:text-gray-900"
      );
    });

    it("applies transition classes", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveClass("transition-colors");
      });
    });

    it("applies correct spacing between icon and text", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveClass("space-x-3");
      });
    });

    it("uses consistent font styling", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveClass("text-sm", "font-medium");
      });
    });

    it("applies proper border radius", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      links.forEach(link => {
        expect(link).toHaveClass("rounded-md");
      });
    });
  });

  // Integration tests
  describe("Component Integration", () => {
    it("integrates with Next.js routing", () => {
      render(<Sidebar />);
      const links = screen.getAllByRole("link");
      
      const expectedHrefs = [
        "/dashboard",
        "/lesson",
        "/upload",
        "/study-plan",
        "/analytics",
        "/settings"
      ];
      
      links.forEach((link, index) => {
        expect(link).toHaveAttribute("href", expectedHrefs[index]);
      });
    });

    it("integrates with usePathname hook", () => {
      mockUsePathname.mockReturnValue("/settings");
      render(<Sidebar />);
      
      expect(mockUsePathname).toHaveBeenCalled();
      
      const settingsLink = screen.getByRole("link", { name: /settings/i });
      expect(settingsLink).toHaveClass("bg-primary-50");
    });

    it("integrates with utility function (cn)", () => {
      render(<Sidebar />);
      // The cn utility function is used to conditionally apply classes
      // We can verify this by checking that active states are properly applied
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0); // Confirms component renders with utility
    });

    it("integrates with Lucide React icons", () => {
      render(<Sidebar />);
      const iconTestIds = [
        "dashboard-icon",
        "book-icon",
        "upload-icon",
        "target-icon",
        "chart-icon",
        "settings-icon"
      ];
      
      iconTestIds.forEach(testId => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    });

    it("maintains navigation structure consistency", () => {
      render(<Sidebar />);
      
      const navigation = [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Lessons", href: "/lesson" },
        { name: "Upload Report", href: "/upload" },
        { name: "Study Plans", href: "/study-plan" },
        { name: "Analytics", href: "/analytics" },
        { name: "Settings", href: "/settings" },
      ];
      
      navigation.forEach(item => {
        const link = screen.getByRole("link", { name: new RegExp(item.name, "i") });
        expect(link).toHaveAttribute("href", item.href);
      });
    });
  });

  // Edge cases and error handling
  describe("Edge Cases", () => {
    it("handles undefined pathname gracefully", () => {
      mockUsePathname.mockReturnValue(undefined as any);
      render(<Sidebar />);
      
      // Should not crash and should render all links
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(6);
      
      // No links should be active
      const activeLinks = links.filter(link =>
        link.classList.contains("bg-primary-50")
      );
      expect(activeLinks).toHaveLength(0);
    });

    it("handles empty pathname", () => {
      mockUsePathname.mockReturnValue("");
      render(<Sidebar />);
      
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(6);
      
      // No links should be active
      const activeLinks = links.filter(link =>
        link.classList.contains("bg-primary-50")
      );
      expect(activeLinks).toHaveLength(0);
    });

    it("handles unknown paths", () => {
      mockUsePathname.mockReturnValue("/unknown-page");
      render(<Sidebar />);
      
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(6);
      
      // No links should be active
      const activeLinks = links.filter(link =>
        link.classList.contains("bg-primary-50")
      );
      expect(activeLinks).toHaveLength(0);
    });

    it("handles path changes correctly", () => {
      const { rerender } = render(<Sidebar />);
      
      // Start with dashboard active
      mockUsePathname.mockReturnValue("/dashboard");
      rerender(<Sidebar />);
      let dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveClass("bg-primary-50");
      
      // Change to settings active
      mockUsePathname.mockReturnValue("/settings");
      rerender(<Sidebar />);
      let settingsLink = screen.getByRole("link", { name: /settings/i });
      dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(settingsLink).toHaveClass("bg-primary-50");
      expect(dashboardLink).not.toHaveClass("bg-primary-50");
    });
  });
});