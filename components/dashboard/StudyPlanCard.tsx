"use client";

import { useState, useTransition } from "react";
import { Card, Button } from "@/components/ui";

export type StudyItem = {
  id: string;
  title: string;
  acsCode?: string;
  etaMinutes?: number;
  done?: boolean;
};

export function StudyPlanCard({ items: initialItems }: { items: StudyItem[] }) {
  const [items, setItems] = useState<StudyItem[]>(initialItems || []);
  const [isPending, startTransition] = useTransition();

  const markDone = (id: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: true } : it))
    );
    startTransition(async () => {
      try {
        await fetch(`/api/study-plans/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: true }),
        });
      } catch {
        // Revert on failure
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, done: false } : it))
        );
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Study Plan</h2>
        <div className="text-sm text-gray-600">
          Upcoming: {items.filter((i) => !i.done).length}
        </div>
      </div>
      <ul className="mt-4 space-y-3" aria-busy={isPending}>
        {items.slice(0, 5).map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between rounded border border-gray-200 p-3"
          >
            <div>
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-gray-600">
                {it.acsCode ? `${it.acsCode}` : ""}{" "}
                {typeof it.etaMinutes === "number"
                  ? `(~${it.etaMinutes} min)`
                  : ""}
              </div>
            </div>
            <Button
              size="sm"
              variant={it.done ? "secondary" : "outline"}
              disabled={it.done}
              onClick={() => markDone(it.id)}
              aria-label={`Mark ${it.title} done`}
            >
              {it.done ? "Done" : "Mark done"}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
