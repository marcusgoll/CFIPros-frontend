"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, X, Filter } from "lucide-react";
import { Button } from "@/components/ui";

export interface FilterState {
  docs: string[];
  types: string[];
  areas: string[];
  tasks: string[];
  codePrefix: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableOptions: {
    docs: FilterOption[];
    types: FilterOption[];
    areas: FilterOption[];
    tasks: FilterOption[];
  };
  loading?: boolean;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  maxVisible?: number;
}

function FilterSection({
  title,
  options,
  selectedValues,
  onSelectionChange,
  isCollapsed,
  onToggleCollapse,
  maxVisible = 5,
}: FilterSectionProps) {
  const [showAll, setShowAll] = useState(false);
  
  const visibleOptions = showAll ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;

  const handleOptionToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(options.map(opt => opt.value));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={onToggleCollapse}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-gray-900 hover:text-gray-700"
        aria-expanded={!isCollapsed}
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {selectedValues.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {selectedValues.length}
            </span>
          )}
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="mt-3 space-y-2">
          {/* Select/Clear All Controls */}
          {options.length > 1 && (
            <div className="flex gap-2 text-xs">
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800"
                disabled={selectedValues.length === options.length}
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-800"
                disabled={selectedValues.length === 0}
              >
                Clear All
              </button>
            </div>
          )}

          {/* Filter Options */}
          <div className="space-y-2">
            {visibleOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center justify-between py-1 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleOptionToggle(option.value)}
                    className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option.label}</span>
                </div>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({option.count})
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* Show More/Less Toggle */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAll ? "Show Less" : `Show ${options.length - maxVisible} More`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AcsFilterSidebar({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
  availableOptions,
  loading = false,
  className = "",
}: FilterSidebarProps) {
  // Collapsible sections state management for hierarchical filtering
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    docs: false,
    types: false,
    areas: true,
    tasks: true,
  });

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleFilterChange = useCallback((filterType: keyof Omit<FilterState, 'codePrefix'>, values: string[]) => {
    onFiltersChange({
      ...filters,
      [filterType]: values,
    });
  }, [filters, onFiltersChange]);

  const handleCodePrefixChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      codePrefix: value,
    });
  }, [filters, onFiltersChange]);

  const hasActiveFilters = 
    filters.docs.length > 0 ||
    filters.types.length > 0 ||
    filters.areas.length > 0 ||
    filters.tasks.length > 0 ||
    filters.codePrefix.length > 0;

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      docs: [],
      types: [],
      areas: [],
      tasks: [],
      codePrefix: "",
    });
  }, [onFiltersChange]);

  // Mobile overlay
  if (isOpen) {
    return (
      <>
        {/* Mobile backdrop */}
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
        
        {/* Mobile-responsive sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 lg:shadow-none ${className}`}>
          <FilterSidebarContent
            onToggle={onToggle}
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableOptions={availableOptions}
            loading={loading}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            handleFilterChange={handleFilterChange}
            handleCodePrefixChange={handleCodePrefixChange}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
          />
        </div>
      </>
    );
  }

  // Desktop sidebar (when closed, show nothing on mobile)
  return (
    <div className="hidden lg:block">
      <div className={`w-80 bg-white ${className}`}>
        <FilterSidebarContent
          onToggle={onToggle}
          filters={filters}
          onFiltersChange={onFiltersChange}
          availableOptions={availableOptions}
          loading={loading}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
          handleFilterChange={handleFilterChange}
          handleCodePrefixChange={handleCodePrefixChange}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
        />
      </div>
    </div>
  );
}

interface FilterSidebarContentProps {
  onToggle: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableOptions: FilterSidebarProps['availableOptions'];
  loading: boolean;
  collapsedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  handleFilterChange: (filterType: keyof Omit<FilterState, 'codePrefix'>, values: string[]) => void;
  handleCodePrefixChange: (value: string) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
}

function FilterSidebarContent({
  onToggle,
  filters,
  availableOptions,
  loading,
  collapsedSections,
  toggleSection,
  handleFilterChange,
  handleCodePrefixChange,
  hasActiveFilters,
  clearAllFilters,
}: FilterSidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 lg:hidden"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Code Prefix Filter */}
          <div className="border-b border-gray-200 pb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Code Prefix
            </label>
            <input
              type="text"
              placeholder="e.g., I.A, II.B..."
              value={filters.codePrefix}
              onChange={(e) => handleCodePrefixChange(e.target.value)}
              className="w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Filter by code prefix (e.g., "I.A" for all codes starting with I.A)
            </p>
          </div>

          {/* Documents Filter */}
          <FilterSection
            title="ACS Documents"
            options={availableOptions.docs}
            selectedValues={filters.docs}
            onSelectionChange={(values) => handleFilterChange('docs', values)}
            isCollapsed={collapsedSections.docs}
            onToggleCollapse={() => toggleSection('docs')}
            maxVisible={8}
          />

          {/* Types Filter */}
          <FilterSection
            title="Type"
            options={availableOptions.types}
            selectedValues={filters.types}
            onSelectionChange={(values) => handleFilterChange('types', values)}
            isCollapsed={collapsedSections.types}
            onToggleCollapse={() => toggleSection('types')}
            maxVisible={5}
          />

          {/* Areas Filter */}
          <FilterSection
            title="Area"
            options={availableOptions.areas}
            selectedValues={filters.areas}
            onSelectionChange={(values) => handleFilterChange('areas', values)}
            isCollapsed={collapsedSections.areas}
            onToggleCollapse={() => toggleSection('areas')}
            maxVisible={10}
          />

          {/* Tasks Filter */}
          <FilterSection
            title="Task"
            options={availableOptions.tasks}
            selectedValues={filters.tasks}
            onSelectionChange={(values) => handleFilterChange('tasks', values)}
            isCollapsed={collapsedSections.tasks}
            onToggleCollapse={() => toggleSection('tasks')}
            maxVisible={10}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-600">Updating filters...</span>
          </div>
        </div>
      )}
    </div>
  );
}