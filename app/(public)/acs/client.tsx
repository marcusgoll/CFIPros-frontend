"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input, Card, CardContent, Button, LoadingSpinner } from "@/components/ui";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { ACSCode } from "@/lib/types";

// Mock data - will be replaced with API calls
const mockACSCodes: ACSCode[] = [
  {
    code: "PA.I.A.K1",
    title: "Pilot Qualifications",
    area: "Preflight Preparation",
    task: "Pilot Qualifications",
    element: "Certification requirements",
    description: "Understanding pilot certification requirements, including certificates and ratings.",
  },
  {
    code: "PA.I.B.K1",
    title: "Airworthiness Requirements",
    area: "Preflight Preparation",
    task: "Airworthiness Requirements",
    element: "Required certificates and documents",
    description: "Knowledge of required aircraft certificates and documents for airworthiness.",
  },
  {
    code: "PA.I.B.K2",
    title: "Weather Information",
    area: "Preflight Preparation",
    task: "Weather Information",
    element: "Weather reports and forecasts",
    description: "Understanding weather services, reports, and forecasts for flight planning.",
  },
  {
    code: "PA.II.A.K1",
    title: "Navigation Systems",
    area: "Navigation",
    task: "Navigation Systems and Radar Services",
    element: "Navigation systems",
    description: "Knowledge of various navigation systems including VOR, GPS, and radar services.",
  },
  {
    code: "PA.II.A.K2",
    title: "Chart Reading",
    area: "Navigation",
    task: "Navigation Systems and Radar Services",
    element: "Chart interpretation",
    description: "Ability to read and interpret aeronautical charts for navigation.",
  },
];

const areas = ["All Areas", "Preflight Preparation", "Navigation", "Airport Operations", "Takeoffs and Landings"];
const tasks = ["All Tasks", "Pilot Qualifications", "Airworthiness Requirements", "Weather Information", "Navigation Systems and Radar Services"];

export default function ACSIndexClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [selectedTask, setSelectedTask] = useState("All Tasks");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredCodes, setFilteredCodes] = useState<ACSCode[]>(mockACSCodes);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Filter codes based on search and filters
    setIsLoading(true);
    
    const filtered = mockACSCodes.filter((code) => {
      const matchesSearch = 
        code.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        code.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        code.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesArea = selectedArea === "All Areas" || code.area === selectedArea;
      const matchesTask = selectedTask === "All Tasks" || code.task === selectedTask;
      
      return matchesSearch && matchesArea && matchesTask;
    });
    
    setFilteredCodes(filtered);
    setIsLoading(false);
  }, [debouncedSearch, selectedArea, selectedTask]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ACS Code Database
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Browse and search through 200+ Airman Certification Standards codes
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by code, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-base"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {tasks.map((task) => (
                    <option key={task} value={task}>
                      {task}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </span>
            ) : (
              `Found ${filteredCodes.length} ACS codes`
            )}
          </p>
        </div>

        {/* Results grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading ACS codes..." />
          </div>
        ) : filteredCodes.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-sm text-gray-600">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCodes.map((code) => (
              <Link key={code.code} href={`/acs/${code.code}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="rounded-lg bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                        {code.code}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {code.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {code.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {code.area}
                      </span>
                      {code.task && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {code.task}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination (placeholder - static for SEO) */}
        {filteredCodes.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                Previous
              </span>
              <span className="inline-flex items-center justify-center rounded-lg border border-primary-600 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-600">
                1
              </span>
              <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                2
              </span>
              <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                3
              </span>
              <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                Next
              </span>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}