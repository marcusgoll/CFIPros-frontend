import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ErrorRetry } from "@/components/dashboard/ErrorRetry";

export default async function ActivityPanel() {
  const res = await fetch(
    `${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/activity?limit=5`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const problem = await res
      .json()
      .catch(() => ({
        title: "Request failed",
        detail: "Unable to load activity",
      }));
    const reqId = res.headers.get("x-request-id");
    return <ErrorRetry problem={problem} requestId={reqId || undefined} />;
  }
  const data = await res.json();
  return <ActivityFeed items={Array.isArray(data.items) ? data.items : []} />;
}
