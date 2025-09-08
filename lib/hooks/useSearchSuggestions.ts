import { useState, useEffect, useMemo } from "react";
import type { SearchSuggestion } from "@/components/acs/AcsSearchBar";
import { fetchAcsCodes, type TAcsCodeSummary } from "@/lib/api/acs";
import { useDebounce } from "./useDebounce";

interface UseSearchSuggestionsOptions {
  query: string;
  maxSuggestions?: number;
  includePopular?: boolean;
  recentSearches?: string[];
}

interface PopularSearch {
  term: string;
  count: number;
}

const POPULAR_SEARCHES: PopularSearch[] = [
  { term: "aerodynamics", count: 245 },
  { term: "navigation", count: 189 },
  { term: "weather", count: 167 },
  { term: "emergency procedures", count: 156 },
  { term: "radio communication", count: 143 },
  { term: "flight planning", count: 134 },
  { term: "aircraft systems", count: 128 },
  { term: "regulations", count: 121 },
];

export function useSearchSuggestions({
  query,
  maxSuggestions = 8,
  includePopular = true,
  recentSearches = [],
}: UseSearchSuggestionsOptions) {
  const [codeSuggestions, setCodeSuggestions] = useState<TAcsCodeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setCodeSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAcsCodes({
          q: debouncedQuery,
          limit: Math.min(maxSuggestions, 5),
          fields: "code,slug,title,shortDescription",
        });

        setCodeSuggestions(response.items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch suggestions"
        );
        setCodeSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, maxSuggestions]);

  const suggestions = useMemo(() => {
    const allSuggestions: SearchSuggestion[] = [];

    if (query.length === 0) {
      recentSearches.slice(0, 5).forEach((search, index) => {
        allSuggestions.push({ id: `recent-${index}`, text: search, type: "recent" });
      });
      return allSuggestions;
    }

    codeSuggestions.forEach((code) => {
      allSuggestions.push({
        id: `code-${code.code}`,
        text: code.title,
        code: code.code,
        title: code.title,
        type: "code",
      });
    });

    if (includePopular && query.length >= 2) {
      POPULAR_SEARCHES.forEach((popular) => {
        if (
          popular.term.toLowerCase().includes(query.toLowerCase()) &&
          !allSuggestions.some(
            (s) => s.text.toLowerCase() === popular.term.toLowerCase()
          )
        ) {
          allSuggestions.push({
            id: `popular-${popular.term}`,
            text: popular.term,
            type: "popular",
            count: popular.count,
          });
        }
      });
    }

    if (query.length >= 3) {
      const titleSuggestions = codeSuggestions
        .filter(
          (code) =>
            code.title.toLowerCase().includes(query.toLowerCase()) &&
            !allSuggestions.some((s) => s.code === code.code)
        )
        .slice(0, 2);

      titleSuggestions.forEach((code) => {
        allSuggestions.push({
          id: `title-${code.code}`,
          text: code.title,
          code: code.code,
          title: code.title,
          type: "title",
        });
      });
    }

    return allSuggestions.slice(0, maxSuggestions);
  }, [query, codeSuggestions, includePopular, recentSearches, maxSuggestions]);

  return { suggestions, loading, error };
}

