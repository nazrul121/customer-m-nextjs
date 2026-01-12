'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { CreditCard, User, ReceiptText } from 'lucide-react';

// Components
import { DataTable } from '@/app/components/common/DataTable';
import { Modal } from '@/app/components/common/Modal';
import { FormPage } from './form';

// Types
import { CustomerService } from '@/types/customerService';

export default function BillCrud() {
  const queryClient = useQueryClient();

  // --- 1. State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<CustomerService | null>(null);
  
  // We need a specific month filter for billing
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 2. Data Fetching ---
  const { data, isLoading, isFetching } = useQuery({
    // Include selectedMonth in queryKey so data refreshes when month changes
    queryKey: ['monthly-bills', selectedMonth, pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
    queryFn: async () => {
      const sortId = sorting[0]?.id || 'createdAt';
      const sortDir = sorting[0]?.desc ? 'desc' : 'asc';
      
      const params = new URLSearchParams({
        month: selectedMonth,
        page: (pagination.pageIndex + 1).toString(),
        pageSize: pagination.pageSize.toString(),
        search: globalFilter, 
        sortId,
        sortDir
      });

      const response = await fetch(`/api/bills/monthly?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch billing data');
      return await response.json();
    },
  });

  const customerServices = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // --- 3. Action Handlers ---
  const openModal = (service: CustomerService) => {
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentService(null);
  };

  const handlePaymentSuccess = () => {
    // Invalidate the specific key used for this table
    queryClient.invalidateQueries({ queryKey: ['monthly-bills'] }); 
    closeModal();
  };

  // --- 4. Column Definitions ---
  const columnHelper = createColumnHelper<CustomerService>();
  
  const columns = [
    columnHelper.accessor('customer', {
      header: 'Customer',
      cell: (info) => {
        const customer = info.getValue();
        const photo = customer?.photo;

        return (
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center overflow-hidden">
                {photo ? (
                  <img 
                    src={photo} 
                    alt={customer?.name || 'Customer'} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User size={26} />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">{customer?.name}</span>
              <span className="text-[10px] opacity-60 uppercase">
                {customer?.customerCode}
              </span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('service', {
      header: 'Subscription',
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{info.getValue()?.name}</span>
          <span className="text-[10px] text-secondary font-semibold">
            {info.getValue()?.serviceType?.title}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('mmc', {
      header: 'Bill Amount',
      cell: (info) => (
        <div className="font-mono font-bold">
          {Number(info.getValue()).toLocaleString()} <span className="text-[10px]">BDT</span>
          {info.row.original.mmcDis > 0 && (
               <>
                <br />  <span className="text-[9px] text-error line-through">
                    Disc: {info.row.original.mmcDis}
                </span>
                </>
            )}
        </div>
      ),
    }),
    columnHelper.display({
        id: 'status',
        header: 'Payment Status',
        cell: (info) => {
            const row = info.row.original;
            const bills = row.bills || [];

            // 🔑 Calculate the total paid across all transactions for this month
            const totalPaid = bills.reduce((sum: number, bill: { paidAmount: any; }) => sum + Number(bill.paidAmount), 0);
            const expected = Number(row.mmc);

            if (totalPaid === 0) {
                return (<div className="badge badge-error gap-2 font-bold text-[10px]"> UNPAID</div>);
            }
            const isFullyPaid = totalPaid >= expected;
            return (
                <div className={`badge ${isFullyPaid ? 'badge-success' : 'badge-warning'} gap-2 font-bold text-[10px]`}>
                    {isFullyPaid ? 'PAID' : 'PARTIAL'}
                    <span className="opacity-70">({totalPaid.toLocaleString()})</span>
                </div>
            );
        }
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: (props) => (
        <div className="flex justify-end">
          <button 
            className="btn btn-primary btn-xs gap-1 shadow-sm" 
            onClick={() => openModal(props.row.original)}
          >
            <CreditCard size={12} /> Pay Now
          </button>
        </div>
      )
    })
  ];

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 italic">
            <ReceiptText className="text-primary" /> BILLING CENTER
          </h1>
          <p className="text-xs opacity-60">Manage monthly collections and customer outstandings.</p>
        </div>

        {/* Month Selector */}
        <div className="form-control">
          <label className="label py-0"><span className="label-text-alt uppercase font-bold opacity-50">Collection Month</span></label>
          <input type="month"  value={selectedMonth} className="input input-bordered input-sm font-bold" onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
      </div>

        <DataTable 
          data={customerServices} 
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

      <Modal id="bill-modal" isOpen={isModalOpen} onClose={closeModal}  title="Collect Payment">
        {isModalOpen && currentService && (
          <FormPage currentService={currentService} onCancel={closeModal}  onSuccess={handlePaymentSuccess} selectedMonth={selectedMonth} />
        )}
      </Modal> 
    </main>
  );
}