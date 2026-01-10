'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTable } from '@/app/components/common/DataTable';
import { formatHumanReadableDate } from '@/lib/utils';
import { Modal } from '@/app/components/common/Modal';
import Link from 'next/link';
import { ArrowLeft, FileText, Plug2, PlusCircle, User } from 'lucide-react';
import { CustomerService } from '@/types/customerService';
import { toast } from 'react-toastify/unstyled';
import { CustomerServiceForm } from '@/lib/schemas';
import { Icon } from '@iconify/react';
import { FormPage } from './form';
import { Customer } from '@/types/customer';
import Image from 'next/image';

interface ClientProps {
  customer: Customer; // Receive the full object
}

export default function CustomerServicesClient({ customer }: ClientProps) {
  
  const queryClient = useQueryClient();
  // --- 1. State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomerService, setCurrentCustomerService] = useState<CustomerService | null>(null);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 2. Data Fetching (Uses unique queryKey based on all states) ---
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customers', pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
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

      const response = await fetch(`/api/customer/${customer.id}/services?page=${pagination.pageIndex + 1}`);
      if (!response.ok) throw new Error('Failed to fetch paginated Customers');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const customer_services = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // --- 3. Action Handlers ---
  const openModal = (customerService: CustomerService | null = null) => {
    setCurrentCustomerService(customerService);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomerService(null);
  };

  const handleCustomerSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] }); 
    closeModal();
  };


  const handleDeleteType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      await fetch('/api/customer/'+customer.id+'/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      // 🔑 Invalidate cache to force table refresh after delete
      queryClient.invalidateQueries({ queryKey: ['customers'] }); 
      toast.error("Data deleted successfully!");
    } catch (error) {
      console.error(error);
      alert('Delete failed');
    }
  };

  const onSubmit = async (data: CustomerServiceForm & { id?: number }) => {
    const method = data.id ? 'PUT' : 'POST';
    try {
      const response = await fetch('/api/customer', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // 🔑 Ensure a structured error is thrown for UserModal to catch and display
        const errorData = await response.json();
        throw new Error(JSON.stringify({ 
            status: response.status, 
            message: errorData.message || 'Customer error occurred.' 
        }));
      }

    } catch (error) {
      console.error(error);
      throw error; // Re-throw for UserModal to catch and display validation errors
    }
  };

  // --- 4. Column Definitions ---
  const columnHelper = createColumnHelper<CustomerService>();
  const columns = [
    // columnHelper.accessor('photo', {
    //     header: 'Photo',
    //     cell: (info) => {
    //     const photoUrl = info.getValue();
    //     return (
    //       <div className="avatar">
    //         <div className="mask mask-squircle w-10 h-10 bg-base-300">
    //             {photoUrl ? (
    //             <img src={photoUrl}  alt="Customer" 
    //                 onError={(e) => {
    //                     (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User&background=random';
    //                 }}
    //             />
    //             ) : (
    //             <div className="flex items-center justify-center w-full h-full opacity-30">
    //                 <User size={20} />
    //             </div>
    //             )}
    //         </div>
    //       </div>
    //     );
    //     },
    // }),
    // columnHelper.accessor('name', {
    //   header: 'Customer Name',
    //   cell: (info) => info.getValue(),
    // }),

    columnHelper.accessor('createdAt', {
      header: 'Created At',
      cell: (info) => formatHumanReadableDate(info.getValue() as unknown as string),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>, // Align the header text too
      cell: (props) => {
        const customer = props.row.original;
        return (
          <div className="flex items-center justify-end gap-2">
           
          </div>
        );
      },
    })
  ];


  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {/* ⬅️ Back Button */}
          <Link  href="/dashboard/admin/customers" className="btn btn-ghost btn-circle shadow-sm border border-base-300 hover:bg-base-200" >
            <ArrowLeft size={20} />
          </Link>
          
          <div>
         
            <h1 className="text-2xl font-bold flex items-center gap-2"> 
              <Image width={300} height={300} src={customer.photo ? customer.photo : '/images/profile.png'} alt={customer.name} className="w-10 h-10 object-cover" />
              Service History</h1>
            <p className="text-sm text-gray-500 font-medium">
              {customer.name} <span className="mx-1">•</span> {String(customer.phone)}
            </p>
          </div>
        </div>

        {/* Optional: Add a "Quick Action" button here if needed */}
        <div className="badge p-4 font-mono">
          ID: {customer.id} <br />
          PatientCode: {customer.customerCode}
        </div>
        <button className="btn btn-secondary btn-sm"> <PlusCircle size={20} /> Add New</button>
      </div>

      <DataTable data={customer_services} columns={columns} totalCount={totalCount} isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting}  onSortingChange={setSorting}globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter} actionSlot={ "" }
      />

      {/* <Modal id="type-modal" isOpen={isModalOpen} onClose={closeModal} title={currentCustomerService? 'Edit Customer' : 'Add Customer'}>
        <FormPage currentCustomerService={currentCustomerService} onSubmit={onSubmit}  onCancel={closeModal}  onSuccess={handleCustomerSuccess} />
      </Modal>  */}

    </main>
  );
}