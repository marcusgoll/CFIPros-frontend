"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input, Button } from "@/components/ui";

const areas = ["All Areas", "Preflight Preparation", "Navigation", "Airport Operations", "Takeoffs and Landings"];
const tasks = ["All Tasks", "Pilot Qualifications", "Airworthiness Requirements", "Weather Information", "Navigation Systems and Radar Services"];

interface SearchFilters {
  query: string;
  area: string;
  task: string;
}

interface ACSSearchClientProps {
  onSearch?: (filters: SearchFilters) => void;
}

export default function ACSSearchClient({ onSearch }: ACSSearchClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [selectedTask, setSelectedTask] = useState("All Tasks");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(() => {
    const filters: SearchFilters = {
      query: searchQuery,
      area: selectedArea,
      task: selectedTask,
    };
    
    // Call the parent component's search handler if provided
    if (onSearch) {
      onSearch(filters);
    }
    
    // For now, we'll also emit a custom event for static pages to potentially listen to
    window.dispatchEvent(
      new CustomEvent("acsSearch", { 
        detail: filters 
      })
    );
  }, [searchQuery, selectedArea, selectedTask, onSearch]);

  // Trigger search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(handleSearch, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  return (
    <>
      {/* Search Bar */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by code, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-3 text-base"
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="px-6 py-3"
          >
            Search
          </Button>
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
    </>
  );
}