import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { trackEvent } from "@/lib/analytics/telemetry";
import { BookOpenCheck, FileText, Brain, Wind, Scale, ClipboardList } from "lucide-react";

const tools = [
  { label: 'AKTRACS', href: '/tools/aktracs', icon: FileText },
  { label: 'Flashcards', href: '/tools/flashcards', icon: BookOpenCheck },
  { label: 'Practice Test', href: '/tools/practice-test', icon: Brain },
  { label: 'Crosswind', href: '/tools/crosswind', icon: Wind },
  { label: 'W&B', href: '/tools/wb', icon: Scale },
  { label: '8710 Checker', href: '/tools/8710', icon: ClipboardList },
];

export function QuickTools() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Tools</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tools.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} target="_self">
            <Button variant="outline" className="w-full justify-center gap-2" aria-label={label} onClick={() => trackEvent('click_quick_tool', { tool: label })}>
              <Icon className="h-4 w-4" /> {label}
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}
