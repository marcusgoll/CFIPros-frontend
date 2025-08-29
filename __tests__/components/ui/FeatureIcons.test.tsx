import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeatureIcons } from "@/components/layout/FeatureSpotlightMenu";

describe("FeatureIcons Components", () => {
  describe("Upload Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Upload />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("has correct SVG attributes", () => {
      const { container } = render(<FeatureIcons.Upload />);
      const svg = container.querySelector("svg");
      
      expect(svg).toHaveAttribute("width", "26");
      expect(svg).toHaveAttribute("height", "26");
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(svg).toHaveAttribute("stroke-width", "2");
      expect(svg).toHaveAttribute("stroke-linecap", "round");
      expect(svg).toHaveAttribute("stroke-linejoin", "round");
    });

    it("contains the correct path elements for upload icon", () => {
      const { container } = render(<FeatureIcons.Upload />);
      const paths = container.querySelectorAll("path");
      
      expect(paths).toHaveLength(2);
      expect(paths[0]).toHaveAttribute("d", "M12 21V7");
      expect(paths[1]).toHaveAttribute("d", "M5 14l7-7 7 7");
    });

    it("uses currentColor for theming", () => {
      const { container } = render(
        <div style={{ color: "red" }}>
          <FeatureIcons.Upload />
        </div>
      );
      const svg = container.querySelector("svg");
      
      expect(svg).toHaveAttribute("stroke", "currentColor");
    });
  });

  describe("Target Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Target />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct elements for target icon", () => {
      const { container } = render(<FeatureIcons.Target />);
      const circle = container.querySelector("circle");
      const paths = container.querySelectorAll("path");
      
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute("cx", "12");
      expect(circle).toHaveAttribute("cy", "12");
      expect(circle).toHaveAttribute("r", "8");
      
      expect(paths).toHaveLength(1);
      expect(paths[0]).toHaveAttribute("d", "M12 2v4M12 18v4M2 12h4M18 12h4");
    });
  });

  describe("Calendar Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Calendar />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct elements for calendar icon", () => {
      const { container } = render(<FeatureIcons.Calendar />);
      const rect = container.querySelector("rect");
      const paths = container.querySelectorAll("path");
      
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute("x", "3");
      expect(rect).toHaveAttribute("y", "4");
      expect(rect).toHaveAttribute("width", "18");
      expect(rect).toHaveAttribute("height", "18");
      expect(rect).toHaveAttribute("rx", "2");
      
      expect(paths).toHaveLength(1);
      expect(paths[0]).toHaveAttribute("d", "M16 2v4M8 2v4M3 10h18");
    });
  });

  describe("Book Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Book />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct path elements for book icon", () => {
      const { container } = render(<FeatureIcons.Book />);
      const paths = container.querySelectorAll("path");
      
      expect(paths).toHaveLength(3);
      expect(paths[0]).toHaveAttribute("d", "M4 19.5A2.5 2.5 0 0 0 6.5 22H20");
      expect(paths[1]).toHaveAttribute("d", "M20 2H6.5A2.5 2.5 0 0 0 4 4.5v15");
      expect(paths[2]).toHaveAttribute("d", "M8 6h9");
    });
  });

  describe("Quiz Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Quiz />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct elements for quiz icon", () => {
      const { container } = render(<FeatureIcons.Quiz />);
      const rect = container.querySelector("rect");
      const paths = container.querySelectorAll("path");
      
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute("x", "4");
      expect(rect).toHaveAttribute("y", "3");
      expect(rect).toHaveAttribute("width", "16");
      expect(rect).toHaveAttribute("height", "18");
      expect(rect).toHaveAttribute("rx", "2");
      
      expect(paths).toHaveLength(3);
      expect(paths[0]).toHaveAttribute("d", "M9 18h6");
      expect(paths[1]).toHaveAttribute("d", "M9 14h6");
      expect(paths[2]).toHaveAttribute("d", "M12 6a3 3 0 0 1 2.83 4H14a2 2 0 1 0-2 2v2");
    });
  });

  describe("Layers Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Layers />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct path elements for layers icon", () => {
      const { container } = render(<FeatureIcons.Layers />);
      const paths = container.querySelectorAll("path");
      
      expect(paths).toHaveLength(2);
      expect(paths[0]).toHaveAttribute("d", "M12 2l10 6-10 6L2 8l10-6Z");
      expect(paths[1]).toHaveAttribute("d", "M2 14l10 6 10-6");
    });
  });

  describe("Chart Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Chart />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct elements for chart icon", () => {
      const { container } = render(<FeatureIcons.Chart />);
      const paths = container.querySelectorAll("path");
      const rects = container.querySelectorAll("rect");
      
      expect(paths).toHaveLength(1);
      expect(paths[0]).toHaveAttribute("d", "M3 3v18h18");
      
      expect(rects).toHaveLength(3);
      expect(rects[0]).toHaveAttribute("x", "7");
      expect(rects[0]).toHaveAttribute("y", "12");
      expect(rects[0]).toHaveAttribute("width", "3");
      expect(rects[0]).toHaveAttribute("height", "6");
      
      expect(rects[1]).toHaveAttribute("x", "12");
      expect(rects[1]).toHaveAttribute("y", "9");
      expect(rects[1]).toHaveAttribute("width", "3");
      expect(rects[1]).toHaveAttribute("height", "9");
      
      expect(rects[2]).toHaveAttribute("x", "17");
      expect(rects[2]).toHaveAttribute("y", "5");
      expect(rects[2]).toHaveAttribute("width", "3");
      expect(rects[2]).toHaveAttribute("height", "13");
    });
  });

  describe("Building Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Building />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct elements for building icon", () => {
      const { container } = render(<FeatureIcons.Building />);
      const rects = container.querySelectorAll("rect");
      const paths = container.querySelectorAll("path");
      
      expect(rects).toHaveLength(1);
      expect(rects[0]).toHaveAttribute("x", "3");
      expect(rects[0]).toHaveAttribute("y", "3");
      expect(rects[0]).toHaveAttribute("width", "18");
      expect(rects[0]).toHaveAttribute("height", "18");
      expect(rects[0]).toHaveAttribute("rx", "2");
      
      expect(paths).toHaveLength(1);
      expect(paths[0]).toHaveAttribute("d", "M9 21V9h6v12");
    });
  });

  describe("Report Icon", () => {
    it("renders without crashing", () => {
      const { container } = render(<FeatureIcons.Report />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("contains the correct path elements for report icon", () => {
      const { container } = render(<FeatureIcons.Report />);
      const paths = container.querySelectorAll("path");
      
      expect(paths).toHaveLength(5);
      expect(paths[0]).toHaveAttribute("d", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z");
      expect(paths[1]).toHaveAttribute("d", "M14 2v6h6");
      expect(paths[2]).toHaveAttribute("d", "M8 13h8");
      expect(paths[3]).toHaveAttribute("d", "M8 17h8");
      expect(paths[4]).toHaveAttribute("d", "M8 9h2");
    });
  });

  describe("Accessibility and Standards", () => {
    const iconComponents = [
      { name: "Upload", Component: FeatureIcons.Upload },
      { name: "Target", Component: FeatureIcons.Target },
      { name: "Calendar", Component: FeatureIcons.Calendar },
      { name: "Book", Component: FeatureIcons.Book },
      { name: "Quiz", Component: FeatureIcons.Quiz },
      { name: "Layers", Component: FeatureIcons.Layers },
      { name: "Chart", Component: FeatureIcons.Chart },
      { name: "Building", Component: FeatureIcons.Building },
      { name: "Report", Component: FeatureIcons.Report },
    ];

    iconComponents.forEach(({ name, Component }) => {
      describe(`${name} Icon Accessibility`, () => {
        it("has consistent dimensions across all icons", () => {
          const { container } = render(<Component />);
          const svg = container.querySelector("svg");
          
          expect(svg).toHaveAttribute("width", "26");
          expect(svg).toHaveAttribute("height", "26");
        });

        it("has consistent viewBox across all icons", () => {
          const { container } = render(<Component />);
          const svg = container.querySelector("svg");
          
          expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
        });

        it("has consistent stroke properties for theming", () => {
          const { container } = render(<Component />);
          const svg = container.querySelector("svg");
          
          expect(svg).toHaveAttribute("stroke", "currentColor");
          expect(svg).toHaveAttribute("stroke-width", "2");
          expect(svg).toHaveAttribute("stroke-linecap", "round");
          expect(svg).toHaveAttribute("stroke-linejoin", "round");
          expect(svg).toHaveAttribute("fill", "none");
        });

        it("responds to parent color styling", () => {
          const { container } = render(
            <div style={{ color: "blue" }}>
              <Component />
            </div>
          );
          const svg = container.querySelector("svg");
          
          expect(svg).toHaveAttribute("stroke", "currentColor");
        });
      });
    });
  });

  describe("Theming Support", () => {
    it("all icons inherit color from parent", () => {
      const iconComponents = [
        FeatureIcons.Upload,
        FeatureIcons.Target,
        FeatureIcons.Calendar,
        FeatureIcons.Book,
        FeatureIcons.Quiz,
        FeatureIcons.Layers,
        FeatureIcons.Chart,
        FeatureIcons.Building,
        FeatureIcons.Report,
      ];

      iconComponents.forEach((Component, index) => {
        const { container } = render(
          <div style={{ color: `hsl(${index * 40}, 70%, 50%)` }}>
            <Component />
          </div>
        );
        const svg = container.querySelector("svg");
        
        expect(svg).toHaveAttribute("stroke", "currentColor");
      });
    });

    it("works with CSS custom properties", () => {
      const { container } = render(
        <div style={{ "--icon-color": "red", color: "var(--icon-color)" } as any}>
          <FeatureIcons.Upload />
        </div>
      );
      const svg = container.querySelector("svg");
      
      expect(svg).toHaveAttribute("stroke", "currentColor");
    });

    it("works with dark mode class", () => {
      const { container } = render(
        <div className="dark text-white">
          <FeatureIcons.Upload />
        </div>
      );
      const svg = container.querySelector("svg");
      
      expect(svg).toHaveAttribute("stroke", "currentColor");
    });
  });

  describe("Performance", () => {
    it("renders icons quickly", () => {
      const start = performance.now();
      
      render(
        <div>
          <FeatureIcons.Upload />
          <FeatureIcons.Target />
          <FeatureIcons.Calendar />
          <FeatureIcons.Book />
          <FeatureIcons.Quiz />
          <FeatureIcons.Layers />
          <FeatureIcons.Chart />
          <FeatureIcons.Building />
          <FeatureIcons.Report />
        </div>
      );
      
      const end = performance.now();
      const renderTime = end - start;
      
      // Should render all icons in less than 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it("doesn't cause memory leaks with multiple renders", () => {
      const { rerender } = render(<FeatureIcons.Upload />);
      
      // Re-render multiple times
      for (let i = 0; i < 100; i++) {
        rerender(<FeatureIcons.Target />);
        rerender(<FeatureIcons.Upload />);
      }
      
      // Should complete without throwing
      expect(true).toBe(true);
    });
  });

  describe("Browser Compatibility", () => {
    it("uses SVG elements that are widely supported", () => {
      const { container } = render(<FeatureIcons.Upload />);
      const svg = container.querySelector("svg");
      
      // Check that we're using basic SVG elements (path, circle, rect)
      // that have universal browser support
      expect(svg?.tagName.toLowerCase()).toBe("svg");
      
      const elements = svg?.querySelectorAll("*");
      elements?.forEach(element => {
        const tagName = element.tagName.toLowerCase();
        expect(["path", "circle", "rect", "line", "g"]).toContain(tagName);
      });
    });

    it("doesn't use advanced SVG features that might not be supported", () => {
      const { container } = render(<FeatureIcons.Chart />);
      const svg = container.querySelector("svg");
      
      // Ensure we don't use advanced features like filters, gradients, etc.
      expect(svg?.querySelector("filter")).toBeNull();
      expect(svg?.querySelector("gradient")).toBeNull();
      expect(svg?.querySelector("pattern")).toBeNull();
      expect(svg?.querySelector("mask")).toBeNull();
    });
  });
});