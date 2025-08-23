import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loading...</h2>
        <p className="text-sm text-gray-500">Please wait while we load your content.</p>
      </div>
    </div>
  );
}