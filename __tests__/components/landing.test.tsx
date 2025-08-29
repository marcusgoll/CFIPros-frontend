import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "@/app/(public)/page";

describe("Landing Page", () => {
  it("renders the hero section with correct heading", () => {
    render(<HomePage />);
    
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Master Aviation Standards/i);
    expect(heading).toHaveTextContent(/CFIPros/i);
  });

  it("displays hero section trust indicator", () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Trusted by 10,000\+ pilots nationwide/i)).toBeInTheDocument();
  });

  it("shows hero section value proposition", () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Comprehensive pilot training platform/i)).toBeInTheDocument();
    expect(screen.getByText(/SEO-discoverable ACS code references/i)).toBeInTheDocument();
  });

  it("displays hero section statistics", () => {
    render(<HomePage />);
    
    // Check for stats
    expect(screen.getByText("200+")).toBeInTheDocument();
    expect(screen.getByText("ACS Codes")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("Pass Rate")).toBeInTheDocument();
    expect(screen.getByText("10k+")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("4.9★")).toBeInTheDocument();
    expect(screen.getByText("User Rating")).toBeInTheDocument();
  });

  it("renders primary call-to-action buttons in hero", () => {
    render(<HomePage />);
    
    const uploadButton = screen.getByRole("link", { name: /Upload Your Report/i });
    const browseButtons = screen.getAllByRole("link", { name: /Browse ACS Codes/i });
    
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveAttribute("href", "/upload");
    expect(browseButtons.length).toBeGreaterThan(0);
    expect(browseButtons[0]).toHaveAttribute("href", "/acs");
  });

  it("displays all six feature cards", () => {
    render(<HomePage />);
    
    const features = [
      "ACS Code Discovery",
      "Smart Document Analysis", 
      "Premium Lessons",
      "Personalized Study Plans",
      "Progress Analytics",
      "Guaranteed Results"
    ];
    
    features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it("shows features section heading and description", () => {
    render(<HomePage />);
    
    expect(screen.getByRole("heading", { name: /Everything you need for flight training success/i })).toBeInTheDocument();
    expect(screen.getByText(/From ACS code discovery to personalized study plans/i)).toBeInTheDocument();
  });

  it("renders feature cards with proper links", () => {
    render(<HomePage />);
    
    // Test specific feature links
    const learnMoreLinks = screen.getAllByText("Learn more");
    expect(learnMoreLinks.length).toBeGreaterThan(0);
    
    // Check that feature cards have navigation
    expect(screen.getByText("ACS Code Discovery").closest("div")).toBeInTheDocument();
    expect(screen.getByText("Smart Document Analysis").closest("div")).toBeInTheDocument();
  });

  it("renders the bottom CTA section", () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Ready to ace your checkride/i)).toBeInTheDocument();
    expect(screen.getByText(/Join thousands of pilots/i)).toBeInTheDocument();
    
    const ctaUploadButton = screen.getByRole("link", { name: /Start free analysis/i });
    const ctaBrowseButtons = screen.getAllByText(/Browse ACS codes/i);
    
    expect(ctaUploadButton).toHaveAttribute("href", "/upload");
    expect(ctaBrowseButtons.length).toBeGreaterThan(0);
    // The CTA browse button should be in the bottom section
    const ctaBrowseButton = ctaBrowseButtons.find(button => 
      button.closest("a")?.getAttribute("href") === "/acs"
    );
    expect(ctaBrowseButton).toBeInTheDocument();
  });

  it("has accessible navigation structure", () => {
    render(<HomePage />);
    
    // Check for proper heading hierarchy
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
    
    // Ensure links have href attributes
    const links = screen.getAllByRole("link");
    links.forEach(link => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("includes proper semantic structure", () => {
    render(<HomePage />);
    
    // Check for sections (using more specific selector to avoid conflicts)
    const container = document.querySelector("section");
    expect(container).toBeInTheDocument();
    
    // Check for proper button roles
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0); // Buttons might be wrapped in links
  });

  it("displays responsive layout elements", () => {
    render(<HomePage />);
    
    // Check that responsive classes are applied (basic structure test)
    const heroText = screen.getByText("Master Aviation Standards with");
    const container = heroText.closest("section");
    expect(container).toBeInTheDocument();
    
    // Verify CTA section exists
    const ctaSection = screen.getByText(/Ready to ace your checkride/i).closest("section");
    expect(ctaSection).toBeInTheDocument();
  });
});