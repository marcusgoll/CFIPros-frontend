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
  });

  it("renders call-to-action buttons", () => {
    render(<HomePage />);
    
    const uploadButton = screen.getByRole("link", { name: /Upload Your Report/i });
    const browseButtons = screen.getAllByRole("link", { name: /Browse ACS Codes/i });
    
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveAttribute("href", "/upload");
    
    // There should be at least one Browse ACS Codes button
    expect(browseButtons.length).toBeGreaterThan(0);
    // Check that at least one has the correct href
    expect(browseButtons.some(button => button.getAttribute("href") === "/acs")).toBe(true);
  });

  it("displays all three feature cards", () => {
    render(<HomePage />);
    
    const features = [
      "ACS Code Discovery",
      "Smart Document Analysis",
      "Premium Lessons"
    ];
    
    features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it("renders the CTA section with correct content", () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Ready to ace your checkride/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start free analysis/i })).toBeInTheDocument();
    // There are multiple "Browse ACS" links, so we'll test that at least one exists
    expect(screen.getAllByText(/Browse ACS codes/i).length).toBeGreaterThan(0);
  });

  it("has accessible navigation links", () => {
    render(<HomePage />);
    
    const links = screen.getAllByRole("link");
    links.forEach(link => {
      expect(link).toHaveAttribute("href");
    });
  });
});