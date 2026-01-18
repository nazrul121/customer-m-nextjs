'use client'
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
// Logic/Types

import { ExpenseHeadForm } from '@/lib/schemas';
import { formatHumanReadableDate } from '@/lib/utils'; 

import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { DataTable } from '@/app/components/common/DataTable';
import { Modal } from '@/app/components/common/Modal';
import { ExpenseHead } from '@/types/expenseHead';
import { FormPage } from './Form';
import { Delete, DeleteIcon, Edit3 } from 'lucide-react';


export default function ExpenseHeadCrud() {

  const queryClient = useQueryClient();
  // --- 1. State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpenseHead, setcurrentExpenseHead] = useState<ExpenseHead | null>(null);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 2. Data Fetching (Uses unique queryKey based on all states) ---
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['expenseHeads', pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
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

      const response = await fetch(`/api/expense/head?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch paginated service-type');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const expenseHeads = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  // --- 3. Action Handlers ---
  const openModal = (expenseHead: ExpenseHead | null = null) => {
    setcurrentExpenseHead(expenseHead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setcurrentExpenseHead(null);
  };

  const handleExpenseHeadssuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenseHeads'] }); 
    closeModal();
  };


  const handleDeleteType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      await fetch('/api/expense/head', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      // 🔑 Invalidate cache to force table refresh after delete
      queryClient.invalidateQueries({ queryKey: ['expenseHeads'] }); 
      toast.error("Data deleted successfully!");
    } catch (error) {
      console.error(error);
      alert('Delete failed');
    }
  };

  const onSubmit = async (data: ExpenseHeadForm & { id?: number }) => {
    const method = data.id ? 'PUT' : 'POST';
    try {
      const response = await fetch('/api/expense/head', {
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
  const columnHelper = createColumnHelper<ExpenseHead>();
  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => info.getValue(),
    }),
    
    columnHelper.accessor((row) => row._count?.expenses, {
      id: 'expensesCount',
      enableSorting:false,
      header: () => (
        <span className="text-secondary font-bold tracking-wider">Usage</span>
      ),
      cell: (info) => {
        const count = info.getValue() || 0;
        return (
          <div className="badge badge-ghost font-mono">
            {count} {count === 1 ? 'Expense' : 'Expenses'}
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
      header: 'Actions',
      cell: (props) => (
        <div className="text-right space-x-2">
          <button type="button" onClick={() => openModal(props.row.original)} className="btn btn-info btn-sm tooltip tooltip-left" data-tip="Edit Expense head">
            <Edit3 size={16} />
          </button>
          {/* 🔑 Added type="button" to prevent implicit form submission/page reload */}
          <button type="button" onClick={() => handleDeleteType(props.row.original.id)} className="btn btn-error btn-sm tooltip tooltip-left" data-tip="Delete Expense head">
            <DeleteIcon size={16} />
          </button>
        </div>
      ),
    }),
  ];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expense head</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => openModal()}> 
          <Icon icon="ic:baseline-add-comment" width="20" height="20" /> Add New Head 
        </button>
      </div>

      <DataTable data={expenseHeads} columns={columns} totalCount={totalCount} isLoading={isLoading} isFetching={isFetching} pagination={pagination}
        onPaginationChange={setPagination} sorting={sorting}  onSortingChange={setSorting}globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter} actionSlot={ "" }
      />

      <Modal id="head-modal" isOpen={isModalOpen} onClose={closeModal} title={currentExpenseHead ? 'Edit Expense Head' : 'Add Expense Head'}>
        <FormPage currentExpenseHead={currentExpenseHead} onSubmit={onSubmit}  onCancel={closeModal}  onSuccess={handleExpenseHeadssuccess} />
      </Modal>

    </main>
  );
}