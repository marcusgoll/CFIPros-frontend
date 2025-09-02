"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AcsSearch from "@/components/acs/AcsSearch";
import AcsFilters from "@/components/acs/AcsFilters";
import AcsList from "@/components/acs/AcsList";
import { 
  fetchAcsCodes, 
  type AcsCode, 
  type AcsSearchParams,
  type AcsSearchResponse 
} from "@/lib/api/acs";

export default function AcsSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [codes, setCodes] = useState<AcsCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Parse filters from URL params
  const filters = useMemo((): Partial<AcsSearchParams> => ({
    query: searchParams.get("q") || "",
    document: searchParams.get("doc") || "",
    area: searchParams.get("area") || "",
    task: searchParams.get("task") || "",
    knowledge_level: searchParams.get("knowledge") || "",
    risk_level: searchParams.get("risk") || "",
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
  }), [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback((newFilters: Partial<AcsSearchParams>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    // Reset page when changing filters (except when explicitly setting page)
    if (!newFilters.page && (
      newFilters.query !== undefined ||
      newFilters.document !== undefined ||
      newFilters.area !== undefined ||
      newFilters.task !== undefined ||
      newFilters.knowledge_level !== undefined ||
      newFilters.risk_level !== undefined
    )) {
      params.delete("page");
    }

    // Update URL
    const newSearch = params.toString();
    const newUrl = newSearch ? `/acs?${newSearch}` : "/acs";
    router.replace(newUrl);
  }, [router, searchParams]);

  // Search function
  const searchCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result: AcsSearchResponse = await fetchAcsCodes({
        ...filters,
        // Always include includes for search results
        include: ["document", "related"]
      });

      setCodes(result.results);
      setTotalCount(result.count);
    } catch (err) {
      // Remove console.error for production
      setError(err instanceof Error ? err.message : "Search failed");
      setCodes([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load and when filters change
  useEffect(() => {
    searchCodes();
  }, [searchCodes]);

  // Handle search query changes
  const handleSearch = useCallback((query: string) => {
    const newFilters: Partial<AcsSearchParams> = {
      ...filters,
      query,
      page: 1, // Reset to first page
    };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<AcsSearchParams>) => {
    updateFilters({
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page
    });
  }, [filters, updateFilters]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              ACS Code Database
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600">
              Search and explore the complete Airman Certification Standards (ACS) code database.
              Find specific knowledge areas, tasks, and requirements for pilot training.
            </p>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <AcsSearch
            onSearch={handleSearch}
            defaultValue={filters.query || ""}
            placeholder="Search ACS codes, descriptions, or areas..."
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <AcsFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              loading={loading}
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <AcsList
              codes={codes}
              loading={loading}
              error={error}
              totalCount={totalCount}
              currentPage={filters.page || 1}
              pageSize={filters.limit || 20}
              onPageChange={handlePageChange}
              onRetry={searchCodes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}