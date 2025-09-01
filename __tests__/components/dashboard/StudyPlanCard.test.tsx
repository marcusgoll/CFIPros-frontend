import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyPlanCard } from "@/components/dashboard/StudyPlanCard";

describe("StudyPlanCard", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (global.fetch as unknown as jest.Mock) = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: "sp1", done: true }),
      });
  });

  it("optimistically marks item done and calls PATCH", async () => {
    const user = userEvent.setup();
    render(
      <StudyPlanCard
        items={[
          {
            id: "sp1",
            title: "Preflight",
            acsCode: "PA.I.A.K1",
            etaMinutes: 10,
            done: false,
          },
        ]}
      />
    );

    const btn = screen.getByRole("button", { name: /Mark Preflight done/i });
    await user.click(btn);

    expect(btn).toBeDisabled();
    expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
      "/api/study-plans/sp1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("reverts to not done if PATCH fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    const user = userEvent.setup();
    render(
      <StudyPlanCard
        items={[
          {
            id: "sp1",
            title: "Preflight",
            acsCode: "PA.I.A.K1",
            etaMinutes: 10,
            done: false,
          },
        ]}
      />
    );

    const btn = screen.getByRole("button", { name: /Mark Preflight done/i });
    await user.click(btn);

    // After failure, button should become enabled again
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveTextContent(/mark done/i);
  });
});
