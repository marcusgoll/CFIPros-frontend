"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-200 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Page not found
          </h2>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
          <div className="flex justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            What can you do?
          </h3>
          
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Check if the URL is spelled correctly</li>
            <li>• Go back to the previous page</li>
            <li>• Visit our homepage to find what you need</li>
            <li>• Browse our ACS code database</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="primary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Homepage
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          
          <div className="flex justify-center space-x-6">
            <Link 
              href="/acs" 
              className="text-sm text-primary hover:text-primary/80"
            >
              ACS Codes
            </Link>
            <Link 
              href="/upload" 
              className="text-sm text-primary hover:text-primary/80"
            >
              Upload Report
            </Link>
            <Link 
              href="/help" 
              className="text-sm text-primary hover:text-primary/80"
            >
              Help Center
            </Link>
            <Link 
              href="/contact" 
              className="text-sm text-primary hover:text-primary/80"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}