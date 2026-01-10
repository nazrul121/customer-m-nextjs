'use client';
import { Icon } from '@iconify/react';
import React, { useState } from 'react';
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

interface DataTableProps<TData extends { id: string | number }, TValue> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  // State from parent
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  // Optional slot for "Add Button"
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
    state: { pagination, sorting, globalFilter , rowSelection: {} },
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange: onGlobalFilterChange as any,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    autoResetAll: false,
    
    // 🔑 MODIFICATION 3: Use row.id directly. No more TS error!
    getRowId: (row) => String(row.id), 
    
    getCoreRowModel: getCoreRowModel(),
});

  const showLoadingOverlay = isLoading || isFetching;

  return (
    <div className="w-full">
      <DataTableToolbar
        searchTerm={globalFilter}
        onSearchChange={onGlobalFilterChange}
        pageSize={pagination.pageSize}
        onPageSizeChange={(size) => table.setPageSize(size)}
        isFetching={isFetching}
        actionSlot={actionSlot}
      />

      <div className="shadow-xl rounded-box p-4 bg-base-100">
        <div className="overflow-x-auto relative min-h-[200px]">
          
          {/* Loading Overlay */}
          {showLoadingOverlay && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[1px] rounded-lg">
               <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && data.length === 0 ? (
            <div className="flex justify-center items-center"> No records found.</div>
          ) : (
            <table className="table w-full table-zebra">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => {
                  return (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                      <th key={header.id} className={`cursor-pointer select-none hover:bg-base-200 ${header.id === 'actions' ? 'float-right' : ''}`}
                          onClick={header.column.getToggleSortingHandler()} >
                          <div className="flex items-center space-x-1">
                            <span>
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </span>

                            {/* Sorting Icons logic */}
                            {header.column.getCanSort() && (
                              <div className="flex flex-col text-sm">
                                { header.column.getIsSorted() === 'asc' ? <Icon icon="lucide:chevron-up" className="text-primary" /> : 
                                  header.column.getIsSorted() === 'desc' ? <Icon icon="lucide:chevron-down" className="text-primary" /> :<Icon icon="lucide:chevrons-up-down" className="opacity-30" />
                                }
                              </div>
                            )}
                          </div>
                        </th>
                    )})}
                  </tr>
                )})}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
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