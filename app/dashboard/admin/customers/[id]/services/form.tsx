'use client';
import React, { useEffect, useMemo,  } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Settings, Info, DollarSign, Calendar } from 'lucide-react';

import { CustomerServiceForm, CustomerServiceSchema, CustomerServiceOutput } from '@/lib/schemas';
import { CustomerService } from '@/types/customerService'; 
import { Service } from '@/types/service';
import { Customer } from '@/types/customer';

interface FormPageProps {
  currentCustomerService: CustomerService | null;
  customer: Customer;
  onCancel: () => void; 
  onSuccess: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const FormPage: React.FC<FormPageProps> = ({ currentCustomerService, customer, onCancel,onSuccess, onSubmit }) => {
  
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const res = await fetch('/api/service');
      if (!res.ok) throw new Error('Failed to load services');
      const json = await res.json();
      return json.data as Service[];
    }
  });

  
  // 2. Initialize Form
  const { register, handleSubmit,reset, watch,setError, setValue, formState: { errors, isSubmitting } } = useForm<CustomerServiceForm>({
    resolver: zodResolver(CustomerServiceSchema),
    mode: 'onChange',
    defaultValues: { 
      customerId: customer.id,
      serviceId: currentCustomerService?.serviceId,
      initCost: currentCustomerService?.initCost,
      mmc: currentCustomerService?.mmc,
      initCostDis:currentCustomerService?.initCostDis,
      mmcDis: currentCustomerService?.mmcDis,
    },
  });

  // 1. Explicitly cast the watched values to numbers
  const typedInitCost = watch('initCost') as number; 
  const typedMmc = watch('mmc') as number;
  const selectedServiceId = watch('serviceId');

  // Find the selected service object to get base prices
  const selectedService = useMemo(() => 
    servicesData?.find(s => s.id === selectedServiceId), 
  [selectedServiceId, servicesData]);

  // 4. Effect: Set defaults when service is selected (for Create mode)
  useEffect(() => {
    if (selectedService && !currentCustomerService) {
      const baseInit = Number(selectedService.initCost) || 0;
      const baseMmc = Number(selectedService.mmc) || 0;
      setValue('initCost', baseInit);
      setValue('mmc', baseMmc);
      setValue('initCostDis', 0);
      setValue('mmcDis', 0);
    }
  }, [selectedService, setValue, currentCustomerService]);


