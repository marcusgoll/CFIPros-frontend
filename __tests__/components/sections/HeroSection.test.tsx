import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HeroSection } from "@/components/sections/HeroSection";

describe("HeroSection", () => {
  it("renders the main heading with CFIPros branding", () => {
    render(<HeroSection />);
    
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Master Aviation Standards/i);
    expect(heading).toHaveTextContent(/CFIPros/i);
  });

  it("displays trust indicator badge", () => {
    render(<HeroSection />);
    
    expect(screen.getByText(/Trusted by 10,000\+ pilots nationwide/i)).toBeInTheDocument();
  });

  it("shows value proposition text", () => {
    render(<HeroSection />);
    
    const description = screen.getByText(/Comprehensive pilot training platform/i);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(/SEO-discoverable ACS code references/i);
    expect(description).toHaveTextContent(/AI-powered study plans/i);
    expect(description).toHaveTextContent(/premium lesson content/i);
  });

  it("renders primary CTA buttons", () => {
    render(<HeroSection />);
    
    const uploadButton = screen.getByRole("link", { name: /Upload Your Report/i });
    const browseButton = screen.getByRole("link", { name: /Browse ACS Codes/i });
    
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveAttribute("href", "/upload");
    
    expect(browseButton).toBeInTheDocument();  
    expect(browseButton).toHaveAttribute("href", "/acs");
  });

  it("displays statistics grid", () => {
    render(<HeroSection />);
    
    // Check each statistic
    expect(screen.getByText("200+")).toBeInTheDocument();
    expect(screen.getByText("ACS Codes")).toBeInTheDocument();
    
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("Pass Rate")).toBeInTheDocument();
    
    expect(screen.getByText("10k+")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    
    expect(screen.getByText("4.9★")).toBeInTheDocument();
    expect(screen.getByText("User Rating")).toBeInTheDocument();
  });

  it("includes proper icons in CTA buttons", () => {
    render(<HeroSection />);
    
    // Check that buttons contain icons (lucide-react icons render as SVGs)
    const uploadButton = screen.getByRole("link", { name: /Upload Your Report/i });
    const browseButton = screen.getByRole("link", { name: /Browse ACS Codes/i });
    
    expect(uploadButton.querySelector("svg")).toBeInTheDocument();
    expect(browseButton.querySelector("svg")).toBeInTheDocument();
  });

  it("has proper section structure", () => {
    render(<HeroSection />);
    
    const section = document.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.tagName).toBe("SECTION");
  });

  it("includes background decoration element", () => {
    render(<HeroSection />);
    
    // Check for background decoration div with absolute positioning
    const section = document.querySelector("section");
    const decorationElement = section?.querySelector(".absolute.inset-x-0.top-0");
    expect(decorationElement).toBeInTheDocument();
  });

  it("has responsive layout classes", () => {
    render(<HeroSection />);
    
    const section = document.querySelector("section");
    expect(section).toHaveClass("relative", "overflow-hidden", "bg-gradient-to-br");
    
    const container = section?.querySelector(".mx-auto.max-w-7xl");
    expect(container).toBeInTheDocument();
  });

  it("displays proper heading hierarchy", () => {
    render(<HeroSection />);
    
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    
    // Should not have other heading levels that would break hierarchy
    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
  });
});