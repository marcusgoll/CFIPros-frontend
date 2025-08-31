"use client";

import { Button, Card } from "@/components/ui";
import { trackEvent } from "@/lib/analytics/telemetry";

type NextLesson = {
  title: string;
  etaMinutes: number;
};

export function TodayCard({
  dueCards,
  nextLesson,
  onStartCards,
  onStartLesson,
}: {
  dueCards: number;
  nextLesson?: NextLesson;
  onStartCards?: () => void;
  onStartLesson?: () => void;
}) {
  const hasData = (dueCards ?? 0) > 0 || Boolean(nextLesson);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Today</h2>

      {hasData ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <div className="text-2xl font-bold">{dueCards}</div>
              <div className="text-sm text-gray-600">cards due</div>
            </div>
            <Button onClick={() => { trackEvent('start_flashcards'); onStartCards?.(); }} aria-label="Start Cards">
              Start Cards
            </Button>
          </div>

          {nextLesson && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <div className="text-sm text-gray-600">Next Lesson</div>
                <div className="font-medium">{nextLesson.title} <span className="text-gray-500">(~{nextLesson.etaMinutes} min)</span></div>
              </div>
              <Button onClick={() => { trackEvent('start_lesson'); onStartLesson?.(); }} variant="outline" aria-label="Start Lesson">
                Start Lesson
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-600">
          Nothing due today — explore your study plan.
        </div>
      )}
    </Card>
  );
}
