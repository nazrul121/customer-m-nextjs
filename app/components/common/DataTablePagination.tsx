'use client';

import { Table } from '@tanstack/react-table';
import React, { useMemo } from 'react';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount: number;
  isFetching: boolean;
}

// Helper function to calculate the page range to display
const getPageNumbers = (currentPage: number, pageCount: number, maxPagesToShow: number = 5) => {
  if (pageCount <= 1) return [];

  const halfPages = Math.floor(maxPagesToShow / 2);
  let startPage = Math.max(0, currentPage - halfPages);
  let endPage = Math.min(pageCount - 1, currentPage + halfPages);

  // Adjust range if it hits the start or end boundaries
  if (endPage - startPage + 1 < maxPagesToShow) {
    if (startPage === 0) {
      endPage = Math.min(pageCount - 1, maxPagesToShow - 1);
    } else if (endPage === pageCount - 1) {
      startPage = Math.max(0, pageCount - maxPagesToShow);
    }
  }

  // Generate the array of page indexes (0-based)
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
};

export function DataTablePagination<TData>({
  table,
  totalCount,
  isFetching,
}: DataTablePaginationProps<TData>) {

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  // Memoize the page numbers array for performance
  const pageNumbers = useMemo(() => {
    return getPageNumbers(pageIndex, pageCount);
  }, [pageIndex, pageCount]);

  return (
    <div className="mt-4 flex items-center justify-between">
      
      {/* Total Items Count Display */}
      <span className="text-sm text-gray-500">
        Page {pageIndex + 1} of {pageCount} ({totalCount} items)
      </span>
      
      <div className="flex items-center space-x-2">
        
        {/* Previous Page Button */}
        <button 
          className="btn btn-sm btn-ghost" 
          onClick={() => table.previousPage()} 
          disabled={!table.getCanPreviousPage() || isFetching}
        > 
          « Previous
        </button>

        {/* Page Number Buttons (The core modification) */}
        <div className="join">
          {/* Always show the first page if it's not in the range and we're far from it */}
          {pageNumbers.length > 0 && pageNumbers[0] > 0 && (
              <>
                  <button 
                      className="join-item btn btn-sm" 
                      onClick={() => table.setPageIndex(0)} 
                      disabled={isFetching}
                  > 
                      1 
                  </button>
                  {/* Show ellipsis if the first visible page is not the second page */}
                  {pageNumbers[0] > 1 && <span className="join-item btn btn-sm btn-disabled">...</span>}
              </>
          )}

          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`join-item btn btn-sm ${page === pageIndex ? 'btn-active btn-secondary' : 'btn-ghost'}`}
              onClick={() => table.setPageIndex(page)}
              disabled={isFetching || page === pageIndex}
            >
              {page + 1}
            </button>
          ))}
          
          {/* Always show the last page if it's not in the range and we're far from it */}
          {pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < pageCount - 1 && (
            <>
                {/* Show ellipsis if the last visible page is not the second-to-last page */}
                {pageNumbers[pageNumbers.length - 1] < pageCount - 2 && <span className="join-item btn btn-sm btn-disabled">...</span>}
                <button 
                    className="join-item btn btn-sm" 
                    onClick={() => table.setPageIndex(pageCount - 1)} 
                    disabled={isFetching}
                >  {pageCount} 
                </button>
            </>
          )}
        </div>
        
        {/* Next Page Button */}
        <button className="btn btn-sm btn-ghost" 
          onClick={() => table.nextPage()} 
          disabled={!table.getCanNextPage() || isFetching}
        > 
          Next »
        </button>
      </div>
    </div>
  );
}