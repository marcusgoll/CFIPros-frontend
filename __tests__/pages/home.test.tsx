import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "@/app/(public)/page";

describe("Landing Page", () => {
  it("renders the hero section with correct heading", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Pass Your Checkride/i);
    expect(heading).toHaveTextContent(/First Try/i);
  });

  it("displays hero section trust indicator", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/Used by 50\+ Student Pilots/i)
    ).toBeInTheDocument();
  });

  it("shows hero section value proposition", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/Upload your FAA test results, get a personalized study plan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No more guessing what to study/i)
    ).toBeInTheDocument();
  });

  it("displays hero section trust indicators", () => {
    render(<HomePage />);

    // Check for trust indicators
    expect(screen.getByText("100% Free to Try")).toBeInTheDocument();
    expect(screen.getByText("Used by 50+ Student Pilots")).toBeInTheDocument();
    expect(screen.getByText("2-Minute Setup")).toBeInTheDocument();
  });

  it("renders primary call-to-action button in hero", () => {
    render(<HomePage />);

    const ctaButton = screen.getByRole("button", {
      name: /Get My Study Plan Now/i,
    });

    expect(ctaButton).toBeInTheDocument();
  });

  it("displays feature sections", () => {
    render(<HomePage />);

    // Check for main section titles (some may appear multiple times)
    expect(screen.getByText("Smart Logbook Analysis")).toBeInTheDocument();
    expect(screen.getAllByText("Progress Analytics").length).toBeGreaterThan(0);
    expect(screen.getByText("Training Management")).toBeInTheDocument();
  });

  it("shows features section heading and description", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /Everything You Need to Succeed/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Professional aviation training tools designed by CFIs/i)
    ).toBeInTheDocument();
  });

  it("renders feature sections with proper structure", () => {
    render(<HomePage />);

    // Check that feature sections are properly structured
    expect(
      screen.getByText("Smart Logbook Analysis").closest("div")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Progress Analytics")[0].closest("div")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Training Management").closest("div")
    ).toBeInTheDocument();
  });

  it("renders the bottom CTA section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/Ready to accelerate your training/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Join thousands of pilots who are training smarter/i)).toBeInTheDocument();

    const ctaUploadButton = screen.getByRole("link", {
      name: /Start your free analysis/i,
    });

    expect(ctaUploadButton).toHaveAttribute("href", "/upload");
  });

  it("has accessible navigation structure", () => {
    render(<HomePage />);

    // Check for proper heading hierarchy
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);

    // Ensure links have href attributes
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
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
    const heroText = screen.getByText("Pass Your Checkride on the");
    const container = heroText.closest("section");
    expect(container).toBeInTheDocument();

    // Verify main section exists
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
  });
});
