'use client'
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
// Logic/Types
import { formatHumanReadableDate } from '@/lib/utils'; 
import { DataTable } from '@/app/components/common/DataTable';
import { GLSummary } from '@/types/GL';
import { Eye } from 'lucide-react';
import Link from 'next/link';


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
  const columnHelper = createColumnHelper<GLSummary>();

  const columns = [
    columnHelper.accessor('customerName', {
      header: 'Customer',
      cell: (info) => {
        // row.original gives us access to all fields in GLSummary, including phone
        const phone = info.row.original.customerPhone;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm leading-tight">
              {info.getValue()}
            </span>
            <span className="text-[11px] opacity-60 font-mono">
              Cell: {phone || "No Phone"}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('serviceName', {
      header: 'Service',
      cell: (info) => <span>{info.getValue()} </span>
    }),

    columnHelper.accessor('totalBilled', {
      header: 'Total Billed',
      cell: (info) => <span>{info.getValue().toLocaleString()} BDT</span>
    }),

    columnHelper.accessor('totalPaid', {
      header: 'Total Paid',
      cell: (info) => <span>{info.getValue().toLocaleString()} BDT</span>
    }),

    columnHelper.accessor('balance', {
      header: 'Balance',
      cell: (info) => {
        return (
          <span className={info.getValue() > 0 ? "text-error font-bold" : "text-success"}>
            {info.getValue().toLocaleString()}
          </span>
        )
      }
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        // console.log(info.row.original.customerServiceId);
        return (
          <Link href={`/dashboard/admin/gl/${info.row.original.id}`} className="btn btn-xs btn-outline btn-info">
            View Vouchers ({info.row.original.ledgerCount})
          </Link>
        )
      }
    })
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