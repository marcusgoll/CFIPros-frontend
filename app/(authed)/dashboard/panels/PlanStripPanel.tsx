import { PlanCreditsStrip } from '@/components/dashboard/PlanCreditsStrip';

export default async function PlanStripPanel() {
  const [meRes, creditsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/me`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/billing/credits`, { cache: 'no-store' }),
  ]);
  const [me, credits] = await Promise.all([meRes.json(), creditsRes.json()]);
  return <PlanCreditsStrip info={{ plan: me.plan || 'free', credits: credits.credits }} />;
}

