import { Metadata } from "next";
import { UploadForm } from "./client";
import { UploadErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Upload Documents | CFIPros",
  description:
    "Upload your aviation documents for AI-powered analysis and ACS code matching. Get instant feedback on your training materials.",
  keywords: [
    "aviation document upload",
    "CFI training analysis",
    "ACS code matching",
    "flight training documents",
  ],
  openGraph: {
    title: "Upload Documents | CFIPros",
    description:
      "Upload your aviation documents for AI-powered analysis and ACS code matching.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Upload Documents | CFIPros",
    description:
      "Upload your aviation documents for AI-powered analysis and ACS code matching.",
  },
};

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              Upload Your Documents
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Upload your aviation training documents and get instant AI-powered
              analysis with ACS code matching and improvement suggestions.
            </p>
          </div>

          {/* Upload Form */}
          <UploadErrorBoundary>
            <UploadForm />
          </UploadErrorBoundary>

          {/* Features */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                AI Analysis
              </h3>
              <p className="text-gray-600">
                Advanced AI analyzes your documents for compliance with aviation
                standards
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                ACS Matching
              </h3>
              <p className="text-gray-600">
                Automatically match content to relevant ACS codes and standards
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Instant Results
              </h3>
              <p className="text-gray-600">
                Get immediate feedback and suggestions for improvement
              </p>
            </div>
          </div>

          {/* Supported Files */}
          <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Supported File Types
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-red-600">PDF</span>
                <span className="text-sm text-gray-600">Documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-blue-600">DOCX</span>
                <span className="text-sm text-gray-600">Word Files</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-green-600">TXT</span>
                <span className="text-sm text-gray-600">Text Files</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-orange-600">PPT</span>
                <span className="text-sm text-gray-600">Presentations</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Maximum file size: 10MB per file. Up to 5 files per upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
