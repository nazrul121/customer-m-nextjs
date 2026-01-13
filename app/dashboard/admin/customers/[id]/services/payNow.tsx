import { useSession } from "@/lib/auth-client";
import { SetupBillForm, SetupBillSchema } from "@/lib/schemas";
import { CustomerService } from "@/types/customerService";
import { SetUpBill } from "@/types/setupBill";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

interface PayNowProps {
  currentSetupBill: SetUpBill | null;
  currentCustomerService: CustomerService | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const PaySetupBill: React.FC<PayNowProps> = ({ 
  currentCustomerService, 
  currentSetupBill, 
  onCancel, 
  onSuccess 
}) => {
  const { data: session } = useSession();
  const [dbPreviousTotal, setDbPreviousTotal] = useState<number>(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentCustomerService?.id) return;
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/customer/${currentCustomerService.id}/services/payment`);
        const data = await res.json();
        if (res.ok && data.setupBills) {
          const total = data.setupBills.reduce((acc: number, bill: SetUpBill) => {
            if (currentSetupBill && bill.id === currentSetupBill.id) return acc;
            return acc + (Number(bill.paidAmount) || 0);
          }, 0);
          setDbPreviousTotal(total);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [currentCustomerService?.id, currentSetupBill]);

  // 2. Form Setup
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SetupBillForm>({
    resolver: zodResolver(SetupBillSchema),
    mode: "onChange",
    values: {
      customerServiceId: currentCustomerService?.id || "",
      paidAmount: 0, 
      // Just pass the string; Zod coerce will handle the conversion
      paidDate: new Date().toISOString().split('T')[0] as any, 
      receivedB: session?.user?.name || "",
    },
  });

  // 3. Calculation Logic
  const watchedPaidAmount = watch("paidAmount");
  
  // Calculate remaining directly in the component body so it's "global" to the render
  const totalCost = currentCustomerService?.initCost || 0;
  const enteringNow = Number(watchedPaidAmount) || 0;
  const remaining = totalCost - dbPreviousTotal - enteringNow;

  // Sync session name
  useEffect(() => {
    if (session?.user?.name) setValue("receivedB", session.user.name);
  }, [session, setValue]);

  const handleFormSubmit: SubmitHandler<SetupBillForm> = async (formData) => {
    try {
      const response = await fetch(`/api/customer/${formData.customerServiceId}/services/payment`, {
        method: currentSetupBill ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentSetupBill ? { ...formData, id: currentSetupBill.id } : formData),
      });
      if (!response.ok) throw new Error("Failed to save");
      toast.success("Success");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-1">
      <div className="mb-4">
        <h3 className="text-lg font-bold">
          Payment: <span className="text-primary">{currentCustomerService?.customer?.name}</span>
        </h3>
        <div className="flex gap-4 text-[13px] font-bold mt-1 uppercase">
          <span className="opacity-80">Total Cost: ${totalCost}</span>
          {!isLoadingHistory && dbPreviousTotal > 0 && (
            <span className="text-success">Total Paid: ${dbPreviousTotal}</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <input type="hidden" {...register("customerServiceId")} />

        <div className="bg-base-200/50 p-4 rounded-xl border border-base-300 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label-text font-bold text-[10px] uppercase mb-1">Paying Now</label>
              <div className="relative flex items-center">
                <span className="absolute left-3"><DollarSign size={14} className="text-primary" /></span>
                <input 
                  type="number" 
                  step="any" 
                  {...register("paidAmount")} 
                  className={`input input-bordered input-sm w-full pl-9 font-bold ${remaining < 0 ? 'input-error' : ''}`} 
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label-text font-bold text-[10px] uppercase mb-1">Remaining Due</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-primary"><DollarSign size={14} /></span>
                <input 
                  type="number" 
                  readOnly 
                  value={remaining.toFixed(2)} 
                  className={`input input-bordered input-sm w-full pl-9 font-bold bg-base-300/30 ${remaining < 0 ? 'text-error' : ''}`} 
                />
              </div>
            </div>
          </div>
          
          {/* Row for Date and Receiver */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label-text font-bold text-[10px] uppercase mb-1">Payment Date</label>
              <input type="date" {...register("paidDate")} className="input input-bordered input-sm w-full" />
            </div>
            <div className="form-control">
              <label className="label-text font-bold text-[10px] uppercase mb-1">Received By</label>
              <input type="text" {...register("receivedB")} className="input input-bordered input-sm w-full" />
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button 
            type="submit" 
            className="btn btn-primary btn-sm px-8" 
            // Button is disabled if:
            // 1. Currently submitting
            // 2. Fetching history
            // 3. Nothing is being paid (enteringNow <= 0)
            // 4. Entering amount exceeds what is actually due (remaining < 0)
            disabled={isSubmitting || isLoadingHistory || enteringNow <= 0 || remaining < 0}
          >
            {isSubmitting ? "Saving..." : "Confirm Payment"}
          </button>
        </div>
      </form>
    </div>
  );
};