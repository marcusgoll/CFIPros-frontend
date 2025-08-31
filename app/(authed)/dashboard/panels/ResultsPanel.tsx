import { LatestResults } from '@/components/dashboard/LatestResults';

export default async function ResultsPanel() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/reports?limit=3`, { cache: 'no-store' });
  const data = await res.json();
  return <LatestResults results={data} />;
}

