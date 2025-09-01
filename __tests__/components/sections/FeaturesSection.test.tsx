import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeaturesSection } from "@/components/sections/FeaturesSection";

describe("FeaturesSection", () => {
  it("renders the section heading and description", () => {
    render(<FeaturesSection />);

    const heading = screen.getByRole("heading", {
      name: /Everything you need for flight training success/i,
    });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe("H2");

    const description = screen.getByText(
      /From ACS code discovery to personalized study plans/i
    );
    expect(description).toBeInTheDocument();
  });

  it("displays all six feature cards", () => {
    render(<FeaturesSection />);

    const features = [
      "ACS Code Discovery",
      "Smart Document Analysis",
      "Premium Lessons",
      "Personalized Study Plans",
      "Progress Analytics",
      "Guaranteed Results",
    ];

    features.forEach((feature) => {
      const featureTitle = screen.getByText(feature);
      expect(featureTitle).toBeInTheDocument();
      expect(featureTitle.tagName).toBe("H3");
    });
  });

  it("includes feature descriptions", () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText(/SEO-optimized pages for 200\+ ACS codes/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Upload exam reports for AI-powered/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/In-depth lesson content with progress tracking/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AI-generated study plans tailored/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Track your learning progress/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/95% of our users pass/i)).toBeInTheDocument();
  });

  it("renders feature cards with proper navigation links", () => {
    render(<FeaturesSection />);

    const learnMoreLinks = screen.getAllByText("Learn more");
    expect(learnMoreLinks).toHaveLength(6);

    learnMoreLinks.forEach((link) => {
      expect(link.closest("a")).toHaveAttribute("href");
    });
  });

  it("includes proper feature card links", () => {
    render(<FeaturesSection />);

    // Check specific feature links
    const acsLink = screen
      .getByText("ACS Code Discovery")
      .closest("div")
      ?.querySelector("a");
    expect(acsLink).toHaveAttribute("href", "/acs");

    const uploadLink = screen
      .getByText("Smart Document Analysis")
      .closest("div")
      ?.querySelector("a");
    expect(uploadLink).toHaveAttribute("href", "/upload");

    const premiumLink = screen
      .getByText("Premium Lessons")
      .closest("div")
      ?.querySelector("a");
    expect(premiumLink).toHaveAttribute("href", "/auth/register");
  });

  it("displays feature icons", () => {
    render(<FeaturesSection />);

    // Check for SVG icons (lucide-react icons render as SVGs)
    const featureCards = screen.getAllByText("Learn more");
    featureCards.forEach((card) => {
      const cardContainer = card.closest("div");
      const icon = cardContainer?.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  it("has proper semantic structure", () => {
    render(<FeaturesSection />);

    const section = document.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.tagName).toBe("SECTION");

    // Check for proper heading hierarchy
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toBeInTheDocument();

    const h3s = screen.getAllByRole("heading", { level: 3 });
    expect(h3s).toHaveLength(6);
  });

  it("includes responsive grid layout", () => {
    render(<FeaturesSection />);

    const section = document.querySelector("section");
    const gridContainer = section?.querySelector(".grid.grid-cols-1");
    expect(gridContainer).toBeInTheDocument();
  });

  it("applies hover effects to feature cards", () => {
    render(<FeaturesSection />);

    // Check that cards have hover classes
    const firstFeature = screen
      .getByText("ACS Code Discovery")
      .closest("[class*='group']");
    expect(firstFeature).toHaveClass("group");
    expect(firstFeature).toHaveClass("hover:shadow-lg");
  });

  it("includes proper color coding for features", () => {
    render(<FeaturesSection />);

    // Check that each feature has an icon container with color classes
    const featureCards = screen.getAllByText("Learn more");
    expect(featureCards).toHaveLength(6);

    featureCards.forEach((link) => {
      const cardContainer = link.closest("div");
      const iconContainer = cardContainer?.querySelector("[class*='bg-']");
      expect(iconContainer).toBeInTheDocument();
    });
  });

  it("has accessible link text", () => {
    render(<FeaturesSection />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
      // Each link should have meaningful text or aria-label
      expect(link.textContent).toBeTruthy();
    });
  });

  it("provides proper spacing and layout structure", () => {
    render(<FeaturesSection />);

    const section = document.querySelector("section");
    expect(section).toHaveClass("py-16", "sm:py-24", "bg-gray-50");

    const container = section?.querySelector(".mx-auto.max-w-7xl");
    expect(container).toBeInTheDocument();

    const contentContainer = section?.querySelector(
      ".mx-auto.max-w-2xl.text-center"
    );
    expect(contentContainer).toBeInTheDocument();
  });
});
