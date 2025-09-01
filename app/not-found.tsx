"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <h1 className="text-primary-200 mb-4 text-9xl font-bold">404</h1>
          <h2 className="mb-2 text-3xl font-bold text-foreground">
            Page not found
          </h2>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-foreground">
            What can you do?
          </h3>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Check if the URL is spelled correctly</li>
            <li>• Go back to the previous page</li>
            <li>• Visit our homepage to find what you need</li>
            <li>• Browse our ACS code database</li>
          </ul>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => window.history.back()}
            variant="primary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>

          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Homepage
            </Button>
          </Link>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="mb-4 text-sm text-muted-foreground">
            Looking for something specific?
          </p>

          <div className="flex justify-center space-x-6">
            <Link
              href="/acs"
              className="hover:text-primary/80 text-sm text-primary"
            >
              ACS Codes
            </Link>
            <Link
              href="/upload"
              className="hover:text-primary/80 text-sm text-primary"
            >
              Upload Report
            </Link>
            <Link
              href="/help"
              className="hover:text-primary/80 text-sm text-primary"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="hover:text-primary/80 text-sm text-primary"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
