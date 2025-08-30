import type { Metadata } from 'next';
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthNavigation } from "@/components/layout/AuthNavigation";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: 'Dashboard | CFIPros',
  description: 'Your aviation training dashboard',
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}