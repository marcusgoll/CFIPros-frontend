import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchMore: (offset: number, limit: number) => Promise<{
    items: T[];
    hasMore: boolean;
    total: number;
  }>;
  initialData?: T[];
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  total: number;
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialData = [],
  pageSize = 20,
  threshold = 0.8,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  
  const loadingRef = useRef(false);
  const currentOffset = useRef(initialData.length);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore || loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMore(currentOffset.current, pageSize);
      
      setData(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      currentOffset.current += result.items.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchMore, pageSize, enabled, loading, hasMore]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setTotal(0);
    currentOffset.current = initialData.length;
    loadingRef.current = false;
  }, [initialData]);

  // Auto-load initial page if no initial data
  useEffect(() => {
    if (enabled && data.length === 0 && !loading && !loadingRef.current) {
      loadMore();
    }
  }, [enabled, data.length, loading, loadMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    total,
  };
}

// Hook for intersection observer-based infinite scroll
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return targetRef;
}

// Hook for scroll-based infinite loading
export function useScrollInfiniteLoad(
  callback: () => void,
  threshold = 0.8,
  enabled = true
) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage >= threshold) {
        callback();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [callback, threshold, enabled]);

  return containerRef;
}