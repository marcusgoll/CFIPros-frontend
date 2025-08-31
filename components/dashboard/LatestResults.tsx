import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { trackEvent } from "@/lib/analytics/telemetry";

export type LatestResult = {
  id: string;
  date: string; // ISO
  score?: number | null;
  weakAcsCodes?: string[];
};

export function LatestResults({ results }: { results: LatestResult[] }) {
  if (!results || results.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest AKTR Results</h2>
          <Link href="/upload">
            <Button size="sm">Upload AKTR</Button>
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-2">No results yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Latest AKTR Results</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {results.slice(0, 3).map((r) => (
          <li key={r.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{new Date(r.date).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600 flex flex-wrap gap-2 mt-1">
                {typeof r.score === 'number' && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                    Score: {r.score}
                  </span>
                )}
                {(r.weakAcsCodes || []).slice(0, 3).map((code) => (
                  <span key={code} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    {code}
                  </span>
                ))}
              </div>
            </div>
            <Link href={`/results/${r.id}`} className="text-sm text-primary-600 hover:underline" onClick={() => trackEvent('open_report', { id: r.id })}>
              View full result
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
