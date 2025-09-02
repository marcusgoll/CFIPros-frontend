import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorAlert } from "@/components/dashboard/ErrorAlert";

describe("ErrorAlert", () => {
  it("copies x-request-id on icon click", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });

    render(
      <ErrorAlert
        problem={{ title: "error", detail: "failed" }}
        requestId="req-123"
        onRetry={() => {}}
      />
    );

    const copyBtn = screen.getByRole("button", { name: /copy request id/i });
    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("req-123");
  });
});
