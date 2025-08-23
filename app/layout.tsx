import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CFIPros - CFI Training Platform",
    template: "%s | CFIPros",
  },
  description: "Comprehensive pilot training platform that helps student pilots and CFIs master aviation standards with SEO-discoverable ACS code references and premium lesson content.",
  keywords: [
    "CFI training",
    "pilot training",
    "ACS codes",
    "flight training",
    "aviation education",
    "checkride preparation",
  ],
  authors: [{ name: "CFIPros Team" }],
  creator: "CFIPros",
  publisher: "CFIPros",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cfipros.com"),
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cfipros.com",
    siteName: "CFIPros",
    title: "CFIPros - CFI Training Platform",
    description: "Master aviation standards with our comprehensive CFI training platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CFIPros - CFI Training Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CFIPros - CFI Training Platform",
    description: "Master aviation standards with our comprehensive CFI training platform",
    images: ["/twitter-image.png"],
    creator: "@cfipros",
  },
  verification: {
    google: "google-verification-code",
    yandex: "yandex-verification-code",
    yahoo: "yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <div id="root" className="relative">
          {children}
        </div>
        <PerformanceMonitor />
      </body>
    </html>
  );
}