import { CFIStudentsPanel } from '@/components/dashboard/CFIStudentsPanel';

export default async function StudentsPanel() {
  const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/me`, { cache: 'no-store' });
  const me = await meRes.json();
  if (me.plan !== 'cfi') return null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/students?limit=5`, { cache: 'no-store' });
  const data = await res.json();
  return <CFIStudentsPanel folders={data.folders || []} />;
}

