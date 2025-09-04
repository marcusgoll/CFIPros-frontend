import { Metadata } from "next";
import ACSSearchClient from "./search-client";

export const metadata: Metadata = {
  title: "ACS Code Database - Browse Aviation Standards | CFIPros",
  description:
    "Browse and search through 200+ Airman Certification Standards (ACS) codes. Find detailed explanations, common pitfalls, and study resources for pilot training and checkride preparation.",
  keywords: [
    "ACS codes",
    "Airman Certification Standards",
    "pilot training",
    "aviation standards",
    "checkride preparation",
    "flight training",
    "CFI training",
    "aviation education",
  ],
  openGraph: {
    title: "ACS Code Database - Browse Aviation Standards",
    description:
      "Browse and search through 200+ Airman Certification Standards codes with detailed explanations and study resources.",
    type: "website",
    url: "/acs",
    siteName: "CFIPros",
    images: [
      {
        url: "/og-acs-index.png",
        width: 1200,
        height: 630,
        alt: "CFIPros ACS Code Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ACS Code Database - Browse Aviation Standards",
    description:
      "Browse and search through 200+ Airman Certification Standards codes with detailed explanations and study resources.",
    images: ["/twitter-acs-index.png"],
  },
  alternates: {
    canonical: "/acs",
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


export default function ACSIndexPage() {
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
              Browse and search through 200+ Airman Certification Standards codes
            </p>
          </div>

          {/* Interactive Search Component */}
          <ACSSearchClient />
        </div>
      </div>
    </div>
  );
}
