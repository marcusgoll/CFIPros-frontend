"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import type { TAcsCodeSummary } from "@/lib/api/acs";

interface AcsListProps {
  codes: TAcsCodeSummary[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function AcsList({
  codes,
  loading = false,
  emptyMessage = "No ACS codes found. Try adjusting your search or filters.",
}: AcsListProps) {
  if (loading) {
    return <AcsListSkeleton />;
  }

  if (codes.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <ExternalLink className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No codes found</h3>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {codes.map((code) => (
        <AcsCodeCard key={code.code} code={code} />
      ))}
    </div>
  );
}

interface AcsCodeCardProps {
  code: TAcsCodeSummary;
}

function AcsCodeCard({ code }: AcsCodeCardProps) {
  return (
    <Link href={`/acs/${code.slug}`}>
      <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-0.5">
        <CardContent className="p-6">
          <div className="mb-3 flex items-start justify-between">
            <div className="bg-primary-100 text-primary-700 rounded-lg px-3 py-1 text-sm font-mono font-semibold">
              {code.code}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
            {code.title}
          </h3>

          {code.shortDescription && (
            <p className="mb-3 line-clamp-3 text-sm text-gray-600">
              {code.shortDescription}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {code.doc}
            </span>
            
            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${getTypeColorClasses(code.type)}`}>
              {formatCodeType(code.type)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AcsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="h-6 w-20 animate-pulse rounded bg-gray-200"></div>
              <div className="h-5 w-5 animate-pulse rounded bg-gray-200"></div>
            </div>
            
            <div className="mb-2 h-6 w-full animate-pulse rounded bg-gray-200"></div>
            <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200"></div>
            
            <div className="mb-3 h-16 w-full animate-pulse rounded bg-gray-200"></div>
            
            <div className="flex gap-2">
              <div className="h-5 w-12 animate-pulse rounded bg-gray-200"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getTypeColorClasses(type: "knowledge" | "skill" | "risk_management"): string {
  switch (type) {
    case "knowledge":
      return "bg-blue-100 text-blue-800";
    case "skill":
      return "bg-green-100 text-green-800";
    case "risk_management":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatCodeType(type: "knowledge" | "skill" | "risk_management"): string {
  switch (type) {
    case "knowledge":
      return "Knowledge";
    case "skill":
      return "Skill";
    case "risk_management":
      return "Risk Mgmt";
    default:
      return type;
  }
}