'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTable } from '@/app/components/common/DataTable';
import { formatHumanReadableDate } from '@/lib/utils';
import { Modal } from '@/app/components/common/Modal';
import Link from 'next/link';
import { ArrowLeft, Delete, DeleteIcon, DollarSign, Edit2, PlusCircle, User } from 'lucide-react';
import { CustomerService } from '@/types/customerService';
import { toast } from 'react-toastify';
import { CustomerServiceForm } from '@/lib/schemas';
import { FormPage } from './form';
import { Customer } from '@/types/customer';
import Image from 'next/image';
import { PaySetupBill } from './payNow';

interface ClientProps {
  customer: Customer;
}

export default function CustomerServicesClient({ customer }: ClientProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomerService, setCurrentCustomerService] = useState<CustomerService | null>(null);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // 2. Data Fetching
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customer-services', customer.id, pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        pageSize: pagination.pageSize.toString(),
        search: globalFilter,
        sortId: sorting[0]?.id || '',
        sortDir: sorting[0]?.desc ? 'desc' : 'asc'
      });

      const response = await fetch(`/api/customer/${customer.id}/services?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const customer_services = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // 3. Action Handlers
  const openModal = (service: CustomerService | null = null) => {
    setCurrentCustomerService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomerService(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-services'] }); 
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const response = await fetch(`/api/customer/${customer.id}/services`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Delete failed');

      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ['customer-services'] }); 
      toast.info(data.message);
    } catch (error) {
      console.error(error);
      toast.error("Delete failed. erro:"+error);
    }
  };

  const onSubmit = async (formData: CustomerServiceForm & { id?: string }) => {
    const method = formData.id ? 'PUT' : 'POST';
    const response = await fetch(`/api/customer/${customer.id}/services`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Operation failed');
    }
  };


  //for payment details 
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const openPaymentModal = (service: CustomerService | null = null) => {
    setCurrentCustomerService(service);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setCurrentCustomerService(null);
  };

  const paymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-services'] }); 
    closePaymentModal();
  };


  // 4. Columns
  const columnHelper = createColumnHelper<CustomerService>();
  const columns = [
    // 1. Service Name (Nested relation)
  columnHelper.accessor('service', {
    header: 'Service',
    // Ensure the id matches what we check for in the backend sorting
    id: 'service', 
    cell: (info) => {
      const service = info.getValue(); 
      return (
        <div className="flex flex-col">
          {/* service.name exists in your type */}
          <span className="font-bold text-primary">
            {service?.name || 'Unknown Service'}
          </span>
          
          <span className="text-[10px] opacity-60 uppercase tracking-tighter">
            {/* 🔑 FIX: Changed .name to .title based on your Service type */}
            Type: {service?.serviceType?.title || 'N/A'}
          </span>
        </div>
      );
    },
  }),

    // 2. Financials (Initial Cost & Monthly Charge)
    columnHelper.accessor('initCost', {
      header: 'Subscription fees',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="opacity-60">Setup:</span>
              <span className="font-semibold">{Number(row.initCost).toLocaleString()} BDT</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="opacity-60">MMC:</span>
              <span className="font-semibold text-secondary">{Number(row.mmc).toLocaleString()} BDT</span>
            </div>
          </div>
        );
      },
    }),

    // 3. Subscription Period & Status
    columnHelper.accessor('expiryDate', {
      header: 'Status & Validity',
      cell: (info) => {
        const expiry = new Date(info.getValue());
        const isExpired = expiry < new Date();
        const startDate = formatHumanReadableDate(info.row.original.startDate as any);
        
        return (
          <div className="flex flex-col gap-1">
            <div className={`badge badge-sm font-bold ${isExpired ? 'badge-error' : 'badge-success'} gap-1`}>
              {isExpired ? 'EXPIRED' : 'ACTIVE'}
            </div>
            <span className="text-[12px] opacity-70">
              {startDate} → {formatHumanReadableDate(expiry as any)}
            </span>
          </div>
        );
      },
    }),

    // 4. Auto-Repeat Indicator
    columnHelper.accessor('isRepeat', {
      header: 'Repeat',
      cell: (info) => (
        <div className={`badge badge-outline badge-xs ${info.getValue() === 'YES' ? 'border-primary text-primary' : 'opacity-30'}`}>
          {info.getValue()}
        </div>
      ),
    }),

    // 5. Actions
    columnHelper.display({
      id: 'actions',
      header: () => <div className="float-right">Actions</div>,
      cell: (props) => {
        const row = props.row.original;

        // Calculate total paid for this specific row
        const totalPaid = row.setupBills?.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0) || 0;
        const isFullyPaid = totalPaid >= Number(row.initCost);

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Payment Button: Disabled if fully paid */}
            <div className="tooltip tooltip-left" data-tip={isFullyPaid ? "Payment Complete" : "Pay Setup Fee"}>
              <button onClick={() => openPaymentModal(row)} 
                className={`btn btn-xs btn-ghost text-success opacity-50}`}>
                <DollarSign size={16} />
              </button>
            </div>

            {/* Edit Button */}
            <button onClick={() => openModal(row)} className="btn btn-primary btn-xs tooltip" data-tip="Edit Subscription"> 
              <Edit2 size={16} />
            </button>

            {/* Delete Button */}
            <button onClick={() => handleDelete(row.id)} data-tip="Delete Subscription"
              className="btn btn-ghost btn-xs text-error tooltip tooltip-left">
              <DeleteIcon size={18} />
            </button>
          </div>
        );
      },
    })
  ];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/customers" className="btn btn-ghost btn-circle border border-base-300">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3"> 
              {/* Check if photo exists and isn't an empty string */}
              {customer.photo ? (
                <Image width={200} height={200} src={customer.photo} alt={customer.name} 
                  className="w-10 h-10 rounded-full object-cover border border-base-300" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center border border-base-300 text-base-content/80">
                  <User size={24} />
                </div>
              )}
              {customer.name}
            </h1>
            <p className="text-sm text-base-content/60 italic">Contact No: {Number(customer.phone)}, Code: {customer.customerCode}</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm shadow-sm" onClick={() => openModal()}> 
            <PlusCircle size={18} /> New Subscription 
        </button>
      </div>

      <DataTable data={customer_services} columns={columns} totalCount={totalCount} 
        isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting} 
        onSortingChange={setSorting} globalFilter={globalFilter} onGlobalFilterChange={setGlobalFilter} 
      />

      <Modal id="service-modal" isOpen={isModalOpen} onClose={closeModal} title={currentCustomerService ? 'Edit Subscription for '+currentCustomerService.service?.name : 'New Subscription for '+customer.name}>
        <FormPage currentCustomerService={currentCustomerService} 
            onSubmit={onSubmit} customer={customer} onCancel={closeModal} onSuccess={handleSuccess} 
        />
      </Modal> 

      <Modal id="payment-modal" isOpen={isPaymentModalOpen} onClose={closePaymentModal} title={'Subscription fee'}>
        <PaySetupBill currentCustomerService={currentCustomerService} onCancel={closePaymentModal} onSuccess={paymentSuccess} currentSetupBill={null} />
      </Modal>
    </main>
  );
}