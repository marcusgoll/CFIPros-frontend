"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export interface InfiniteScrollOptions {
  enabled: boolean;
  threshold?: number;
  loadingComponent?: React.ReactNode;
}

interface AcsPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  infiniteScroll?: InfiniteScrollOptions;
  loading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  showQuickJump?: boolean;
  showPageSize?: boolean;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  virtualized?: boolean;
}

export default function AcsPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
  infiniteScroll = { enabled: false },
  loading = false,
  hasNextPage = true,
  onLoadMore,
  showQuickJump = false,
  showPageSize = false,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: AcsPaginationProps) {
  const [quickJumpPage, setQuickJumpPage] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!infiniteScroll.enabled || !onLoadMore) {return;}
    
    const threshold = infiniteScroll.threshold || 0.1;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !loading) {
          onLoadMore();
        }
      },
      { threshold }
    );
    
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }
    
    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [infiniteScroll.enabled, infiniteScroll.threshold, onLoadMore, hasNextPage, loading]);
  
  const handleQuickJump = useCallback(() => {
    const page = parseInt(quickJumpPage);
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      setQuickJumpPage("");
    }
  }, [quickJumpPage, totalPages, currentPage, onPageChange]);
  
  const handleQuickJumpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickJump();
    }
  };
  
  // Hide pagination if using infinite scroll and only one page
  if (infiniteScroll.enabled && totalPages <= 1) {
    return null;
  }
  
  // For infinite scroll, show load more section
  if (infiniteScroll.enabled) {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        {/* Load more trigger */}
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-4"
        >
          {loading ? (
            infiniteScroll.loadingComponent || (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            )
          ) : hasNextPage ? (
            <Button
              onClick={onLoadMore}
              variant="outline"
              className="px-6 py-2"
            >
              Load More
            </Button>
          ) : (
            <p className="text-sm text-gray-500">No more results to load</p>
          )}
        </div>
        
        {/* Optional pagination controls */}
        <div className="text-center">
          <p className="text-sm text-gray-700">
            Showing {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
          </p>
          {totalPages > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInfiniteScroll(prev => ({ ...prev, enabled: false }))}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Switch to pagination
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const delta = 2; // Number of pages to show around current page

    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Add ellipsis if needed before current page group
      if (currentPage - delta > 2) {
        pages.push("ellipsis");
      }

      // Add pages around current page
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed after current page group
      if (currentPage + delta < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Page Size and Quick Jump Controls */}
      {(showPageSize || showQuickJump) && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {showPageSize && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                className="rounded border-gray-300 py-1 px-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-gray-700">per page</span>
            </div>
          )}
          
          {showQuickJump && totalPages > 10 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={quickJumpPage}
                onChange={(e) => setQuickJumpPage(e.target.value)}
                onKeyPress={handleQuickJumpKeyPress}
                placeholder={currentPage.toString()}
                className="w-16 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Button
                size="sm"
                onClick={handleQuickJump}
                disabled={!quickJumpPage || parseInt(quickJumpPage) === currentPage}
              >
                Go
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Main Pagination */}
      <div className="flex items-center justify-between">
      {/* Results info */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            {/* Previous button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, index) => {
              if (page === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                );
              }

              const isCurrentPage = page === currentPage;

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${
                    isCurrentPage
                      ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      : "text-gray-900 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  }`}
                  aria-current={isCurrentPage ? "page" : undefined}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
          
          {loading && (
            <div className="flex items-center ml-4">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="ml-1 text-sm text-gray-600">Loading...</span>
            </div>
          )}
        </div>
        </div>
      </div>
      
      {/* Infinite Scroll Option */}
      {totalPages > 3 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onLoadMore) {
                // Enable infinite scroll mode
                window.location.href = `${window.location.pathname}${window.location.search}#infinite`;
              }
            }}
            className="text-blue-600 hover:text-blue-800"
            disabled={!onLoadMore}
          >
            Switch to infinite scroll
          </Button>
        </div>
      )}
    </div>
  );
  
  // Helper function to handle infinite scroll toggle (used in parent)
  function setInfiniteScroll(updater: (prev: InfiniteScrollOptions) => InfiniteScrollOptions) {
    // This would be handled by parent component
    console.warn('setInfiniteScroll should be implemented in parent component');
  }
}