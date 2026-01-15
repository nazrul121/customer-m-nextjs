'use client'
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
// Logic/Types

import { UserForm } from '@/lib/schemas';
import { formatHumanReadableDate } from '@/lib/utils'; 

import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { DataTable } from '@/app/components/common/DataTable';
import { Modal } from '@/app/components/common/Modal';
import { FormPage } from './form';
import { User } from '@/types/user';
import { DeleteIcon, Edit, Edit2Icon } from 'lucide-react';

export default function UserCrudPage() {

  const queryClient = useQueryClient();
  // --- 1. State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 2. Data Fetching (Uses unique queryKey based on all states) ---
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
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

      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch paginated users');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const users = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // --- 3. Action Handlers ---
  const openModal = (user: User | null = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleUserSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] }); 
    closeModal();
  };


  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      // 🔑 Invalidate cache to force table refresh after delete
      queryClient.invalidateQueries({ queryKey: ['users'] }); 
      toast.error("Data deleted successfully!");
    } catch (error) {
      console.error(error);
      alert('Delete failed');
    }
  };

  const onSubmit = async (data: UserForm & { id?: number }) => {
    const method = data.id ? 'PUT' : 'POST';
    try {
      const response = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // 🔑 Ensure a structured error is thrown for UserModal to catch and display
        const errorData = await response.json();
        throw new Error(JSON.stringify({ 
            status: response.status, 
            message: errorData.message || 'Server error occurred.' 
        }));
      }

    } catch (error) {
      console.error(error);
      throw error; // Re-throw for UserModal to catch and display validation errors
    }
  };

  // --- 4. Column Definitions ---
  const columnHelper = createColumnHelper<User>();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name', cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('role', {
      header: 'Role',cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('phoneNumber', {
      header: 'Cell No', cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue()?.toUpperCase();
        const isActive = status === 'ACTIVE';

        return (
          <div className="flex justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isActive
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-error/10 text-error border-error/20'
              }`}
            >
              {status || 'UNKNOWN'}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created At',
      cell: (info) => formatHumanReadableDate(info.getValue() as unknown as string),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right pr-4">Actions</div>,
      cell: (props) => (
       <div className="flex justify-end items-center gap-2 pr-2">
      {/* Edit Button */}
      <div className="tooltip tooltip-top font-bold" data-tip="Edit User">
        <button
          type="button"
          onClick={() => openModal(props.row.original)}
          className="btn btn-ghost btn-sm btn-square text-info hover:bg-info/10 hover:scale-110 active:scale-95 transition-all duration-200"
        >
          <Edit size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Delete Button */}
      <div className="tooltip tooltip-left font-bold" data-tip="Delete User">
        <button type="button" onClick={() => handleDeleteUser(String(props.row.original.id))}
          className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 hover:scale-110 active:scale-95 transition-all duration-200">
          <DeleteIcon size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
      ),
    }),
  ];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => openModal()}> 
          <Icon icon="ic:baseline-add-comment" width="20" height="20" /> Add New User 
        </button>
      </div>

      <DataTable data={users} columns={columns} totalCount={totalCount} isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting}  onSortingChange={setSorting}globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter} actionSlot={ "" }
      />

      <Modal id="user-modal" isOpen={isModalOpen} onClose={closeModal} title={currentUser ? 'Edit User' : 'Add New User'}>
        <FormPage currentUser={currentUser} onSubmit={onSubmit}  onCancel={closeModal}  onSuccess={handleUserSuccess} />
      </Modal> 

    </main>
  );
}