import { PlanCreditsStrip } from "@/components/dashboard/PlanCreditsStrip";
import { ErrorRetry } from "@/components/dashboard/ErrorRetry";

export default async function PlanStripPanel() {
  const [meRes, creditsRes] = await Promise.all([
    fetch(`${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/me`, {
      cache: "no-store",
    }),
    fetch(`${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/billing/credits`, {
      cache: "no-store",
    }),
  ]);
  if (!meRes.ok) {
    const problem = await meRes
      .json()
      .catch(() => ({
        title: "Request failed",
        detail: "Unable to load account",
      }));
    const reqId = meRes.headers.get("x-request-id");
    return <ErrorRetry problem={problem} requestId={reqId || undefined} />;
  }
  if (!creditsRes.ok) {
    const problem = await creditsRes
      .json()
      .catch(() => ({
        title: "Request failed",
        detail: "Unable to load credits",
      }));
    const reqId = creditsRes.headers.get("x-request-id");
    return <ErrorRetry problem={problem} requestId={reqId || undefined} />;
  }
  const [me, credits] = await Promise.all([meRes.json(), creditsRes.json()]);
  return (
    <PlanCreditsStrip
      info={{ plan: me.plan || "free", credits: credits.credits }}
    />
  );
}
