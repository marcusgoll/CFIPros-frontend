import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodayCard } from "@/components/dashboard/TodayCard";

describe("TodayCard", () => {
  it("renders due flashcards and next lesson with Start buttons", async () => {
    const user = userEvent.setup();
    const onStartCards = jest.fn();
    const onStartLesson = jest.fn();

    render(
      <TodayCard
        dueCards={12}
        nextLesson={{ title: "Crosswind Landings", etaMinutes: 20 }}
        onStartCards={onStartCards}
        onStartLesson={onStartLesson}
      />
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("12 cards due")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start cards/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/next lesson/i)).toBeInTheDocument();
    expect(screen.getByText("Crosswind Landings")).toBeInTheDocument();
    expect(screen.getByText("(~20 min)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start cards/i }));
    await user.click(screen.getByRole("button", { name: /start lesson/i }));

    expect(onStartCards).toHaveBeenCalledTimes(1);
    expect(onStartLesson).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no data", () => {
    render(<TodayCard dueCards={0} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText(/nothing due today/i)).toBeInTheDocument();
  });
});
