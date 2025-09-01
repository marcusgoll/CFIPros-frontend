"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";

export function AuthNavigation() {
  const { user, isLoaded } = useUser();

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-sm font-bold text-white">CF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CFIPros</span>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="sr-only">View notifications</span>
            </button>

            {/* User menu with Clerk */}
            <div className="flex items-center">
              {isLoaded && user ? (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              ) : (
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
