import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}!
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Training Progress</h3>
          <p className="mt-2 text-sm text-gray-600">
            Track your aviation training milestones and achievements.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Study Materials</h3>
          <p className="mt-2 text-sm text-gray-600">
            Access your personalized study plans and resources.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Flight Logs</h3>
          <p className="mt-2 text-sm text-gray-600">
            Manage your flight hours and training records.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900">Getting Started</h3>
        <p className="mt-2 text-sm text-blue-700">
          This is your authenticated dashboard. You're successfully signed in with Clerk!
        </p>
      </div>
    </div>
  );
}