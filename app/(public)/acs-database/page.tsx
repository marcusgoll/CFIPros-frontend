import { Metadata } from "next";
import AcsDatabaseClient from "./database-client";

export const metadata: Metadata = {
  title: "ACS Code Database - Comprehensive Aviation Standards | CFIPros",
  description:
    "Comprehensive database of 200+ Airman Certification Standards (ACS) codes with advanced search, filtering, and study tools for pilot training and checkride preparation.",
  keywords: [
    "ACS codes",
    "Airman Certification Standards",
    "pilot training",
    "aviation standards",
    "checkride preparation",
    "flight training",
    "CFI training",
    "aviation education",
    "ACS database",
    "aviation certification",
  ],
  openGraph: {
    title: "ACS Code Database - Comprehensive Aviation Standards",
    description:
      "Comprehensive database of 200+ Airman Certification Standards codes with advanced search and filtering for effective study and preparation.",
    type: "website",
    url: "/acs-database",
    siteName: "CFIPros",
    images: [
      {
        url: "/og-acs-database.png",
        width: 1200,
        height: 630,
        alt: "CFIPros ACS Code Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ACS Code Database - Comprehensive Aviation Standards",
    description:
      "Comprehensive database of 200+ Airman Certification Standards codes with advanced search and filtering.",
    images: ["/twitter-acs-database.png"],
  },
  alternates: {
    canonical: "/acs-database",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function AcsDatabasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ACS Code Database
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Comprehensive database of 200+ Airman Certification Standards codes with advanced search and filtering
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AcsDatabaseClient />
      </div>
    </div>
  );
}