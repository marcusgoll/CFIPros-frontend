import { Metadata } from "next";
import { AktrToAcsUploader } from "@/components/forms/AktrToAcsUploader";

export const metadata: Metadata = {
  title: "AKTR to ACS Converter | CFI Pros",
  description:
    "Upload your FAA knowledge test reports to get personalized ACS study recommendations and identify weak areas.",
  robots: "noindex, nofollow", // Keep this tool private from search engines
};

export default function AktrToAcsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            AKTR to ACS Converter
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Upload your FAA Airman Knowledge Test Report (AKTR) to get
            personalized study recommendations based on the Airman Certification
            Standards (ACS).
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <AktrToAcsUploader />
        </div>

        <div className="mt-8 text-center">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-blue-800">
                  Privacy Notice
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Your files are processed securely and are not stored
                  permanently. Results are private and can only be accessed via
                  the unique link provided.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
