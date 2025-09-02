import { Card } from "@/components/ui";

export function PanelSkeleton({ height = 140 }: { height?: number }) {
  return (
    <Card className="p-6">
      <div className="animate-pulse space-y-3" style={{ minHeight: height }}>
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
    </Card>
  );
}
