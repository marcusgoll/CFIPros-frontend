"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'code' | 'title';
  count?: number;
  code?: string;
  title?: string;
}

interface AcsSearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  suggestions?: SearchSuggestion[];
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  recentSearches?: string[];
  onRecentSearchAdd?: (query: string) => void;
}

export default function AcsSearchBar({
  initialQuery = "",
  onSearch,
  placeholder = "Search by code, title, or description...",
  debounceMs = 300,
  suggestions = [],
  onSuggestionClick,
  showSuggestions = true,
  maxSuggestions = 8,
  recentSearches = [],
  onRecentSearchAdd,
}: AcsSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 200);

  // Sync with external query changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    onSearch(finalQuery);
    
    // Add to recent searches if provided
    if (finalQuery.trim() && onRecentSearchAdd) {
      onRecentSearchAdd(finalQuery);
    }
    
    setShowSuggestionsDropdown(false);
    inputRef.current?.blur();
  }, [query, onSearch, onRecentSearchAdd]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
    setShowSuggestionsDropdown(false);
    setSelectedSuggestionIndex(-1);
  }, [onSearch]);

  // Show/hide suggestions based on focus and query
  useEffect(() => {
    if (isFocused && showSuggestions && (query.length > 0 || recentSearches.length > 0)) {
      setShowSuggestionsDropdown(true);
    } else {
      setShowSuggestionsDropdown(false);
    }
  }, [isFocused, showSuggestions, query, recentSearches.length]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsDropdown(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        const suggestion = filteredSuggestions[selectedSuggestionIndex];
        handleSuggestionClick(suggestion);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const searchText = suggestion.code || suggestion.text;
    setQuery(searchText);
    
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      handleSearch(searchText);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1);
  };

  // Filter and combine suggestions
  const getFilteredSuggestions = () => {
    let filtered: SearchSuggestion[] = [];
    
    if (query.length > 0) {
      // Filter suggestions based on query
      filtered = suggestions.filter(s => 
        s.text.toLowerCase().includes(query.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(query.toLowerCase())) ||
        (s.title && s.title.toLowerCase().includes(query.toLowerCase()))
      );
    } else if (recentSearches.length > 0) {
      // Show recent searches when no query
      filtered = recentSearches.slice(0, 5).map((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent' as const,
      }));
    }
    
    return filtered.slice(0, maxSuggestions);
  };

  const filteredSuggestions = getFilteredSuggestions();

  const highlightMatch = (text: string, query: string) => {
    if (!query) {return text;}
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-gray-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
      case 'code':
        return <div className="h-4 w-4 rounded bg-blue-100 text-xs flex items-center justify-center text-blue-600 font-mono">C</div>;
      case 'title':
        return <div className="h-4 w-4 rounded bg-green-100 text-xs flex items-center justify-center text-green-600">T</div>;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="py-3 pl-10 pr-12 text-base"
          aria-label="Search ACS codes"
          aria-expanded={showSuggestionsDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {/* Suggestions Dropdown */}
        {showSuggestionsDropdown && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Recent Searches
              </div>
            )}
            
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                  index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                }`}
                role="option"
                aria-selected={index === selectedSuggestionIndex}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0 mr-3">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {suggestion.type === 'code' && suggestion.code ? (
                        <div>
                          <div className="font-mono font-medium">
                            {highlightMatch(suggestion.code, query)}
                          </div>
                          {suggestion.title && (
                            <div className="text-xs text-gray-600 truncate">
                              {highlightMatch(suggestion.title, query)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="truncate">
                          {highlightMatch(suggestion.text, query)}
                        </div>
                      )}
                    </div>
                  </div>
                  {suggestion.count !== undefined && (
                    <div className="flex-shrink-0 ml-2 text-xs text-gray-400">
                      {suggestion.count}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button 
        onClick={() => handleSearch()} 
        className="px-6 py-3"
        aria-label="Execute search"
      >
        Search
      </Button>
    </div>
  );
}