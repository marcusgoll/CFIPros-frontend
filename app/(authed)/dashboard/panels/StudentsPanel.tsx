import { CFIStudentsPanel } from "@/components/dashboard/CFIStudentsPanel";
import { ErrorRetry } from "@/components/dashboard/ErrorRetry";

export default async function StudentsPanel() {
  const meRes = await fetch(
    `${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/me`,
    { cache: "no-store" }
  );
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
  const me = await meRes.json();
  if (me.plan !== "cfi") { return null; }
  const res = await fetch(
    `${process.env["NEXT_PUBLIC_BASE_URL"] || ""}/api/students?limit=5`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const problem = await res
      .json()
      .catch(() => ({
        title: "Request failed",
        detail: "Unable to load students",
      }));
    const reqId = res.headers.get("x-request-id");
    return <ErrorRetry problem={problem} requestId={reqId || undefined} />;
  }
  const data = await res.json();
  return <CFIStudentsPanel folders={data.folders || []} />;
}
