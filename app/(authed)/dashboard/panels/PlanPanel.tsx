import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard';

export default async function PlanPanel() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/study-plans/current`, { cache: 'no-store' });
  const data = await res.json();
  return <StudyPlanCard items={data.items || []} />;
}

