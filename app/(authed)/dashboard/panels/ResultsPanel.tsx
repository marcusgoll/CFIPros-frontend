import { LatestResults } from '@/components/dashboard/LatestResults';
import { ErrorRetry } from '@/components/dashboard/ErrorRetry';

export default async function ResultsPanel() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/reports?limit=3`, { cache: 'no-store' });
  if (!res.ok) {
    const problem = await res.json().catch(() => ({ title: 'Request failed', detail: 'Unable to load results' }));
    const reqId = res.headers.get('x-request-id');
    return <ErrorRetry problem={problem} requestId={reqId} />;
  }
  const data = await res.json();
  return <LatestResults results={Array.isArray(data) ? data : []} />;
}

