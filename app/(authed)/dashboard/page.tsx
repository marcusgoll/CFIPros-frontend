import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OnboardingActions } from "@/components/dashboard/OnboardingActions";
import { QuickTools } from "@/components/dashboard/QuickTools";
import { PanelSkeleton } from "@/components/dashboard/Skeletons";
import TodayPanel from "./panels/TodayPanel";
import ResultsPanel from "./panels/ResultsPanel";
import PlanPanel from "./panels/PlanPanel";
import ActivityPanel from "./panels/ActivityPanel";
import PlanStripPanel from "./panels/PlanStripPanel";
import StudentsPanel from "./panels/StudentsPanel";
import { DashboardAnalyticsClient } from "./DashboardAnalyticsClient";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect(`/login?redirect=/dashboard`);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Welcome back!</p>
      </div>
      <DashboardAnalyticsClient />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Suspense fallback={<PanelSkeleton />}>
            <TodayPanel />
          </Suspense>

          <OnboardingActions />
          <Suspense fallback={<PanelSkeleton />}>
            <ResultsPanel />
          </Suspense>

          <Suspense fallback={<PanelSkeleton />}>
            <PlanPanel />
          </Suspense>
        </div>
        <div className="space-y-6">
          <QuickTools />
          <Suspense fallback={<PanelSkeleton />}>
            <ActivityPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton />}>
            <PlanStripPanel />
          </Suspense>
          <Suspense fallback={null}>
            <StudentsPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
