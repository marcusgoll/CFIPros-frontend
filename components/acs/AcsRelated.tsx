"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchAcsCodeRelated, type AcsCode } from "@/lib/api/acs";
import { Badge } from "@/components/ui";

interface AcsRelatedProps {
  codeOrSlug: string;
  relatedCodes?: string[]; // Fallback array of related code strings
  className?: string;
}

export default function AcsRelated({ 
  codeOrSlug, 
  relatedCodes = [], 
  className = "" 
}: AcsRelatedProps) {
  const [relatedData, setRelatedData] = useState<AcsCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRelatedCodes() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchAcsCodeRelated(codeOrSlug, { limit: 6 });
        setRelatedData(response.items);
      } catch (err) {
        // Remove console.error for production
        setError(err instanceof Error ? err.message : "Failed to load related codes");
        // If API fails and we have related codes as strings, we'll show a fallback
        setRelatedData([]);
      } finally {
        setLoading(false);
      }
    }

    if (codeOrSlug) {
      loadRelatedCodes();
    }
  }, [codeOrSlug]);

  // Show loading state
  if (loading) {
    return (
      <div className={`rounded-lg border bg-white p-6 ${className}`}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Related ACS Codes</h3>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 h-4 w-20 rounded bg-gray-200"></div>
              <div className="h-3 w-full rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state or empty state
  if (error || (!relatedData?.length && !relatedCodes?.length)) {
    return (
      <div className={`rounded-lg border bg-white p-6 ${className}`}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Related ACS Codes</h3>
        <p className="text-sm text-gray-500">
          {error || "No related codes found"}
        </p>
      </div>
    );
  }

  // Use API data if available, otherwise fallback to string codes
  const displayCodes = relatedData?.length > 0 
    ? relatedData 
    : relatedCodes.map(code => ({ 
        code, 
        title: `ACS Code ${code}`, 
        slug: code.toLowerCase().replace(/\./g, '-'),
        description: `View details for ACS code ${code}`
      }));

  return (
    <div className={`rounded-lg border bg-white p-6 ${className}`}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Related ACS Codes</h3>
      
      <div className="space-y-3">
        {displayCodes.slice(0, 6).map((related) => (
          <Link
            key={related.code}
            href={`/acs-database/${related.slug}`}
            className="group block rounded-lg border p-4 transition-all duration-200 hover:bg-gray-50 hover:border-blue-200 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-mono text-sm font-medium text-blue-600 group-hover:text-blue-800">
                  {related.code}
                </div>
                <div className="mt-1 text-sm text-gray-900 line-clamp-2 group-hover:text-gray-700">
                  {related.title || related.description}
                </div>
                {related.type && (
                  <div className="mt-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {formatCodeType(related.type)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {displayCodes.length > 6 && (
        <div className="mt-4 text-center">
          <Link
            href={`/acs-database?related=${encodeURIComponent(codeOrSlug)}`}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all related codes
          </Link>
        </div>
      )}
    </div>
  );
}

function formatCodeType(type: "knowledge" | "skill" | "risk_management"): string {
  switch (type) {
    case "knowledge":
      return "Knowledge";
    case "skill":
      return "Skill";
    case "risk_management":
      return "Risk Management";
    default:
      return type;
  }
}