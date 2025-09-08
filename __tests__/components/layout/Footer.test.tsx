/**
 * Comprehensive Footer Component Tests
 * Tests for Task 2.2: Layout Components Testing
 * 
 * Coverage Areas:
 * - Footer content and link rendering
 * - Theme toggle functionality
 * - Social media links and external navigation
 * - Responsive layout and grid behavior
 * - Copyright and legal links
 * - Icon rendering and accessibility
 * - Theme state management with next-themes
 * - Footer sections organization
 * - External link attributes and security
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "@/components/layout/Footer";

// Mock next-themes
const mockSetTheme = jest.fn();
const mockUseTheme = {
  theme: "system",
  setTheme: mockSetTheme,
};

jest.mock("next-themes", () => ({
  useTheme: () => mockUseTheme,
}));

// Mock Next.js components
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("next/image", () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Twitter: ({ className, ...props }: any) => (
    <div data-testid="twitter-icon" className={className} {...props} />
  ),
  Linkedin: ({ className, ...props }: any) => (
    <div data-testid="linkedin-icon" className={className} {...props} />
  ),
  Github: ({ className, ...props }: any) => (
    <div data-testid="github-icon" className={className} {...props} />
  ),
  Facebook: ({ className, ...props }: any) => (
    <div data-testid="facebook-icon" className={className} {...props} />
  ),
  Instagram: ({ className, ...props }: any) => (
    <div data-testid="instagram-icon" className={className} {...props} />
  ),
  Monitor: ({ className, ...props }: any) => (
    <div data-testid="monitor-icon" className={className} {...props} />
  ),
  Sun: ({ className, ...props }: any) => (
    <div data-testid="sun-icon" className={className} {...props} />
  ),
  Moon: ({ className, ...props }: any) => (
    <div data-testid="moon-icon" className={className} {...props} />
  ),
}));

describe("Footer Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.theme = "system";
    
    // Mock useState to ensure component mounts
    const mockSetMounted = jest.fn();
    jest.spyOn(React, "useState")
      .mockImplementationOnce(() => [true, mockSetMounted]); // mounted state
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Basic rendering tests
  describe("Basic Rendering", () => {
    it("renders footer container with correct styling", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("bg-gray-900", "text-white");
    });

    it("renders CFIPros logo and description", () => {
      render(<Footer />);
      const logo = screen.getByAltText("CFIPros Logo");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "/images/CFIPros-logo-primary.svg");
      
      const description = screen.getByText(/comprehensive pilot training platform/i);
      expect(description).toBeInTheDocument();
    });

    it("applies correct logo styling for dark background", () => {
      render(<Footer />);
      const logo = screen.getByAltText("CFIPros Logo");
      expect(logo).toHaveClass("brightness-0", "invert");
    });

    it("uses responsive grid layout", () => {
      render(<Footer />);
      const gridContainer = screen.getByRole("contentinfo").querySelector(".grid");
      expect(gridContainer).toHaveClass(
        "grid",
        "grid-cols-1",
        "gap-8",
        "sm:grid-cols-2",
        "lg:grid-cols-4"
      );
    });

    it("returns null when not mounted (SSR safety)", () => {
      // Reset the mock to return false for mounted state
      jest.restoreAllMocks();
      const mockSetMounted = jest.fn();
      jest.spyOn(React, "useState")
        .mockImplementationOnce(() => [false, mockSetMounted]);
      
      const { container } = render(<Footer />);
      expect(container.firstChild).toBeNull();
    });
  });

  // Theme toggle tests
  describe("Theme Toggle", () => {
    it("renders theme toggle section", () => {
      render(<Footer />);
      const themeLabel = screen.getByText("Theme");
      expect(themeLabel).toBeInTheDocument();
      expect(themeLabel).toHaveClass("text-sm", "font-medium", "text-gray-200");
    });

    it("renders all theme options", () => {
      render(<Footer />);
      const systemButton = screen.getByRole("button", { name: /system/i });
      const lightButton = screen.getByRole("button", { name: /light/i });
      const darkButton = screen.getByRole("button", { name: /dark/i });
      
      expect(systemButton).toBeInTheDocument();
      expect(lightButton).toBeInTheDocument();
      expect(darkButton).toBeInTheDocument();
    });

    it("renders theme icons correctly", () => {
      render(<Footer />);
      expect(screen.getByTestId("monitor-icon")).toBeInTheDocument();
      expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
      expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
    });

    it("highlights active theme", () => {
      mockUseTheme.theme = "light";
      render(<Footer />);
      
      const lightButton = screen.getByRole("button", { name: /light/i });
      expect(lightButton).toHaveClass("bg-gray-700", "text-white");
      
      const systemButton = screen.getByRole("button", { name: /system/i });
      expect(systemButton).toHaveClass("text-gray-400", "hover:text-gray-200");
    });

    it("calls setTheme when theme buttons are clicked", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const lightButton = screen.getByRole("button", { name: /light/i });
      await user.click(lightButton);
      expect(mockSetTheme).toHaveBeenCalledWith("light");
      
      const darkButton = screen.getByRole("button", { name: /dark/i });
      await user.click(darkButton);
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
      
      const systemButton = screen.getByRole("button", { name: /system/i });
      await user.click(systemButton);
      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });

    it("applies correct styling for each theme state", () => {
      // Test system theme
      mockUseTheme.theme = "system";
      const { rerender } = render(<Footer />);
      let systemButton = screen.getByRole("button", { name: /system/i });
      expect(systemButton).toHaveClass("bg-gray-700", "text-white");
      
      // Test light theme
      mockUseTheme.theme = "light";
      rerender(<Footer />);
      let lightButton = screen.getByRole("button", { name: /light/i });
      expect(lightButton).toHaveClass("bg-gray-700", "text-white");
      
      // Test dark theme
      mockUseTheme.theme = "dark";
      rerender(<Footer />);
      let darkButton = screen.getByRole("button", { name: /dark/i });
      expect(darkButton).toHaveClass("bg-gray-700", "text-white");
    });
  });

  // Footer sections tests
  describe("Footer Sections", () => {
    it("renders Resources section with all links", () => {
      render(<Footer />);
      const resourcesHeading = screen.getByText("Resources");
      expect(resourcesHeading).toBeInTheDocument();
      expect(resourcesHeading).toHaveClass("text-sm", "font-semibold", "uppercase");
      
      expect(screen.getByRole("link", { name: /acs code database/i })).toHaveAttribute("href", "/acs");
      expect(screen.getByRole("link", { name: /upload reports/i })).toHaveAttribute("href", "/upload");
      expect(screen.getByRole("link", { name: /premium lessons/i })).toHaveAttribute("href", "/lessons");
      expect(screen.getByRole("link", { name: /study plans/i })).toHaveAttribute("href", "/study-plans");
    });

    it("renders Support section with all links", () => {
      render(<Footer />);
      const supportHeading = screen.getByText("Support");
      expect(supportHeading).toBeInTheDocument();
      
      expect(screen.getByRole("link", { name: /help center/i })).toHaveAttribute("href", "/help");
      expect(screen.getByRole("link", { name: /contact us/i })).toHaveAttribute("href", "/contact");
      expect(screen.getByRole("link", { name: /api documentation/i })).toHaveAttribute("href", "/api/docs");
    });

    it("renders Legal section with all links", () => {
      render(<Footer />);
      const legalHeading = screen.getByText("Legal");
      expect(legalHeading).toBeInTheDocument();
      
      expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy");
      expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute("href", "/terms");
      expect(screen.getByRole("link", { name: /security/i })).toHaveAttribute("href", "/security");
      expect(screen.getByRole("link", { name: /cookie policy/i })).toHaveAttribute("href", "/cookies");
      expect(screen.getByRole("link", { name: /sitemap/i })).toHaveAttribute("href", "/sitemap");
    });

    it("applies correct link styling", () => {
      render(<Footer />);
      const resourceLinks = screen.getAllByRole("link").filter(link => 
        link.closest("div")?.querySelector("h3")?.textContent === "Resources"
      );
      
      resourceLinks.forEach(link => {
        expect(link).toHaveClass(
          "text-sm",
          "text-gray-300",
          "transition-colors",
          "hover:text-white"
        );
      });
    });
  });

  // Copyright and bottom section tests
  describe("Copyright and Bottom Section", () => {
    it("renders copyright notice with current year", () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      const copyright = screen.getByText(`© ${currentYear} CFIPros. All rights reserved.`);
      expect(copyright).toBeInTheDocument();
      expect(copyright).toHaveClass("text-sm", "text-gray-300");
    });

    it("renders bottom legal links", () => {
      render(<Footer />);
      // Get the bottom section legal links (not the main Legal section)
      const bottomSection = screen.getByRole("contentinfo").querySelector(".border-t");
      const bottomLinks = bottomSection?.querySelectorAll("a");
      
      expect(bottomLinks?.length).toBe(5); // Cookies, Terms, Privacy, Security, Sitemap
      
      // Check specific bottom links exist
      const bottomLinkTexts = Array.from(bottomLinks || []).map(link => link.textContent);
      expect(bottomLinkTexts).toContain("Cookies");
      expect(bottomLinkTexts).toContain("Terms");
      expect(bottomLinkTexts).toContain("Privacy");
      expect(bottomLinkTexts).toContain("Security");
      expect(bottomLinkTexts).toContain("Sitemap");
    });

    it("applies responsive layout to bottom section", () => {
      render(<Footer />);
      const bottomSection = screen.getByRole("contentinfo").querySelector(".border-t .flex");
      expect(bottomSection).toHaveClass(
        "flex",
        "flex-col",
        "items-center",
        "justify-between",
        "space-y-4",
        "lg:flex-row",
        "lg:space-y-0"
      );
    });
  });

  // Social media links tests
  describe("Social Media Links", () => {
    it("renders all social media links", () => {
      render(<Footer />);
      const twitterLink = screen.getByLabelText("Twitter");
      const linkedinLink = screen.getByLabelText("LinkedIn");
      const githubLink = screen.getByLabelText("GitHub");
      const facebookLink = screen.getByLabelText("Facebook");
      const instagramLink = screen.getByLabelText("Instagram");
      
      expect(twitterLink).toHaveAttribute("href", "https://twitter.com/cfipros");
      expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com/company/cfipros");
      expect(githubLink).toHaveAttribute("href", "https://github.com/cfipros");
      expect(facebookLink).toHaveAttribute("href", "https://facebook.com/cfipros");
      expect(instagramLink).toHaveAttribute("href", "https://instagram.com/cfipros");
    });

    it("renders social media icons", () => {
      render(<Footer />);
      expect(screen.getByTestId("twitter-icon")).toBeInTheDocument();
      expect(screen.getByTestId("linkedin-icon")).toBeInTheDocument();
      expect(screen.getByTestId("github-icon")).toBeInTheDocument();
      expect(screen.getByTestId("facebook-icon")).toBeInTheDocument();
      expect(screen.getByTestId("instagram-icon")).toBeInTheDocument();
    });

    it("applies correct styling to social links", () => {
      render(<Footer />);
      const socialLinks = [
        screen.getByLabelText("Twitter"),
        screen.getByLabelText("LinkedIn"),
        screen.getByLabelText("GitHub"),
        screen.getByLabelText("Facebook"),
        screen.getByLabelText("Instagram"),
      ];
      
      socialLinks.forEach(link => {
        expect(link).toHaveClass(
          "text-gray-300",
          "transition-colors",
          "hover:text-white"
        );
      });
    });

    it("has proper spacing between social icons", () => {
      render(<Footer />);
      const socialContainer = screen.getByLabelText("Twitter").closest(".flex");
      expect(socialContainer).toHaveClass("flex", "space-x-4");
    });
  });

  // Accessibility tests
  describe("Accessibility", () => {
    it("uses semantic footer element", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer.tagName).toBe("FOOTER");
    });

    it("provides aria-labels for social media links", () => {
      render(<Footer />);
      expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
      expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
      expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
      expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
      expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
    });

    it("has proper heading hierarchy", () => {
      render(<Footer />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings).toHaveLength(3); // Resources, Support, Legal
      
      headings.forEach(heading => {
        expect(heading.tagName).toBe("H3");
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      // Test theme button keyboard navigation
      const systemButton = screen.getByRole("button", { name: /system/i });
      systemButton.focus();
      expect(systemButton).toHaveFocus();
      
      await user.keyboard("[Tab]");
      const lightButton = screen.getByRole("button", { name: /light/i });
      expect(lightButton).toHaveFocus();
    });

    it("supports keyboard activation of theme buttons", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const lightButton = screen.getByRole("button", { name: /light/i });
      lightButton.focus();
      
      await user.keyboard("[Enter]");
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("maintains focus management", () => {
      render(<Footer />);
      const themeButtons = screen.getAllByRole("button").filter(btn => 
        ["System", "Light", "Dark"].includes(btn.textContent || "")
      );
      
      themeButtons.forEach(button => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });
  });

  // Responsive design tests
  describe("Responsive Design", () => {
    it("applies responsive grid classes", () => {
      render(<Footer />);
      const grid = screen.getByRole("contentinfo").querySelector(".grid");
      expect(grid).toHaveClass(
        "grid-cols-1",
        "sm:grid-cols-2",
        "lg:grid-cols-4"
      );
    });

    it("applies responsive padding", () => {
      render(<Footer />);
      const container = screen.getByRole("contentinfo").querySelector(".mx-auto");
      expect(container).toHaveClass("px-4", "sm:px-6", "lg:px-8");
    });

    it("applies responsive column spanning", () => {
      render(<Footer />);
      const companySection = screen.getByText("CFIPros Logo").closest(".col-span-1");
      expect(companySection).toHaveClass(
        "col-span-1",
        "sm:col-span-2",
        "lg:col-span-1"
      );
    });

    it("applies responsive flex layout to bottom section", () => {
      render(<Footer />);
      const bottomFlex = screen.getByRole("contentinfo").querySelector(".border-t .flex");
      expect(bottomFlex).toHaveClass(
        "flex-col",
        "lg:flex-row",
        "space-y-4",
        "lg:space-y-0"
      );
    });
  });

  // User interaction tests
  describe("User Interactions", () => {
    it("handles link clicks", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const acsLink = screen.getByRole("link", { name: /acs code database/i });
      await user.click(acsLink);
      expect(acsLink).toHaveAttribute("href", "/acs");
    });

    it("handles external social media links", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const twitterLink = screen.getByLabelText("Twitter");
      await user.click(twitterLink);
      expect(twitterLink).toHaveAttribute("href", "https://twitter.com/cfipros");
    });

    it("handles theme toggle interactions", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const darkButton = screen.getByRole("button", { name: /dark/i });
      await user.click(darkButton);
      
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });

    it("handles rapid theme changes", async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const lightButton = screen.getByRole("button", { name: /light/i });
      const darkButton = screen.getByRole("button", { name: /dark/i });
      
      await user.click(lightButton);
      await user.click(darkButton);
      await user.click(lightButton);
      
      expect(mockSetTheme).toHaveBeenCalledTimes(3);
      expect(mockSetTheme).toHaveBeenLastCalledWith("light");
    });
  });

  // Content and styling tests
  describe("Content and Styling", () => {
    it("applies correct footer background and text colors", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("bg-gray-900", "text-white");
    });

    it("applies correct spacing and padding", () => {
      render(<Footer />);
      const container = screen.getByRole("contentinfo").querySelector(".mx-auto");
      expect(container).toHaveClass("py-12");
    });

    it("applies correct text sizing and spacing", () => {
      render(<Footer />);
      const description = screen.getByText(/comprehensive pilot training platform/i);
      expect(description).toHaveClass("mb-4", "text-sm", "text-gray-300");
    });

    it("maintains visual hierarchy", () => {
      render(<Footer />);
      const sectionHeadings = screen.getAllByRole("heading", { level: 3 });
      
      sectionHeadings.forEach(heading => {
        expect(heading).toHaveClass(
          "mb-4",
          "text-sm",
          "font-semibold",
          "uppercase",
          "tracking-wide"
        );
      });
    });

    it("uses consistent link styling", () => {
      render(<Footer />);
      const allLinks = screen.getAllByRole("link");
      const footerLinks = allLinks.filter(link => 
        !link.closest("a[aria-label]") && // Exclude social links
        !link.href?.includes("images/") && // Exclude logo
        link.closest("footer") // Must be in footer
      );
      
      footerLinks.forEach(link => {
        expect(link).toHaveClass("transition-colors");
      });
    });
  });
});