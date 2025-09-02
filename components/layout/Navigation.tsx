"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-sm font-bold text-white">CF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CFIPros</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/acs"
              className="hover:text-primary-600 px-3 py-2 text-sm font-medium text-gray-700 transition-colors"
            >
              ACS Codes
            </Link>
            <Link
              href="/upload"
              className="hover:text-primary-600 px-3 py-2 text-sm font-medium text-gray-700 transition-colors"
            >
              Upload Report
            </Link>
            <Link
              href="/about"
              className="hover:text-primary-600 px-3 py-2 text-sm font-medium text-gray-700 transition-colors"
            >
              About
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/upload">
              <Button size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="hover:text-primary-600 focus:ring-primary-500 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn("md:hidden", mobileMenuOpen ? "block" : "hidden")}>
          <div className="space-y-1 pb-3 pt-2">
            <Link
              href="/acs"
              className="hover:text-primary-600 block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              ACS Codes
            </Link>
            <Link
              href="/upload"
              className="hover:text-primary-600 block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Upload Report
            </Link>
            <Link
              href="/about"
              className="hover:text-primary-600 block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <Link
                href="/auth/login"
                className="hover:text-primary-600 block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
