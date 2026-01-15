'use client'
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
// Logic/Types

import { CustomerForm } from '@/lib/schemas';
import { formatHumanReadableDate } from '@/lib/utils'; 

import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { DataTable } from '@/app/components/common/DataTable';
import { Modal } from '@/app/components/common/Modal';
import { FormPage } from './form';
import { Customer } from '@/types/customer';
import { Edit2, FileText, Plug2, PlusCircle, Trash, Trash2, Trash2Icon, User } from 'lucide-react';
import Link from 'next/link';


export default function CustomerCrud() {

  const queryClient = useQueryClient();
  // --- 1. State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

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

      const response = await fetch(`/api/customer?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch paginated Customers');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const customers = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // --- 3. Action Handlers ---
  const openModal = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
  };

  const handleCustomerSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] }); 
    closeModal();
  };


  const handleDeleteType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      await fetch('/api/customer', {
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

  const onSubmit = async (data: CustomerForm & { id?: number }) => {
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
  const columnHelper = createColumnHelper<Customer>();
  const columns = [
    columnHelper.accessor('photo', {
        header: 'Photo',
        cell: (info) => {
        const photoUrl = info.getValue();
        return (
          <div className="avatar">
            <div className="mask mask-squircle w-10 h-10 bg-base-300">
                {photoUrl ? (
                <img src={photoUrl}  alt="Customer" 
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User&background=random';
                    }}
                />
                ) : (
                <div className="flex items-center justify-center w-full h-full opacity-30">
                    <User size={20} />
                </div>
                )}
            </div>
          </div>
        );
        },
    }),
    columnHelper.accessor('name', {
      header: 'Customer Name',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone No',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('createdAt', {
      header: 'Created At',
      cell: (info) => formatHumanReadableDate(info.getValue() as unknown as string),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <div className="text-right w-full">Actions</div>
      ),
      cell: (props) => {
        const customer = props.row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            {customer.aggrePaper ? (
              <Link href={customer.aggrePaper} target="_blank" rel="noopener noreferrer"  data-tip="View Agreement"
                className="btn btn-ghost btn-sm text-success tooltip"
              > <FileText size={18} />
              </Link>
            ) : (
              <div className="btn btn-sm btn-disabled btn-ghost opacity-40 tooltip" data-tip="No Paper">
                <FileText size={18} />
              </div>
            )}

            {/* Services with badge */}
            <Link href={`/dashboard/admin/customers/${customer.id}/services`} className="tooltip btn btn-dash btn-sm relative" data-tip="View Services" >
              <Plug2 size={18} className="text-warning" />

              {customer.servicesCount > 0 && (
                <span className="absolute -top-1 -left-1 badge rounded-2xl badge-xs badge-warning">
                  {customer.servicesCount}
                </span>
              )}
            </Link>

            <button data-tip="Edit Customer" type="button" onClick={() => openModal(customer)} className="tooltip text-info btn btn-dash btn-sm" >
              <Edit2 size={18} />
            </button>

            <button data-tip="Delete Customer" type="button" onClick={() => handleDeleteType(customer.id)}
              className="tooltip btn btn-error btn-sm">
              <Trash2 size={18} />
            </button>
          </div>
        );
      },
    })

  ];


  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-base-900">Our <span className='text-base-600'>Valued</span> Customers</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => openModal()}> 
          <Icon icon="ic:baseline-add-comment" width="20" height="20" /> Add New Customer 
        </button>
      </div>

      <DataTable data={customers} columns={columns} totalCount={totalCount} isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting}  onSortingChange={setSorting}globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter} actionSlot={ "" }
      />

      <Modal id="type-modal" isOpen={isModalOpen} onClose={closeModal} title={currentCustomer? 'Edit Customer' : 'Add Customer'}>
        <FormPage currentCustomer={currentCustomer} onSubmit={onSubmit}  onCancel={closeModal}  onSuccess={handleCustomerSuccess} />
      </Modal> 

    </main>
  );
}