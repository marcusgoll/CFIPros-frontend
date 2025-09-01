"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui";
import { DesktopNavigation } from "@/components/layout/Navigation/DesktopNavigation";
import { InstructorDropdown } from "@/components/layout/Navigation/InstructorDropdown";
import { MobileNavigation } from "@/components/layout/Navigation/MobileNavigation";

export function HeaderNavigation() {
  const { isSignedIn, isLoaded } = useUser();
  const { resolvedTheme } = useTheme();

  // Determine if we should show the white logo (dark mode)
  const isDarkMode = resolvedTheme === "dark";

  // Memoize auth components to prevent unnecessary re-renders
  const authComponents = useMemo(
    () => ({
      SignInButton,
      SignUpButton,
      UserButton,
    }),
    []
  );

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border bg-background shadow-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/CFIPros-logo-primary.svg"
                alt="CFIPros"
                width={40}
                height={40}
                className={`h-10 w-auto transition-all duration-300 ${
                  isDarkMode ? "brightness-0 invert" : ""
                }`}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center lg:flex">
            <DesktopNavigation />

            {/* For Instructors - Standalone Dropdown (3rd position) */}
            <InstructorDropdown />

            {/* For Flight Schools - Last position */}
            <div className="ml-1">
              <Link
                href="/schools"
                className="text-foreground/80 inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
              >
                For Flight Schools
              </Link>
            </div>
          </div>

          {/* Desktop Authentication */}
          <div className="hidden items-center space-x-4 lg:flex">
            {!isLoaded ? (
              <div className="flex items-center space-x-4">
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
                <div className="h-8 w-20 animate-pulse rounded bg-muted"></div>
              </div>
            ) : isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <MobileNavigation
            isSignedIn={!!isSignedIn}
            isLoaded={isLoaded}
            SignInButton={authComponents.SignInButton}
            SignUpButton={authComponents.SignUpButton}
            UserButton={authComponents.UserButton}
          />
        </div>
      </div>
    </nav>
  );
}
