'use client'
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
// Logic/Types

import { ServiceForm } from '@/lib/schemas';
import { formatHumanReadableDate } from '@/lib/utils'; 

import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { DataTable } from '@/app/components/common/DataTable';
import { GL } from '@/types/GL';


export default function GLCrud() {

  const queryClient = useQueryClient();

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 2. Data Fetching (Uses unique queryKey based on all states) ---
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['gls', pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
    queryFn: async () => {
      const pageParam = pagination.pageIndex + 1;
      const sortId = sorting.length > 0 ? sorting[0].id : '';
      const sortDire = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : '';
      
      const params = new URLSearchParams({
        page: pageParam.toString(),
        pageSize: pagination.pageSize.toString(),
        // Note: The route should handle .trim().toLowerCase() on this search term
        search: globalFilter, 
        ...(sortId && { sortId, sortDir: sortDire })
      });

      const response = await fetch(`/api/gl?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch paginated gls');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const generalLedgers = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;



  // --- 4. Column Definitions ---
  const columnHelper = createColumnHelper<GL>();

  const columns = [
    columnHelper.accessor('voucherNo', {
      header: 'Voucher No',
      cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
    }),

    columnHelper.accessor('paidDate', {
      header: 'Date',
      cell: (info) => formatHumanReadableDate(info.getValue()),
    }),

    // 1. Customer Column
    columnHelper.display({
      id: 'customer',
      header: 'Customer',
      cell: (info) => {
        const customer = info.row.original.customerService?.customer;
        return (
          <div className="flex flex-col">
            <span className="font-bold">{customer?.name || "N/A"}</span>
            <span className="text-xs opacity-60">{customer?.phone}</span>
          </div>
        );
      },
    }),


    // 2. Service & Type Column
    columnHelper.display({
      id: 'service',
      header: 'Service Detail',
      cell: (info) => {
        const cs = info.row.original.customerService;
        const serviceName = cs?.service?.name;
        const typeName = cs?.service?.serviceType?.name;
        
        return (
          <div className="flex flex-col">
            <span>{serviceName || "N/A"}</span>
            {typeName && (
              <span className="badge badge-ghost badge-xs text-[10px]">
                {typeName}
              </span>
            )}
          </div>
        );
      },
    }),

    columnHelper.accessor('paidAmount', {
      header: 'Amount',
      cell: (info) => (
        <span className="font-semibold text-success">
          {info.getValue()?.toLocaleString()} BDT
        </span>
      ),
    }),

    
    columnHelper.accessor('purpose', {
      header: 'Purpose',
      cell: (info) => (
        <div className="badge badge-outline badge-sm">
          {info.getValue()}
        </div>
      ),
    }),
  ];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">General Ledger</h1>
      </div>

      <DataTable data={generalLedgers} columns={columns} totalCount={totalCount} isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting}  onSortingChange={setSorting}globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter} actionSlot={ "" }
      />

    </main>
  );
}