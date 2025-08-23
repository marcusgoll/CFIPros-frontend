import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-200 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Page not found
          </h2>
          <p className="text-lg text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            What can you do?
          </h3>
          
          <ul className="text-sm text-gray-600 space-y-2">
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

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific?
          </p>
          
          <div className="flex justify-center space-x-6">
            <Link 
              href="/acs" 
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              ACS Codes
            </Link>
            <Link 
              href="/upload" 
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Upload Report
            </Link>
            <Link 
              href="/help" 
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Help Center
            </Link>
            <Link 
              href="/contact" 
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}