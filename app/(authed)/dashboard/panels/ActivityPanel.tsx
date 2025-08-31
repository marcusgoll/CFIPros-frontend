import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default async function ActivityPanel() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/activity?limit=5`, { cache: 'no-store' });
  const data = await res.json();
  return <ActivityFeed items={data.items || []} />;
}

