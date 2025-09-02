"use client";

import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input, Button } from "@/components/ui";

interface AcsSearchProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function AcsSearch({
  initialQuery = "",
  onSearch,
  placeholder = "Search by code, title, or description...",
  debounceMs = 300,
}: AcsSearchProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = useCallback(() => {
    onSearch(query);
  }, [query, onSearch]);

  // Debounced search on query change
  useEffect(() => {
    const timeoutId = setTimeout(handleSearch, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [handleSearch, debounceMs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="py-3 pl-10 pr-4 text-base"
          aria-label="Search ACS codes"
        />
      </div>
      <Button onClick={handleSearch} className="px-6 py-3">
        Search
      </Button>
    </div>
  );
}