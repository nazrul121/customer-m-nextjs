'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { createColumnHelper, SortingState, PaginationState } from '@tanstack/react-table';
import { formatHumanReadableDate, formatMonthName } from '@/lib/utils'; 
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { DataTable } from '@/app/components/common/DataTable';
import { Modal } from '@/app/components/common/Modal';
import { FormPage } from './form';
import { Expense } from '@/types/expense';
import { Delete, Edit } from 'lucide-react';

export default function ExpenseCrud() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);

  // Default to current year-month (e.g., "2024-05")
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  // --- 1. Data Fetching ---
  const { data, isLoading, isFetching } = useQuery({
    // 🔑 REMARK: Included selectedMonth in queryKey so changing month triggers a refetch
    queryKey: ['expenses', pagination.pageIndex, pagination.pageSize, globalFilter, sorting, selectedMonth], 
    queryFn: async () => {
      const pageParam = pagination.pageIndex + 1;
      const sortId = sorting.length > 0 ? sorting[0].id : '';
      const sortDire = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : '';
      
      const params = new URLSearchParams({
        page: pageParam.toString(),
        pageSize: pagination.pageSize.toString(),
        search: globalFilter, 
        month: selectedMonth, 
        ...(sortId && { sortId, sortDir: sortDire })
      });

      const response = await fetch(`/api/expense?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      return await response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const expenses = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;
  const summary = data?.summary || [];

  // 🔑 REMARK: Ensure we sum the summary data provided by the API (backend-calculated)
  const totalMonthlyCost = summary.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);

  // --- 2. Action Handlers ---
  const openModal = (expense: Expense | null = null) => {
    setCurrentExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentExpense(null);
  };

  const handleServiceSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] }); 
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      const res = await fetch('/api/expense', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if(!res.ok) throw new Error("Delete failed");
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] }); 
      toast.success("Deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  };

  // --- 3. Column Definitions ---
  const columnHelper = createColumnHelper<Expense>();
  const columns = [
    columnHelper.accessor('expenseDate', {
      header: 'Expense Date',
      cell: (info) => formatHumanReadableDate(info.getValue()),
    }),
    columnHelper.accessor((row) => row.expenseHead?.title, {
        id: 'expenseHeadId',
        header: 'Expense Head',
        cell: (info) => info.getValue() || <span className="opacity-50 text-xs">Uncategorized</span>,
    }),
    columnHelper.accessor('cost', {
      header: 'Cost',
      cell: (info) => <span className="font-semibold">৳{Number(info.getValue()).toLocaleString()}</span>,
    }),
    columnHelper.accessor((row) => row.expenseBy?.name, {
      id: 'expenseBy',
      header: 'Spent By',
      cell: (info) => info.getValue() || <span className="opacity-50 italic">System</span>,
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
          <button onClick={() => openModal(props.row.original)} className="btn btn-ghost bg-info/10 text-info btn-xs">
            <Edit size={14} />
          </button>
          <button onClick={() => handleDelete(props.row.original.id)} className="btn btn-ghost bg-error/10 text-error btn-xs">
            <Delete size={14} />
          </button>
        </div>
      ),
    }),
  ];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Expense Management</h1>
        
        <div className="flex items-center gap-3">
          {/*  Month input with correct state update and pagination reset */}
          <input type="month" value={selectedMonth} className="input input-bordered input-sm"
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPagination(prev => ({ ...prev, pageIndex: 0 })); 
            }}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => openModal()}> 
            <Icon icon="ic:baseline-add-comment" width="20" height="20" /> Add New
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {totalMonthlyCost>0 && (
          <div className="stats shadow border bg-primary text-primary-content">
            <div className="stat">
              <div className="stat-title text-primary-content/70">
                Total ({formatMonthName(selectedMonth)})
              </div>
              <div className="stat-value text-2xl">৳{totalMonthlyCost.toLocaleString()}</div>
            </div>
          </div>
        )}
        
        {summary.map((item: any, idx: number) => (
          <div key={idx} className="stats shadow border">
            <div className="stat">
              <div className="stat-title truncate text-xs">{item.title}</div>
              <div className="stat-value text-lg">৳{Number(item.total).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <DataTable 
        data={expenses} 
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

      <Modal id="expense-modal" isOpen={isModalOpen} onClose={closeModal} title={currentExpense ? 'Edit Expense' : 'Add Expense'}>
        <FormPage 
          currentExpanse={currentExpense} 
          onCancel={closeModal} 
          onSuccess={handleServiceSuccess} 
        />
      </Modal> 
    </main>
  );
}