// 2. Add a fallback to 0 in your useEffect to handle empty strings/nulls safely
useEffect(() => {
  if (selectedService) {
    const baseInit = Number(selectedService.initCost) || 0;
    const baseMmc = Number(selectedService.mmc) || 0;

    // Use safe fallbacks (typedInitCost || 0) to prevent NaN math
    if ((typedInitCost || 0) > baseInit) {
      setValue('initCost', baseInit); 
      setValue('initCostDis', 0);
    } else {
      setValue('initCostDis', baseInit - (typedInitCost || 0));
    }

    if ((typedMmc || 0) > baseMmc) {
      setValue('mmc', baseMmc); 
      setValue('mmcDis', 0);
    } else {
      setValue('mmcDis', baseMmc - (typedMmc || 0));
    }
  }
}, [typedInitCost, typedMmc, selectedService, setValue]);
  // 6. Effect: Populate Form for Editing
  useEffect(() => {
    if (currentCustomerService) {
      reset({
        ...currentCustomerService,
        startDate: currentCustomerService.startDate ? new Date(currentCustomerService.startDate).toISOString().split('T')[0] : '',
        expiryDate: currentCustomerService.expiryDate ? new Date(currentCustomerService.expiryDate).toISOString().split('T')[0] : '',
      } as any);
    }else{
      reset({
        customerId: customer.id,
        serviceId: '',
        isRepeat: 'NO',
        initCost: 0,
        mmc: 0,
        initCostDis: 0,
        mmcDis: 0,
        startDate: '', // Or new Date().toISOString().split('T')[0] for today
        expiryDate: '',
      });
    }
  }, [currentCustomerService, reset]);

  // 7. Submit Handler
  const handleFormSubmit: SubmitHandler<CustomerServiceForm> = async (formData) => {
    try {
      // 1. Validate and Coerce (String -> Number/Date)
      const validatedData = CustomerServiceSchema.parse(formData);

      // 2. Prepare Payload
      const payload = currentCustomerService 
        ? { ...validatedData, id: currentCustomerService.id } 
        : validatedData;

      // 3. API Call (Assume this is your logic inside the onSubmit prop or direct fetch)
      const method = currentCustomerService ? 'PUT' : 'POST';
      const response = await fetch(`/api/customer/${customer.id}/services`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // 4. Handle Conflict (Duplicate Service for this Customer)
        if (response.status === 409) {
          // We set the error on 'serviceId' since that is the conflicting choice
          setError("serviceId", { 
            type: "manual", 
            message: result.message || "This customer is already subscribed to this service." 
          });
          return;
        }
        throw new Error(result.message || 'Failed to save Subscription');
      }

      onSuccess();
      toast.success(currentCustomerService ? "Updated successfully" : "Assigned successfully");
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Save failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-2 relative"> 
      <input type="hidden" {...register('customerId')} />

      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-base-100/60 backdrop-blur-sm rounded-xl">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Service Selection */}
      <div className="form-control w-full">
        <label className="label-text font-bold mb-1 text-xs uppercase tracking-wider">Service Model</label>
        <div className="relative w-full"> 
          <Settings size={18} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-40" />
          <select {...register('serviceId')} className="select select-bordered w-full pl-10 select-sm focus:text-success">
            <option value="">{servicesLoading ? 'Loading Services...' : 'Select a Service'}</option>
            {servicesData?.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (Base: {String(s.initCost)} BDT)</option>
            ))}
          </select>
        </div>
        {errors.serviceId && <span className="text-error text-xs mt-1">{errors.serviceId.message}</span>}
      </div>

      {/* Financial Section */}
      <div className="bg-base-200/50 p-4 rounded-xl space-y-4 border border-base-300">
        <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-primary" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Pricing & Discounts</span>
        </div>
        
        {/* Initial Cost Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label-text font-bold text-[10px] uppercase">Final Initial Cost</label>
            <input type="number" step="any" {...register('initCost')} className="focus:text-2xl input input-bordered input-sm font-bold text-primary" />
          </div>
          <div className="form-control">
            <label className="label-text font-bold text-[10px] uppercase opacity-50">Auto-Discount</label>
            <input type="number" {...register('initCostDis')} className="input input-bordered focus:text-2xl input-sm bg-base-300/20 text-success font-medium" readOnly />
          </div>
        </div>

        {/* Monthly Cost Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label-text font-bold text-[10px] uppercase">Final Monthly (MMC)</label>
            <input type="number" step="any"{...register('mmc')} className="focus:text-2xl input input-bordered input-sm font-bold text-primary" />
          </div>
          <div className="form-control">
            <label className="label-text font-bold text-[10px] uppercase opacity-50">Auto-Discount</label>
            <input type="number" {...register('mmcDis')} className="input input-bordered focus:text-2xl input-sm bg-base-300/20 text-success font-medium" readOnly />
          </div>
        </div>
      </div>

      {/* Date Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label-text font-bold mb-1 text-xs uppercase tracking-wider">Start Date</label>
          <input type="date" {...register('startDate')} className="input input-bordered input-sm" />
          {errors.startDate && <span className="text-error text-[10px] mt-1">{errors.startDate.message as string}</span>}
        </div>
        <div className="form-control">
          <label className="label-text font-bold mb-1 text-xs uppercase tracking-wider">Expiry Date</label>
          <input type="date" {...register('expiryDate')} className="input input-bordered input-sm" />
          {errors.expiryDate && <span className="text-error text-[10px] mt-1">{errors.expiryDate.message as string}</span>}
        </div>
      </div>

      {/* Auto Repeat Toggle (Radio Buttons) */}
      <div className="form-control border rounded-lg p-3 bg-base-200/30">
        <label className="label-text font-bold mb-2 text-xs uppercase tracking-wider block text-center">Auto-Repeat Subscription?</label>
        <div className="flex justify-center gap-10">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" value="YES" {...register('isRepeat')} className="radio radio-primary radio-sm" />
            <span className="label-text font-medium group-hover:text-primary transition-colors">YES</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" value="NO" {...register('isRepeat')} className="radio radio-primary radio-sm" />
            <span className="label-text font-medium group-hover:text-primary transition-colors">NO</span>
          </label>
        </div>
        {errors.isRepeat && <span className="text-error text-xs mt-1 text-center block">{errors.isRepeat.message}</span>}
      </div>


      <div className="modal-action">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm px-10 shadow-lg" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </form>
  );
};