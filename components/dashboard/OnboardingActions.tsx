"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { Upload, ClipboardList, Wrench } from "lucide-react";

export function OnboardingActions() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Get Started</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/upload" aria-label="Upload AKTR">
          <Button className="w-full justify-center gap-2">
            <Upload className="h-4 w-4" /> Upload AKTR
          </Button>
        </Link>
        <Link href="/study-plan" aria-label="Generate Study Plan">
          <Button variant="outline" className="w-full justify-center gap-2">
            <ClipboardList className="h-4 w-4" /> Generate Study Plan
          </Button>
        </Link>
        <Link href="/tools/aktracs" aria-label="Try a Tool">
          <Button variant="secondary" className="w-full justify-center gap-2">
            <Wrench className="h-4 w-4" /> Try a Tool
          </Button>
        </Link>
      </div>
    </Card>
  );
}

