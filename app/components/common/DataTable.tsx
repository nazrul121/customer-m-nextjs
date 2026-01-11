'use client';

import { Icon } from '@iconify/react';
import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
// 🔑 Import your new EmptyState component
import { EmptyState } from './EmptyState'; 

interface DataTableProps<TData extends { id: string | number }, TValue> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  actionSlot?: React.ReactNode;
}

export function DataTable<TData extends { id: string | number }, TValue>({
  columns,
  data,
  totalCount,
  isLoading,
  isFetching,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  actionSlot,
}: DataTableProps<TData, TValue>) {
  
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, sorting, globalFilter, rowSelection: {} },
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange: onGlobalFilterChange as any,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    autoResetAll: false,
    getRowId: (row) => String(row.id), 
    getCoreRowModel: getCoreRowModel(),
  });

  const showLoadingOverlay = isLoading || isFetching;

  return (
    <div className="w-full space-y-4">
      <DataTableToolbar searchTerm={globalFilter}
        onSearchChange={onGlobalFilterChange}
        pageSize={pagination.pageSize}
        onPageSizeChange={(size: number) => table.setPageSize(size)} 
        isFetching={isFetching}
        actionSlot={actionSlot}
      />

      <div className="relative shadow-xl rounded-2xl border border-base-200 bg-base-100 overflow-hidden">
        
        {/* Loading Overlay with Backdrop Blur */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-base-100/40 backdrop-blur-[2px] transition-all">
             <div className="flex flex-col items-center gap-2">
               <span className="loading loading-spinner loading-lg text-primary"></span>
               <span className="text-xs font-bold animate-pulse opacity-50">SYNCING...</span>
             </div>
          </div>
        )}

        <div className="overflow-x-auto min-h-50">
          {!isLoading && data.length === 0 ? (
            /* 🔑 Integrated the Nice Empty State */
            <EmptyState 
              title="No records found"
              message="Try adjusting your search or filters to find what you're looking for."
              onReset={() => onGlobalFilterChange('')}
            />
          ) : (
            <table className="table w-full">
              <thead className="bg-base-200/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-base-300">
                    {headerGroup.headers.map((header) => (
                      <th 
                        key={header.id} 
                        className={`py-4 font-bold text-xs uppercase tracking-wider transition-colors
                          ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-base-300' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </span>

                          {header.column.getCanSort() && (
                            <div className="flex flex-col text-sm opacity-60">
                              {header.column.getIsSorted() === 'asc' ? (
                                <Icon icon="lucide:chevron-up" className="text-primary" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <Icon icon="lucide:chevron-down" className="text-primary" />
                              ) : (
                                <Icon icon="lucide:chevrons-up-down" className="opacity-20" />
                              )}
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-base-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-base-200/30 transition-colors group">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <DataTablePagination table={table} totalCount={totalCount} isFetching={isFetching} />
    </div>
  );
}