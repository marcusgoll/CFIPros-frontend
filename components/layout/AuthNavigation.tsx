"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";

export function AuthNavigation() {
  const { user, isLoaded } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CFIPros</span>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors">
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
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
