"use client";

import { memo, useMemo, useState, useRef, useEffect } from "react";
import { TAcsCodeSummary } from "@/lib/api/acs";
import AcsCodeCard from "./AcsCodeCard";
import { useVirtualGrid } from "@/hooks/useVirtualization";
import { useIntersectionObserver } from "@/hooks/useInfiniteScroll";

interface AcsCodeGridProps {
  codes: TAcsCodeSummary[];
  loading?: boolean;
  className?: string;
  searchQuery?: string;
  virtualized?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  containerHeight?: number;
}

// Memoized skeleton component for loading states
const CodeCardSkeleton = memo(() => (
  <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 rounded bg-gray-200"></div>
          <div className="h-5 w-16 rounded-full bg-gray-200"></div>
        </div>
        <div className="mt-2 h-5 w-3/4 rounded bg-gray-200"></div>
      </div>
      <div className="h-5 w-5 rounded bg-gray-200"></div>
    </div>
    <div className="mb-4">
      <div className="h-4 w-1/2 rounded bg-gray-200"></div>
    </div>
    <div className="mb-4 space-y-2">
      <div className="h-3 w-full rounded bg-gray-200"></div>
      <div className="h-3 w-5/6 rounded bg-gray-200"></div>
      <div className="h-3 w-4/6 rounded bg-gray-200"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 w-20 rounded bg-gray-200"></div>
      <div className="h-3 w-12 rounded bg-gray-200"></div>
    </div>
  </div>
));

CodeCardSkeleton.displayName = 'CodeCardSkeleton';

// Memoized card component for performance
const MemoizedAcsCodeCard = memo(AcsCodeCard);

// Virtual grid item component
interface VirtualGridItemProps {
  code: TAcsCodeSummary;
  style: React.CSSProperties;
  searchQuery?: string;
}

const VirtualGridItem = memo(({ code, style, searchQuery }: VirtualGridItemProps) => {
  return (
    <div style={style}>
      <MemoizedAcsCodeCard code={code} searchQuery={searchQuery} />
    </div>
  );
});

VirtualGridItem.displayName = 'VirtualGridItem';

export default function AcsCodeGrid({
  codes,
  loading = false,
  className = "",
  searchQuery,
  virtualized = false,
  onLoadMore,
  hasMore = false,
  containerHeight = 600,
}: AcsCodeGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useIntersectionObserver(() => {
    if (onLoadMore && hasMore && !loading) {
      onLoadMore();
    }
  });
  
  // Responsive grid calculations
  const gridConfig = useMemo(() => {
    const breakpoints = {
      sm: 640,
      lg: 1024,
      xl: 1280,
    };
    
    let columns = 1;
    if (containerWidth >= breakpoints.xl) {
      columns = 3;
    } else if (containerWidth >= breakpoints.lg) {
      columns = 3;
    } else if (containerWidth >= breakpoints.sm) {
      columns = 2;
    }
    
    const gap = 24; // 6 * 4px (gap-6)
    const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;
    const itemHeight = 280; // Approximate card height
    
    return { columns, itemWidth, itemHeight, gap };
  }, [containerWidth]);
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Virtual grid for large datasets
  const virtualGrid = useVirtualGrid({
    itemWidth: gridConfig.itemWidth,
    itemHeight: gridConfig.itemHeight,
    containerWidth: containerWidth || 1200,
    containerHeight,
    itemCount: codes.length,
    columns: gridConfig.columns,
    overscan: 3,
  });
  // Virtualized rendering for large datasets
  if (virtualized && codes.length > 50) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div
          style={{
            height: virtualGrid.totalHeight,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualGrid.virtualItems.map((item) => {
            const code = codes[item.index];
            if (!code) {return null;}
            
            return (
              <VirtualGridItem
                key={code.code}
                code={code}
                searchQuery={searchQuery}
                style={{
                  position: 'absolute',
                  top: item.y,
                  left: item.x,
                  width: gridConfig.itemWidth,
                  height: gridConfig.itemHeight,
                }}
              />
            );
          })}
        </div>
        
        {/* Load more trigger for infinite scroll */}
        {onLoadMore && hasMore && (
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-8"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>Loading more...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Scroll to load more</div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  if (loading) {
    return (
      <div
        ref={containerRef}
        className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
        aria-label="Loading ACS codes"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <CodeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!codes || codes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No codes found</h3>
        <p className="mt-2 text-gray-600">
          No ACS codes match your current search criteria.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
        role="grid"
        aria-label={`ACS codes grid showing ${codes.length} results`}
      >
        {codes.map((code) => (
          <div
            key={code.code}
            role="gridcell"
            tabIndex={0}
            aria-label={`ACS code ${code.code}: ${code.title}`}
          >
            <MemoizedAcsCodeCard code={code} searchQuery={searchQuery} />
          </div>
        ))}
      </div>
      
      {/* Load more trigger for infinite scroll */}
      {onLoadMore && hasMore && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8 mt-6"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span>Loading more...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              Load More Results
            </button>
          )}
        </div>
      )}
    </>
  );
}