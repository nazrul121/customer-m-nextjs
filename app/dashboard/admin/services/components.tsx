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
import { Modal } from '@/app/components/common/Modal';
import { FormPage } from './form';
import { Service } from '@/types/service';


export default function ServiceCrud() {

  const queryClient = useQueryClient();
  // --- 1. State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 2. Data Fetching (Uses unique queryKey based on all states) ---
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['services', pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
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

      const response = await fetch(`/api/service?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch paginated service');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const services = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // --- 3. Action Handlers ---
  const openModal = (service: Service | null = null) => {
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentService(null);
  };

  const handleServiceSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] }); 
    closeModal();
  };


  const handleDeleteType = async (id: string) => {

    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      await fetch('/api/service', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      // 🔑 Invalidate cache to force table refresh after delete
      queryClient.invalidateQueries({ queryKey: ['services'] }); 
      toast.error("Data deleted successfully!");
    } catch (error) {
      console.error(error);
      alert('Delete failed');
    }
  };

  const onSubmit = async (data: ServiceForm & { id?: number }) => {
    const method = data.id ? 'PUT' : 'POST';
    try {
      const response = await fetch('/api/service', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ 
            status: response.status, 
            message: errorData.message || 'Server error occurred.' 
        }));
      }

    } catch (error) {
      console.error(error);
      throw error; 
    }
  };

  // --- 4. Column Definitions ---
  const columnHelper = createColumnHelper<Service>();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Service Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => row.serviceType?.title, {
        id: 'serviceTypeTitle', // Unique ID for this column
        header: 'Service Type',
        cell: (info) => info.getValue() || <span className="opacity-50 text-xs">Uncategorized</span>,
    }),
    columnHelper.accessor('initCost', {
      header: 'Initional Cost',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('mmc', {
      header: 'Monthly',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('createdAt', {
      header: 'Created At',
      cell: (info) => formatHumanReadableDate(info.getValue() as unknown as string),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (props) => (
        <div className="text-right space-x-2">
          <button type="button" onClick={() => openModal(props.row.original)} className="btn btn-ghost btn-sm text-info">Edit</button>
          {/* 🔑 Added type="button" to prevent implicit form submission/page reload */}
          <button type="button" onClick={() => handleDeleteType(props.row.original.id)} className="btn btn-ghost btn-sm text-error">Delete</button>
        </div>
      ),
    }),
  ];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Our Service</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => openModal()}> 
          <Icon icon="ic:baseline-add-comment" width="20" height="20" /> Add New Service 
        </button>
      </div>

      <DataTable data={services} columns={columns} totalCount={totalCount} isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting}  onSortingChange={setSorting}globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter} actionSlot={ "" }
      />

      <Modal id="type-modal" isOpen={isModalOpen} onClose={closeModal} title={currentService? 'Edit Service' : 'Add Service'}>
        <FormPage currentService={currentService} onSubmit={onSubmit}  onCancel={closeModal}  onSuccess={handleServiceSuccess} />
      </Modal> 

    </main>
  );
}