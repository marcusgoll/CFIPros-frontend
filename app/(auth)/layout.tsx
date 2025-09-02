import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Authentication | CFIPros",
  description:
    "Sign in or sign up to access your CFIPros aviation training dashboard",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo */}
      <div className="absolute left-0 right-0 top-0 z-10 p-6">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/images/CFIPros-logo-primary.svg"
            alt="CFIPros"
            width={32}
            height={32}
            className="h-8 w-auto transition-all dark:brightness-0 dark:invert"
          />
          <span className="text-xl font-bold text-foreground">CFIPros</span>
        </Link>
      </div>

      {/* Main content */}
      <main className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
