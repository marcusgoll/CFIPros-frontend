import { useState, useEffect, useMemo, useCallback } from "react";
import { FilterState, FilterOption } from "@/components/acs/AcsFilterSidebar";
import { fetchAcsCodes, fetchAcsDocuments } from "@/lib/api/acs";
import { useDebounce } from "./useDebounce";

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
  codePrefix: "",
};

const DEFAULT_TYPE_OPTIONS: FilterOption[] = [
  { value: "knowledge", label: "Knowledge", count: 0 },
  { value: "skill", label: "Skill", count: 0 },
  { value: "risk_management", label: "Risk Management", count: 0 },
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

  useEffect(() => {
    if (!fetchOptions) {return;}

    const fetchFilterOptions = async () => {
      setLoading(true);
      setError(null);

      try {
        const [docsResponse, codesResponse] = await Promise.all([
          fetchAcsDocuments({ limit: 100 }),
          fetchAcsCodes({ limit: 1000, fields: "doc,type,area,task" }),
        ]);

        const docOptions: FilterOption[] = docsResponse.items.map((doc) => ({
          value: doc.code,
          label: doc.title,
          count: 0,
        }));

        const areaMap = new Map<string, number>();
        const taskMap = new Map<string, number>();
        const typeMap = new Map<string, number>();

        codesResponse.items.forEach((code) => {
          if (code.type) {typeMap.set(code.type, (typeMap.get(code.type) || 0) + 1);}
          if (code.area) {areaMap.set(code.area, (areaMap.get(code.area) || 0) + 1);}
          if (code.task) {taskMap.set(code.task, (taskMap.get(code.task) || 0) + 1);}
        });

        const areaOptions: FilterOption[] = Array.from(areaMap.entries())
          .map(([area, count]) => ({ value: area, label: area, count }))
          .sort((a, b) => a.label.localeCompare(b.label));

        const taskOptions: FilterOption[] = Array.from(taskMap.entries())
          .map(([task, count]) => ({ value: task, label: task, count }))
          .sort((a, b) => a.label.localeCompare(b.label));

        const typeOptions: FilterOption[] = DEFAULT_TYPE_OPTIONS.map((type) => ({
          ...type,
          count: typeMap.get(type.value) || 0,
        }));

        setFilterOptions({ docs: docOptions, types: typeOptions, areas: areaOptions, tasks: taskOptions });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch filter options");
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [fetchOptions]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const resetFilter = useCallback((filterKey: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: filterKey === "codePrefix" ? "" : [],
    }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.docs.length > 0 ||
      filters.types.length > 0 ||
      filters.areas.length > 0 ||
      filters.tasks.length > 0 ||
      filters.codePrefix.length > 0
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.docs.length > 0) {count++;}
    if (filters.types.length > 0) {count++;}
    if (filters.areas.length > 0) {count++;}
    if (filters.tasks.length > 0) {count++;}
    if (filters.codePrefix.length > 0) {count++;}
    return count;
  }, [filters]);

  const getApiParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.docs.length > 0) {params.doc = filters.docs.join(",");}
    if (filters.types.length > 0) {params.type = filters.types.join(",");}
    if (filters.areas.length > 0) {params.area = filters.areas.join(",");}
    if (filters.tasks.length > 0) {params.task = filters.tasks.join(",");}
    if (filters.codePrefix) {params.code_prefix = filters.codePrefix;}
    return params;
  }, [filters]);

  const getUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.docs.length > 0) {filters.docs.forEach((d) => params.append("doc", d));}
    if (filters.types.length > 0) {filters.types.forEach((t) => params.append("type", t));}
    if (filters.areas.length > 0) {filters.areas.forEach((a) => params.append("area", a));}
    if (filters.tasks.length > 0) {filters.tasks.forEach((t) => params.append("task", t));}
    if (filters.codePrefix) {params.set("prefix", filters.codePrefix);}
    return params;
  }, [filters]);

  const parseUrlParams = useCallback((searchParams: URLSearchParams): FilterState => {
    return {
      docs: searchParams.getAll("doc"),
      types: searchParams.getAll("type"),
      areas: searchParams.getAll("area"),
      tasks: searchParams.getAll("task"),
      codePrefix: searchParams.get("prefix") || "",
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
