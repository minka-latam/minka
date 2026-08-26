import React, { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  siblingCount?: number;
  className?: string;
}

export function EnhancedPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  isLoading = false,
  siblingCount = 1,
  className = "",
}: EnhancedPaginationProps) {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) return null;

  // Debounce page changes to prevent rapid clicking
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestedPageRef = useRef<number>(currentPage);

  const debouncedPageChange = useCallback(
    (page: number) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Store the requested page
      lastRequestedPageRef.current = page;

      // If not loading, execute immediately
      if (!isLoading) {
        onPageChange(page);
        return;
      }

      // Otherwise, debounce the request
      timeoutRef.current = setTimeout(() => {
        // Only execute if this is still the latest requested page
        if (lastRequestedPageRef.current === page) {
          onPageChange(page);
        }
      }, 300);
    },
    [onPageChange, isLoading]
  );

  // Calculate the range of pages to show
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => start + idx);
  };

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount + 5; // siblingCount + firstPage + lastPage + currentPage + 2*DOTS

    // If the number of pages is less than the page numbers we want to show in our pagination component, we return the range [1..totalPages]
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: No left dots to show, but rights dots to be shown
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);

      return [...leftRange, "DOTS", totalPages];
    }

    // Case 3: No right dots to show, but left dots to be shown
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, "DOTS", ...rightRange];
    }

    // Case 4: Both left and right dots to be shown
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, "DOTS", ...middleRange, "DOTS", lastPageIndex];
    }

    return [];
  };

  const paginationRange = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) {
      return;
    }
    debouncedPageChange(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Results count */}
      <div className="text-sm text-gray-600">
        Mostrando página {currentPage} de {totalPages} ({totalCount} resultados)
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-[#2c6e49]">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium">Cargando...</span>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className="flex items-center px-3 py-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {paginationRange.map((pageNumber, index) => {
            // If the pageItem is a DOT, render the DOTS unicode character
            if (pageNumber === "DOTS") {
              return (
                <div
                  key={`dots-${index}`}
                  className="px-3 py-2 text-gray-500"
                  aria-label="More pages"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            // Render page numbers
            const isCurrentPage = pageNumber === currentPage;
            const isPendingPage =
              lastRequestedPageRef.current === pageNumber && isLoading;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNumber as number)}
                disabled={isLoading}
                className={`min-w-[40px] relative ${
                  isCurrentPage
                    ? "bg-[#2c6e49] hover:bg-[#2c6e49]/90 text-white"
                    : "hover:bg-gray-100"
                } ${isPendingPage ? "opacity-75" : ""}`}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isCurrentPage ? "page" : undefined}
              >
                {isPendingPage ? (
                  <LoadingSpinner
                    size="sm"
                    tone={isCurrentPage ? "inverse" : "brand"}
                  />
                ) : pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages || isLoading}
          className="flex items-center px-3 py-2"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Quick navigation for mobile */}
      <div className="block sm:hidden">
        <select
          value={currentPage}
          onChange={(e) => handlePageChange(Number(e.target.value))}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6e49] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Select page"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              Página {page}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
