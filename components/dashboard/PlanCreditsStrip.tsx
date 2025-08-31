import { Card, Button } from "@/components/ui";
import { trackEvent } from "@/lib/analytics/telemetry";

export type PlanInfo = {
  plan: 'free' | 'pro' | 'cfi';
  credits?: number;
};

export function PlanCreditsStrip({ info }: { info: PlanInfo }) {
  const isFree = info.plan === 'free';
  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {typeof info.credits === 'number' && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Credits: {info.credits}
          </span>
        )}
        {isFree && (
          <span className="text-sm text-gray-700">Upgrade to unlock more features</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {typeof info.credits === 'number' && (
          <Button size="sm" variant="outline" onClick={() => trackEvent('buy_credits_click')}>Buy</Button>
        )}
        {isFree && (
          <Button size="sm" onClick={() => trackEvent('upgrade_click')}>Upgrade to Pro</Button>
        )}
      </div>
    </Card>
  );
}
