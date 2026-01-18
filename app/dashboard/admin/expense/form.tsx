'use client';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

import { ExpenseForm, ExpenseSchema } from '@/lib/schemas';
import { Expense } from '@/types/expense'; 
import { fetchExpenseHead } from '@/lib/api-client';

interface ExpenseFormProps {
  currentExpanse: Expense | null;
  onCancel: () => void; 
  onSuccess: () => void;
}

export const FormPage: React.FC<ExpenseFormProps> = ({ currentExpanse, onCancel, onSuccess }) => {
  const [expenseHeads, setExpenseHeads] = useState<{ id: string; title: string }[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(false);
  
  // 1. Initialize useForm with the ExpenseForm type
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ExpenseForm>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: { 
      expenseDate: new Date() as any,
      cost: 0, 
      expenseHeadId: '',
      note: '',
    },
  });

  useEffect(() => {
    // Single useEffect for data fetching
    fetchExpenseHead().then(setExpenseHeads).catch(console.error);
  }, []);

  useEffect(() => {
    if (currentExpanse) {
      reset({
        expenseDate: new Date(currentExpanse.expenseDate).toISOString().split('T')[0] as any,
        cost: Number(currentExpanse.cost),
        note: currentExpanse.note || '',
        expenseHeadId: currentExpanse.expenseHeadId,
      });
    } else {
      // 🔑 IMPORTANT: Reset to default values when currentExpanse is null
      reset({
        expenseDate: new Date().toISOString().split('T')[0] as any,
        cost: 0,
        note: '',
        expenseHeadId: '',
      });
    }
  }, [currentExpanse, reset]);

  // 3. Sync form when editing
  useEffect(() => {
    // Single useEffect for form resetting
    if (currentExpanse) {
      reset({
        expenseDate: new Date(currentExpanse.expenseDate).toISOString().split('T')[0] as any,
        cost: Number(currentExpanse.cost),
        note: currentExpanse.note || '',
        expenseHeadId: currentExpanse.expenseHeadId,
      });
    } else {
      reset({
        expenseDate: new Date().toISOString().split('T')[0] as any,
        cost: 0,
        note: '',
        expenseHeadId: '',
      });
    }
  }, [currentExpanse, reset])

  // 4. Submit Handler with correct Typing
  const handleFormSubmit: SubmitHandler<ExpenseForm> = async (data) => {
    try {
      const response = await fetch('/api/expense', {
        method: currentExpanse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentExpanse ? { id: currentExpanse.id, ...data } : data),
      });
      
      if (!response.ok) throw new Error('Error saving data');
      toast.success("The expense has been saved Success!");
      onSuccess();
    } catch (error: any) {
      setError("root", { message: error.message });
    }
  };
  
  const isBusy = isSubmitting || loadingHeads;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 relative p-2"> 
      {isBusy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/50 backdrop-blur-[1px]">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {errors.root && (
        <div className="alert alert-error text-sm py-2">
          <span>{errors.root.message}</span>
        </div>
      )}
      
      {/* ROW 1: Date and Head side by side */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Expense Date */}
        <div className="form-control w-full md:w-1/2">
          <label className="label">
            <span className="label-text font-semibold">Expense Date</span>
          </label>
          <input 
            type="date" 
            className={`input input-bordered w-full ${errors.expenseDate ? 'input-error' : ''}`} 
            {...register('expenseDate')} 
            disabled={isBusy} 
          />
          {errors.expenseDate && <span className="text-error text-xs mt-1">{errors.expenseDate.message}</span>}
        </div>

        {/* Expense Head */}
        <div className="form-control w-full md:w-1/2">
          <label className="label">
            <span className="label-text font-semibold">Expense Head</span>
          </label>
          <select className={`select select-bordered w-full ${errors.expenseHeadId ? 'select-error' : ''}`}
            {...register('expenseHeadId')}  disabled={isBusy}  defaultValue="">
            <option value="" disabled>{loadingHeads ? 'Loading...' : 'Select Head'}</option>
            {expenseHeads.map((head) => (
              <option key={head.id} value={head.id}>{head.title}</option>
            ))}
          </select>
          {errors.expenseHeadId && <span className="text-error text-xs mt-1">{errors.expenseHeadId.message}</span>}
        </div>
      </div>

      {/* ROW 2: Cost */}
      <div className="form-control w-full mb-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="label sm:w-1/5 justify-start">
                <span className="label-text font-medium text-base">Total of Cost</span>
            </label>
            <div className="form-control w-full sm:w-1/1.5">
                <div className="relative">
                    <input type="number" step="0.01" placeholder="0.00"
                        className={`input input-bordered w-full pr-12 ${errors.cost ? 'input-error' : ''}`} 
                        {...register('cost', { valueAsNumber: true })} disabled={isBusy} 
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} // Prevents scrolling to change numbers
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50"> $</div>
                </div>
                {errors.cost && (
                  <span className="text-error text-xs mt-1 px-1">{errors.cost.message}</span>
                )}
            </div>
        </div>
      </div>

      {/* ROW 3: Note */}
      <div className="form-control w-full">
        <label className="label"><span className="label-text font-bold">Short Note</span></label>
        <input 
          type="text" 
          className="input input-bordered w-full" 
          {...register('note')} 
          disabled={isBusy} 
          placeholder="Max 100 chars"
        />
        {errors.note && <span className="text-error text-xs mt-1">{errors.note.message}</span>}
      </div>

      {/* Action Buttons */}
      <div className="modal-action border-t pt-4">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-secondary px-8" disabled={isBusy}>
          {currentExpanse ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
};