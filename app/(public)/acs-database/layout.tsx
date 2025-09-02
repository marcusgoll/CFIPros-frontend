import type { ReactNode } from "react";
import Link from "next/link";

interface AcsDatabaseLayoutProps {
  children: ReactNode;
}

export default function AcsDatabaseLayout({ children }: AcsDatabaseLayoutProps) {
  return (
    <main className="flex-1">
      {/* Breadcrumb Navigation */}
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <span className="font-medium text-gray-900" aria-current="page">
              ACS Database
            </span>
          </li>
        </ol>
      </nav>
      
      {children}
    </main>
  );
}