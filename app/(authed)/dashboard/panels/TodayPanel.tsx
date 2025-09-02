import { TodayCard } from "@/components/dashboard/TodayCard";

export default async function TodayPanel() {
  const [dueRes, planRes] = await Promise.all([
    fetch(`${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/flashcards/dueCount`, {
      cache: "no-store",
    }),
    fetch(`${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/study-plans/current`, {
      cache: "no-store",
    }),
  ]);
  const [{ count }, { nextLesson }] = await Promise.all([
    dueRes.json(),
    planRes.json(),
  ]);
  return <TodayCard dueCards={count} nextLesson={nextLesson || undefined} />;
}
