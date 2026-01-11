'use client';
import React from 'react';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MonthlyBillForm, MonthlyBillSchema } from '@/lib/schemas';
import { CustomerService } from '@/types/customerService';
import { toast } from 'react-toastify';

interface BillFormProps {
  currentService: CustomerService | null;
  onCancel: () => void;
  onSuccess: () => void;
  selectedMonth: string;
}

export const FormPage: React.FC<BillFormProps> = ({ currentService, onCancel, onSuccess, selectedMonth }) => {
  
  // 1. Calculate Billing Summary
  const totalPaidSoFar = currentService?.bills?.reduce((sum: number, b: { paidAmount: any; }) => sum + Number(b.paidAmount), 0) || 0;
  const expectedTotal = Number(currentService?.mmc || 0);
  const remainingBalance = expectedTotal - totalPaidSoFar;

  // 1. Ensure useForm is typed with MonthlyBillForm
  const {  register,  handleSubmit,  formState: { errors, isSubmitting } } = useForm<MonthlyBillForm>({
    resolver: zodResolver(MonthlyBillSchema) as Resolver<MonthlyBillForm>,
    defaultValues: {
        customerServiceId: currentService?.id || '',
        monthFor: selectedMonth,
        mmc: expectedTotal,
        paidAmount: remainingBalance > 0 ? remainingBalance : 0,
        paidDate: new Date().toISOString().split('T')[0] as any,
    }
  });

  // 2. Ensure the handler uses the same MonthlyBillForm type
  const handleFormSubmit: SubmitHandler<MonthlyBillForm> = async (data) => {
    // 1. Client-side check should happen BEFORE the fetch
    if (data.paidAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    try {
      const response = await fetch(`/api/bills/monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // 2. Parse the response body to get the error message
      const result = await response.json();

      if (!response.ok) {
        // 3. Throw the message sent from the API (e.g., "Month is already fully paid")
        throw new Error(result.message || 'Payment failed');
      }
      
      toast.success("Payment recorded!");
      onSuccess();
    } catch (error: any) {
      // 4. This will now show "Month is already fully paid" instead of "Payment failed"
      toast.error(error.message);
    }
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* 2. Visual Indicator for the Receiver */}
      <div className="bg-base-200 p-4 rounded-xl border border-base-300">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold opacity-60 uppercase">Billing Summary</span>
          {remainingBalance <= 0 ? (
             <span className="badge badge-success badge-sm">Fully Paid</span>
          ) : totalPaidSoFar > 0 ? (
             <span className="badge badge-warning badge-sm">Partial Payment</span>
          ) : null}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-[10px] opacity-50 uppercase">Total Bill</span>
            <span className="font-bold text-sm">{expectedTotal}</span>
          </div>
          <div className="flex flex-col border-x border-base-300">
            <span className="text-[10px] opacity-50 uppercase">Paid</span>
            <span className="font-bold text-sm text-success">{totalPaidSoFar}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] opacity-50 uppercase">Due</span>
            <span className={`font-bold text-sm ${remainingBalance > 0 ? 'text-error' : ''}`}>
               {remainingBalance}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label-text mb-1 flex justify-between">
            Billing Month  <span className="text-[10px] text-primary font-bold uppercase">(From Dashboard)</span>
          </label>
          <input type="month" {...register('monthFor')} className="input input-bordered bg-base-200 cursor-not-allowed font-bold"  readOnly 
            disabled={isSubmitting || remainingBalance <= 0} />
        </div>
        <div className="form-control">
          <label className="label-text mb-1">Payment Date</label>
          <input type="date" {...register('paidDate')} className="input input-bordered" 
          disabled={isSubmitting || remainingBalance <= 0}/>
        </div>
      </div>

      <div className="form-control">
        <label className={`label-text mb-1 font-bold ${remainingBalance <= 0 ? 'text-base' : 'text-primary'}`}>New Payment Amount</label> &nbsp;
        <input type="number" step="0.01" {...register('paidAmount')} placeholder={`Enter up to ${remainingBalance}`}
          className={`input input-bordered ${remainingBalance <= 0 ? 'border-accent-content' : 'border-primary'}  font-bold text-lg ${errors.paidAmount ? 'input-error' : ''}`} 
          disabled={isSubmitting || remainingBalance <= 0}
        />
        {errors.paidAmount && <span className="text-error text-xs">{errors.paidAmount.message}</span>}
      </div>

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary px-8" disabled={isSubmitting || remainingBalance <= 0}>
          {isSubmitting ? <span className="loading loading-spinner" /> : 'Confirm Payment'}
        </button>
      </div>
    </form>
  );
};