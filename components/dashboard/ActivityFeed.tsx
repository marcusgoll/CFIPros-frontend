import { Card } from "@/components/ui";

export type ActivityItem = {
  id: string;
  message: string;
  timestamp: string; // ISO
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-600">No recent activity.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{it.message}</span>
              <time className="text-gray-500">
                {new Date(it.timestamp).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
