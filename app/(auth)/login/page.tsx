"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <SignIn path="/login" signUpUrl="/sign-up" afterSignInUrl={redirect} />
      </div>
    </div>
  );
}
