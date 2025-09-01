import { StudyPlanCard } from "@/components/dashboard/StudyPlanCard";
import { ErrorRetry } from "@/components/dashboard/ErrorRetry";

export default async function PlanPanel() {
  const res = await fetch(
    `${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/study-plans/current`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const problem = await res
      .json()
      .catch(() => ({
        title: "Request failed",
        detail: "Unable to load study plan",
      }));
    const reqId = res.headers.get("x-request-id");
    return <ErrorRetry problem={problem} requestId={reqId || undefined} />;
  }
  const data = await res.json();
  return <StudyPlanCard items={Array.isArray(data.items) ? data.items : []} />;
}
