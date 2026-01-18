'use client';
import React, { useState } from 'react'; // Added useState
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MonthlyBillForm, MonthlyBillSchema } from '@/lib/schemas';
import { CustomerService } from '@/types/customerService';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation'; // Added useRouter
import { Printer } from 'lucide-react'; // For a better icon

interface BillFormProps {
  currentService: CustomerService | null;
  onCancel: () => void;
  onSuccess: () => void;
  selectedMonth: string;
}

export const FormPage: React.FC<BillFormProps> = ({ currentService, onCancel, onSuccess, selectedMonth }) => {
  const router = useRouter(); // Initialize router
  const [shouldPrint, setShouldPrint] = useState(true); // Default to print checked

  // 1. Calculate Billing Summary
  const totalPaidSoFar = currentService?.bills?.reduce((sum: number, b: { paidAmount: any; }) => sum + Number(b.paidAmount), 0) || 0;
  const expectedTotal = Number(currentService?.mmc || 0);
  const remainingBalance = expectedTotal - totalPaidSoFar;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MonthlyBillForm>({
    resolver: zodResolver(MonthlyBillSchema) as Resolver<MonthlyBillForm>,
    defaultValues: {
      customerServiceId: currentService?.id || '',
      monthFor: selectedMonth,
      mmc: expectedTotal,
      paidAmount: remainingBalance > 0 ? remainingBalance : 0,
      paidDate: new Date().toISOString().split('T')[0] as any,
    }
  });

  const handleFormSubmit: SubmitHandler<MonthlyBillForm> = async (data) => {
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Payment failed');
      }
      
      toast.success(result.message);
      
      // 1. Trigger the Success callback (refreshes data)
      onSuccess();

      // 2. Redirect to print if checkbox is checked
      if (shouldPrint && result.data?.id) {
        // We use the ID returned from the server for the newly created bill
        router.push(`/dashboard/admin/bills/print?serviceId=${currentService?.id}&monthlyBillId=${result.data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Billing Summary Section */}
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
            Billing Month <span className="text-[10px] text-primary font-bold uppercase">(Auto)</span>
          </label>
          <input type="month" {...register('monthFor')} className="input input-bordered bg-base-200 cursor-not-allowed font-bold" readOnly disabled={isSubmitting || remainingBalance <= 0} />
        </div>
        <div className="form-control">
          <label className="label-text mb-1">Payment Date</label>
          <input type="date" {...register('paidDate')} className="input input-bordered font-bold" disabled={isSubmitting || remainingBalance <= 0}/>
        </div>
      </div>

      <div className="form-control">
        <label className={`label-text mb-1 font-bold ${remainingBalance <= 0 ? 'text-base' : 'text-primary'}`}>New Payment Amount &nbsp; </label>
        <input type="number" step="0.01" {...register('paidAmount')} placeholder={`Enter up to ${remainingBalance}`}
          className={`input input-bordered ${remainingBalance <= 0 ? 'border-accent-content' : 'border-primary'} font-bold text-lg ${errors.paidAmount ? 'input-error' : ''}`} 
          disabled={isSubmitting || remainingBalance <= 0}
        />
        {errors.paidAmount && <span className="text-error text-xs mt-1">{errors.paidAmount.message}</span>}
      </div>

      {/* Matching Design for Checkbox */}
      <div onClick={() => setShouldPrint(!shouldPrint)}
          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${shouldPrint ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${shouldPrint ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Printer size={18} />
              </div>
              <div>
                  <p className="font-black text-xs uppercase tracking-tight">Print Digital Receipt</p>
                  <p className="text-[10px] text-slate-500 font-medium">Auto-redirect to print dashboard after save</p>
              </div>
          </div>
          <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={shouldPrint} onChange={() => {}}  disabled={remainingBalance <= 0} />
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