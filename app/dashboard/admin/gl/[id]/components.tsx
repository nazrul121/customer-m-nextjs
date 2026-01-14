'use client'
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
import { formatHumanReadableDate } from '@/lib/utils'; 
import { DataTable } from '@/app/components/common/DataTable';
import { GL } from '@/types/GL';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  customerServiceId: string;
}

export default function GLDetailContent({ customerServiceId }: Props) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'voucherDate', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    // 🔑 Pass customerServiceId into the queryKey so it refetches correctly
    queryKey: ['gl-details', customerServiceId, pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        pageSize: pagination.pageSize.toString(),
        search: globalFilter, 
        customerServiceId: customerServiceId, // 🔑 Filter by ID in backend
        sortId: sorting[0]?.id || 'voucherDate',
        sortDir: sorting[0]?.desc ? 'desc' : 'asc'
      });

      const response = await fetch(`/api/gl/detail?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch ledger details');
      return await response.json();
    },
  });

  const generalLedgers = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // 🔑 Extract Customer/Service info from the first record to use in the Header
  const firstRecord = generalLedgers[0]?.customerService;
  const customerName = firstRecord?.customer?.name || "Loading...";
  const serviceName = firstRecord?.service?.name || "";

  const columnHelper = createColumnHelper<GL>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('voucherNo', {
      header: 'Voucher No',
      cell: (info) => <span className="font-mono text-xs font-bold text-primary">{info.getValue()}</span>,
    }),
    columnHelper.accessor('voucherDate', {
      header: 'Date',
      cell: (info) => formatHumanReadableDate(info.getValue()),
    }),
    columnHelper.accessor('purpose', {
      header: 'Purpose',
      cell: (info) => (
        <div className="badge badge-ghost badge-sm font-medium uppercase text-[10px]">
          {info.getValue().replace(/([A-Z])/g, ' $1').trim()}
        </div>
      ),
    }),
    columnHelper.accessor('debitAmount', {
      header: 'Debit (Charge)',
      cell: (info) => {
        const val = Number(info.getValue());
        return <span className="font-semibold text-error">{val > 0 ? `${val.toLocaleString()} BDT` : '-'}</span>;
      },
    }),
    columnHelper.accessor('creditAmount', {
      header: 'Credit (Paid)',
      cell: (info) => {
        const val = Number(info.getValue());
        return <span className="font-semibold text-success">{val > 0 ? `${val.toLocaleString()} BDT` : '-'}</span>;
      },
    }),
    columnHelper.accessor('receivedBy', {
        header: 'Collector',
        cell: (info) => <span className="text-xs opacity-70">{info.getValue() || "System"}</span>,
    }),
  ], [columnHelper]);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/dashboard/admin/gl" className="btn btn-ghost btn-sm gap-2 mb-2">
          <ArrowLeft size={16} /> Back to Ledger
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight italic uppercase">
                {customerName}
            </h1>
            <p className="text-sm font-bold opacity-60 uppercase">
                Statement of Account: <span className="text-primary">{serviceName}</span>
            </p>
          </div>
          
          {/* Quick Balance Summary for this customer */}
          <div className="stats shadow bg-base-200">
             <div className="stat py-2 px-4">
                <div className="stat-title text-[10px] uppercase font-bold">Current Status</div>
                <div className="stat-value text-lg">Detailed View</div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 overflow-hidden">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-error/10 p-4 rounded-lg">
            <p className="text-xs uppercase opacity-60">Total Charges</p>
            <p className="text-xl font-bold">{data?.meta?.summary?.totalDebit} BDT</p>
          </div>
          <div className="bg-success/10 p-4 rounded-lg">
            <p className="text-xs uppercase opacity-60">Total Paid</p>
            <p className="text-xl font-bold">{data?.meta?.summary?.totalCredit} BDT</p>
          </div>
          <div className="bg-base-200 p-4 rounded-lg">
            <p className="text-xs uppercase opacity-60">Closing Balance</p>
            <p className="text-xl font-bold">{data?.meta?.summary?.totalBalance} BDT</p>
          </div>
        </div>
        
        <DataTable 
            data={generalLedgers} 
            columns={columns} 
            totalCount={totalCount} 
            isLoading={isLoading} 
            isFetching={isFetching} 
            pagination={pagination}
            onPaginationChange={setPagination} 
            sorting={sorting}  
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter} 
        />
      </div>
    </main>
  );
}