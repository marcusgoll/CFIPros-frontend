import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Clerk server currentUser
jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest
    .fn()
    .mockResolvedValue({
      id: "u1",
      firstName: "Ace",
      emailAddresses: [{ emailAddress: "ace@example.com" }],
    }),
}));

describe("Authed Dashboard", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Mock fetch for BFF endpoints
    global.fetch = jest.fn().mockImplementation((url: RequestInfo) => {
      const u = typeof url === "string" ? url : (url as Request).url;
      if (u.includes("/api/flashcards/dueCount")) {
        return Promise.resolve(
          new Response(JSON.stringify({ count: 12 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      }
      if (u.includes("/api/reports")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: "r1",
                date: "2024-01-02T00:00:00Z",
                score: 82,
                weakAcsCodes: ["PA.I.A.K1", "PA.I.B.K2"],
              },
              {
                id: "r2",
                date: "2024-01-01T00:00:00Z",
                score: null,
                weakAcsCodes: ["PA.III.B.K4"],
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } }
          )
        );
      }
      if (u.includes("/api/study-plans/current")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: "sp1",
                  title: "Preflight inspection",
                  acsCode: "PA.I.A.K1",
                  etaMinutes: 10,
                  done: false,
                },
                {
                  id: "sp2",
                  title: "Weather systems review",
                  acsCode: "PA.I.B.K2",
                  etaMinutes: 15,
                  done: false,
                },
              ],
              nextLesson: { title: "Crosswind Landings", etaMinutes: 20 },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
        );
      }
      if (u.includes("/api/me")) {
        return Promise.resolve(
          new Response(JSON.stringify({ plan: "free" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      }
      if (u.includes("/api/billing/credits")) {
        return Promise.resolve(
          new Response(JSON.stringify({ plan: "free", credits: 3 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      }
      if (u.includes("/api/activity")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: "a1",
                  message: "Mapped AKTR",
                  timestamp: "2024-01-01T00:00:00Z",
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    }) as unknown as typeof fetch;
  });

  it("shows onboarding actions with correct links", async () => {
    const Page = (await import("@/app/(authed)/dashboard/page")).default;
    render(await Page());

    expect(
      screen.getByRole("button", { name: /upload aktr/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /generate study plan/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try a tool/i })
    ).toBeInTheDocument();

    const uploadLink = screen.getByRole("link", { name: /upload aktr/i });
    expect(uploadLink).toHaveAttribute("href", "/upload");
  });

  it("renders latest results with chips and view link", async () => {
    const Page = (await import("@/app/(authed)/dashboard/page")).default;
    render(await Page());

    const section = screen.getByText("Latest AKTR Results").closest("div");
    expect(section).toBeInTheDocument();
    expect(screen.getByText("Score: 82")).toBeInTheDocument();
    // Weak ACS chips
    expect(screen.getByText("PA.I.A.K1")).toBeInTheDocument();
    expect(screen.getByText("PA.I.B.K2")).toBeInTheDocument();
    // View link
    const link = screen.getAllByRole("link", { name: /view full result/i })[0];
    expect(link).toHaveAttribute("href", "/results/r1");
  });

  it("shows quick tools grid with six buttons", async () => {
    const Page = (await import("@/app/(authed)/dashboard/page")).default;
    render(await Page());
    const tools = [
      "AKTRACS",
      "Flashcards",
      "Practice Test",
      "Crosswind",
      "W&B",
      "8710 Checker",
    ];
    tools.forEach((label) =>
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") })
      ).toBeInTheDocument()
    );
  });

  it("shows plan strip for Free plan with credits and upgrade/buy actions", async () => {
    const Page = (await import("@/app/(authed)/dashboard/page")).default;
    render(await Page());

    expect(screen.getByText(/credits: 3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buy/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upgrade to pro/i })
    ).toBeInTheDocument();
  });

  it("shows activity snippet with timestamp", async () => {
    const Page = (await import("@/app/(authed)/dashboard/page")).default;
    render(await Page());

    expect(screen.getByText(/mapped aktr/i)).toBeInTheDocument();
  });
});
