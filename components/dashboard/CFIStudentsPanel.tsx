import { Card } from "@/components/ui";
import { trackEvent } from "@/lib/analytics/telemetry";

type Folder = { id: string; name: string; readiness: number };

export function CFIStudentsPanel({ folders }: { folders: Folder[] }) {
  if (!folders || folders.length === 0) return null;
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Students</h2>
      <ul className="space-y-2">
        {folders.slice(0, 5).map(f => (
          <li key={f.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{f.name}</span>
            <span className="text-gray-600">{f.readiness}%</span>
            <a href={`#/students/${f.id}`} className="text-primary-600 hover:underline" onClick={() => trackEvent('open_student_folder', { id: f.id })}>Open</a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
