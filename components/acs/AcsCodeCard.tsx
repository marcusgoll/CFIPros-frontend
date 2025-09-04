"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { ExternalLink, ChevronRight } from "lucide-react";
import { TAcsCodeSummary } from "@/lib/api/acs";
import { createSlugFromCode } from "@/lib/api/acs";

interface AcsCodeCardProps {
  code: TAcsCodeSummary;
  className?: string;
  searchQuery?: string;
}

// Utility function to highlight search terms
function highlightText(text: string, searchQuery?: string): React.ReactNode {
  if (!searchQuery || !text) {return text;}
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
}

const TypeBadge = memo(({ type }: { type: TAcsCodeSummary["type"] }) => {
  const getBadgeStyle = (type: TAcsCodeSummary["type"]) => {
    switch (type) {
      case "knowledge":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "skill":
        return "bg-green-100 text-green-800 border-green-200";
      case "risk_management":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDisplayText = (type: TAcsCodeSummary["type"]) => {
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
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getBadgeStyle(
        type
      )}`}
    >
      {getDisplayText(type)}
    </span>
  );
});

TypeBadge.displayName = 'TypeBadge';

export default memo(function AcsCodeCard({ 
  code, 
  className = "", 
  searchQuery 
}: AcsCodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const slug = createSlugFromCode(code.code);

  return (
    <Link href={`/acs-database/${slug}`} className="group">
      <div
        className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {highlightText(code.code, searchQuery)}
              </h3>
              <TypeBadge type={code.type} />
            </div>
            <h4 className="mt-2 text-base font-medium text-gray-700 line-clamp-2">
              {highlightText(code.title, searchQuery)}
            </h4>
          </div>
          <ChevronRight
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isHovered ? "translate-x-1 text-blue-600" : ""
            }`}
          />
        </div>

        {/* Document Reference */}
        {code.doc && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Document: <span className="font-medium">{highlightText(code.doc, searchQuery)}</span>
            </p>
          </div>
        )}

        {/* Description Preview */}
        {code.shortDescription && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-3">
              {highlightText(code.shortDescription, searchQuery)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Click to view details</span>
          <div className="flex items-center space-x-1">
            <ExternalLink className="h-3 w-3" />
            <span>View</span>
          </div>
        </div>

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-blue-50 opacity-0 transition-opacity duration-200 ${
            isHovered ? "opacity-10" : ""
          }`}
        />
      </div>
    </Link>
  );
});

// Component already has displayName via memo export