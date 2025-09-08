import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "acs-recent-searches";
const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch (error) {
      console.warn("Failed to load recent searches:", error);
    }
  }, []);

  const saveToStorage = useCallback((searches: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.warn("Failed to save recent searches:", error);
    }
  }, []);

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || trimmedQuery.length < 2) {return;}

      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (search) => search.toLowerCase() !== trimmedQuery.toLowerCase()
        );
        const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  const removeRecentSearch = useCallback(
    (query: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter(
          (search) => search.toLowerCase() !== query.toLowerCase()
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear recent searches:", error);
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

