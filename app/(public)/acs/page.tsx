import { Metadata } from "next";
import ACSIndexClient from "./client";

export const metadata: Metadata = {
  title: "ACS Code Database - Browse Aviation Standards | CFIPros",
  description: "Browse and search through 200+ Airman Certification Standards (ACS) codes. Find detailed explanations, common pitfalls, and study resources for pilot training and checkride preparation.",
  keywords: [
    "ACS codes",
    "Airman Certification Standards",
    "pilot training",
    "aviation standards",
    "checkride preparation",
    "flight training",
    "CFI training",
    "aviation education"
  ],
  openGraph: {
    title: "ACS Code Database - Browse Aviation Standards",
    description: "Browse and search through 200+ Airman Certification Standards codes with detailed explanations and study resources.",
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
    description: "Browse and search through 200+ Airman Certification Standards codes with detailed explanations and study resources.",
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
  return <ACSIndexClient />;
}