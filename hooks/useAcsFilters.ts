import { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterState, FilterOption } from '@/components/acs/AcsFilterSidebar';
import { fetchAcsCodes, fetchAcsDocuments } from '@/lib/api/acs';
import { useDebounce } from './useDebounce';

interface UseAcsFiltersOptions {
  initialFilters?: Partial<FilterState>;
  fetchOptions?: boolean;
  debounceMs?: number;
}

interface FilterOptionsState {
  docs: FilterOption[];
  types: FilterOption[];
  areas: FilterOption[];
  tasks: FilterOption[];
}

const DEFAULT_FILTERS: FilterState = {
  docs: [],
  types: [],
  areas: [],
  tasks: [],
  codePrefix: '',
};

const DEFAULT_TYPE_OPTIONS: FilterOption[] = [
  { value: 'knowledge', label: 'Knowledge', count: 0 },
  { value: 'skill', label: 'Skill', count: 0 },
  { value: 'risk_management', label: 'Risk Management', count: 0 },
];

export function useAcsFilters({
  initialFilters = {},
  fetchOptions = true,
  debounceMs = 300,
}: UseAcsFiltersOptions = {}) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  
  const [filterOptions, setFilterOptions] = useState<FilterOptionsState>({
    docs: [],
    types: DEFAULT_TYPE_OPTIONS,
    areas: [],
    tasks: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedFilters = useDebounce(filters, debounceMs);

  // Fetch filter options on mount
  useEffect(() => {
    if (!fetchOptions) return;

    const fetchFilterOptions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch documents for docs filter
        const [docsResponse, codesResponse] = await Promise.all([
          fetchAcsDocuments({ limit: 100 }),
          fetchAcsCodes({ 
            limit: 1000, // Large limit to get comprehensive options
            fields: 'doc,type,area,task',
          }),
        ]);

        // Process documents
        const docOptions: FilterOption[] = docsResponse.items.map(doc => ({
          value: doc.code,
          label: doc.title,
          count: 0, // Would be populated from aggregation in real API
        }));

        // Process areas and tasks from codes
        const areaMap = new Map<string, number>();
        const taskMap = new Map<string, number>();
        const typeMap = new Map<string, number>();

        codesResponse.items.forEach(code => {
          // Count types
          if (code.type) {
            typeMap.set(code.type, (typeMap.get(code.type) || 0) + 1);
          }
          
          // Count areas
          if (code.area) {
            areaMap.set(code.area, (areaMap.get(code.area) || 0) + 1);
          }
          
          // Count tasks
          if (code.task) {
            taskMap.set(code.task, (taskMap.get(code.task) || 0) + 1);
          }
        });

        // Convert to filter options
        const areaOptions: FilterOption[] = Array.from(areaMap.entries())
          .map(([area, count]) => ({
            value: area,
            label: area,
            count,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        const taskOptions: FilterOption[] = Array.from(taskMap.entries())
          .map(([task, count]) => ({
            value: task,
            label: task,
            count,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        // Update type counts
        const typeOptions: FilterOption[] = DEFAULT_TYPE_OPTIONS.map(type => ({
          ...type,
          count: typeMap.get(type.value) || 0,
        }));

        setFilterOptions({
          docs: docOptions,
          types: typeOptions,
          areas: areaOptions,
          tasks: taskOptions,
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch filter options');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [fetchOptions]);

  // Update filter function
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Reset specific filter
  const resetFilter = useCallback((filterKey: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterKey === 'codePrefix' ? '' : [],
    }));
  }, []);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.docs.length > 0 ||
      filters.types.length > 0 ||
      filters.areas.length > 0 ||
      filters.tasks.length > 0 ||
      filters.codePrefix.length > 0
    );
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.docs.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.areas.length > 0) count++;
    if (filters.tasks.length > 0) count++;
    if (filters.codePrefix.length > 0) count++;
    return count;
  }, [filters]);

  // Convert to API params
  const getApiParams = useCallback(() => {
    const params: Record<string, any> = {};
    
    if (filters.docs.length > 0) {
      params.doc = filters.docs.join(',');
    }
    
    if (filters.types.length > 0) {
      if (filters.types.length === 1) {
        params.type = filters.types[0];
      } else {
        // Multiple types would need different API handling
        params.type = filters.types.join(',');
      }
    }
    
    if (filters.areas.length > 0) {
      params.area = filters.areas.join(',');
    }
    
    if (filters.tasks.length > 0) {
      params.task = filters.tasks.join(',');
    }
    
    if (filters.codePrefix) {
      params.code_prefix = filters.codePrefix;
    }
    
    return params;
  }, [filters]);

  // Get URL search params
  const getUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.docs.length > 0) {
      filters.docs.forEach(doc => params.append('doc', doc));
    }
    
    if (filters.types.length > 0) {
      filters.types.forEach(type => params.append('type', type));
    }
    
    if (filters.areas.length > 0) {
      filters.areas.forEach(area => params.append('area', area));
    }
    
    if (filters.tasks.length > 0) {
      filters.tasks.forEach(task => params.append('task', task));
    }
    
    if (filters.codePrefix) {
      params.set('prefix', filters.codePrefix);
    }
    
    return params;
  }, [filters]);

  // Parse URL params to filters
  const parseUrlParams = useCallback((searchParams: URLSearchParams): FilterState => {
    return {
      docs: searchParams.getAll('doc'),
      types: searchParams.getAll('type'),
      areas: searchParams.getAll('area'),
      tasks: searchParams.getAll('task'),
      codePrefix: searchParams.get('prefix') || '',
    };
  }, []);

  return {
    filters,
    debouncedFilters,
    filterOptions,
    loading,
    error,
    hasActiveFilters,
    activeFilterCount,
    updateFilters,
    clearFilters,
    resetFilter,
    getApiParams,
    getUrlParams,
    parseUrlParams,
  };
}