"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { AcsSearchParams } from "@/lib/api/acs";

interface AcsFiltersProps {
  filters: Partial<AcsSearchParams>;
  onFiltersChange: (filters: Partial<AcsSearchParams>) => void;
  availableOptions?: {
    docs?: string[];
    types?: Array<"knowledge" | "skill" | "risk_management">;
    areas?: string[];
    tasks?: string[];
    tags?: string[];
  };
}

const DEFAULT_OPTIONS = {
  types: ["knowledge", "skill", "risk_management"] as const,
  docs: ["PA", "CA", "IR", "CFI", "ATP"],
  areas: [
    "Preflight Preparation",
    "Preflight Procedures", 
    "Airport Operations",
    "Takeoffs, Landings, and Go-Arounds",
    "Performance and Ground Reference Maneuvers",
    "Navigation",
    "Slow Flight and Stalls",
    "Basic Instrument Maneuvers",
    "Emergency Operations",
    "Night Operations",
    "High Altitude Operations",
  ],
  tasks: [
    "Pilot Qualifications",
    "Airworthiness Requirements", 
    "Weather Information",
    "Cross-Country Flight Planning",
    "National Airspace System",
    "Performance and Limitations",
    "Operation of Systems",
    "Human Factors",
  ],
};

export default function AcsFilters({
  filters,
  onFiltersChange,
  availableOptions = {},
}: AcsFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const options = {
    docs: availableOptions.docs || DEFAULT_OPTIONS.docs,
    types: availableOptions.types || DEFAULT_OPTIONS.types,
    areas: availableOptions.areas || DEFAULT_OPTIONS.areas,
    tasks: availableOptions.tasks || DEFAULT_OPTIONS.tasks,
    tags: availableOptions.tags || [],
  };

  const updateFilter = (key: keyof AcsSearchParams, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== "all") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newFilters as any)[key] = value;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (newFilters as any)[key];
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== "q" && key !== "limit" && key !== "offset" && filters[key as keyof AcsSearchParams]
  );

  return (
    <>
      {/* Filter Toggle */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && (
            <span className="ml-1 flex h-2 w-2 rounded-full bg-blue-600"></span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Document Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Document
              </label>
              <select
                value={filters.doc || "all"}
                onChange={(e) => updateFilter("doc", e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
              >
                <option value="all">All Documents</option>
                {options.docs.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={filters.type || "all"}
                onChange={(e) => updateFilter("type", e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
              >
                <option value="all">All Types</option>
                <option value="knowledge">Knowledge</option>
                <option value="skill">Skill</option>
                <option value="risk_management">Risk Management</option>
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Area
              </label>
              <select
                value={filters.area || "all"}
                onChange={(e) => updateFilter("area", e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
              >
                <option value="all">All Areas</option>
                {options.areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Task */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Task
              </label>
              <select
                value={filters.task || "all"}
                onChange={(e) => updateFilter("task", e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
              >
                <option value="all">All Tasks</option>
                {options.tasks.map((task) => (
                  <option key={task} value={task}>
                    {task}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Code Prefix */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Code Prefix (e.g., "PA.I.A")
            </label>
            <input
              type="text"
              placeholder="Enter code prefix..."
              value={filters.code_prefix || ""}
              onChange={(e) => updateFilter("code_prefix", e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-500 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
            />
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {filters.doc && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Doc: {filters.doc}
                  <button
                    onClick={() => updateFilter("doc", undefined)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Type: {filters.type}
                  <button
                    onClick={() => updateFilter("type", undefined)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.area && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Area: {filters.area}
                  <button
                    onClick={() => updateFilter("area", undefined)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.task && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Task: {filters.task}
                  <button
                    onClick={() => updateFilter("task", undefined)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.code_prefix && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Prefix: {filters.code_prefix}
                  <button
                    onClick={() => updateFilter("code_prefix", undefined)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}