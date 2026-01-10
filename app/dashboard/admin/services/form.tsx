'use client';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

import { ServiceForm, ServiceSchema } from '@/lib/schemas';
import { Service } from '@/types/service'; 
import { fetchServiceTypes } from '@/lib/api-client';

interface ServiceFormProps {
  currentService: Service | null;
  onCancel: () => void; 
  onSuccess: () => void;
  onSubmit: (data: ServiceForm & { id?: number }) => Promise<void>; 
}

export const FormPage: React.FC<ServiceFormProps> = ({ currentService, onCancel, onSuccess }) => {
  const [serviceTypes, setServiceTypes] = useState<{ id: string; title: string }[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ServiceForm>({
    resolver: zodResolver(ServiceSchema),
    mode: 'onBlur',
    defaultValues: { name: '',  initCost: 0,  mmc: 0, serviceTypeId: '' },
  });

  // 1. Fetch Service Types (Categories) for the dropdown
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingTypes(true);
      try {
        const data = await fetchServiceTypes(); // This calls /api/service-type?simple=true
        setServiceTypes(data);
      } catch (error) {
        console.error("Failed to fetch types:", error);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadCategories();
  }, []);

  // 2. Sync form with currentService when editing
  useEffect(() => {
    if (currentService) {
      reset({
        name: currentService.name || '',
        initCost: currentService.initCost !== undefined ? Number(currentService.initCost) : 0,
        mmc: currentService.mmc !== undefined ? Number(currentService.mmc) : 0,
        serviceTypeId: currentService.serviceTypeId ? currentService.serviceTypeId.toString() : '',
      });
    } else {
      reset({ name: '', initCost: 0, serviceTypeId: '', });
    }
  }, [currentService, reset]); 

  const handleFormSubmit: SubmitHandler<ServiceForm> = async (data) => {
    const method = currentService ? 'PUT' : 'POST';
    // NOTE: Check if your endpoint for Services is different from Service-Types
    const endpoint = '/api/service'; 
    const payload = currentService ? { id: currentService.id, ...data } : data;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("name", { type: "manual", message: result.message || 'Service already exists.' });
          return;
        }
        throw new Error(result.message || 'Failed to save service');
      }

      onSuccess();
      toast.success(currentService ? "Service updated!" : "Service created!");

    } catch (error: any) {
      setError("root", { 
        type: "manual", 
        message: error.message || 'An unknown error occurred.' 
      });
    }
  };
  
  const isBusy = isSubmitting || loadingTypes;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4"> 
      {isBusy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/10 backdrop-blur-[1px]">
          <span className="loading loading-spinner loading-lg text-secondary"></span>
        </div>
      )}

      {errors.root && (
        <div role="alert" className="alert alert-error mb-4 py-2">
          <span className="text-sm">{errors.root.message}</span>
        </div>
      )}
      
    {/* Service Name */}
    <div className="form-control w-full">
        <label className="label"><span className="label-text">Service Name</span></label>
        <input 
          type="text" 
          placeholder="e.g. Standard Internet" 
          className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} 
          {...register('name')} 
          disabled={isBusy} 
        />
        {errors.name && <label className="label-text-alt text-error mt-1">{errors.name.message}</label>}
    </div>

    {/* Service Type (Category Dropdown) */}
    <div className="form-control w-full mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            
            {/* Label - 20% width on small screens and up */}
            <label className="label sm:w-1/5 justify-start">
                <span className="label-text font-medium text-base">Service Type</span>
            </label>

            {/* Select Container - 80% width */}
            <div className="w-full sm:w-4/5 flex flex-col">
            <select className={`select select-bordered w-full ${errors.serviceTypeId ? 'select-error' : ''}`}
                {...register('serviceTypeId')} disabled={isBusy} defaultValue=""
            >
                <option value="" disabled> {loadingTypes ? 'Loading types...' : 'Select a type'}</option>
                {serviceTypes.map((type) => (
                    <option key={type.id} value={type.id}> {type.title} </option>
                ))}
            </select>

            {/* Error message aligned under the select box */}
            {errors.serviceTypeId && (
                <label className="label py-1">
                    <span className="label-text-alt text-error font-semibold">
                        {errors.serviceTypeId.message}
                    </span>
                </label>
            )}
            </div>

        </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
        {/* Initial Cost - 50% */}
        <div className="form-control w-full sm:w-1/2">
            <label className="label">
                <span className="label-text font-medium text-base">Initial Cost</span>
            </label>
            <div className="relative">
                <input type="number" step="0.01" placeholder="0.00"
                    className={`input input-bordered w-full pr-12 ${errors.initCost ? 'input-error' : ''}`} 
                    {...register('initCost', { valueAsNumber: true })} 
                    disabled={isBusy} 
                    onWheel={(e) => (e.target as HTMLInputElement).blur()} // Prevents scrolling to change numbers
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50"> $</div>
            </div>
            {errors.initCost && (
            <span className="text-error text-xs mt-1 px-1">{errors.initCost.message}</span>
            )}
        </div>

        {/* MMC Field - 50% */}
        <div className="form-control w-full sm:w-1/2">
            <label className="label">
            <span className="label-text font-medium text-base">MMC</span>
            </label>
            <div className="relative">
            <input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                className={`input input-bordered w-full pr-12 ${errors.mmc ? 'input-error' : ''}`} 
                {...register('mmc', { valueAsNumber: true })} 
                disabled={isBusy} 
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50">
                /mo
            </div>
            </div>
            {errors.mmc && (
            <span className="text-error text-xs mt-1 px-1">{errors.mmc.message}</span>
            )}
        </div>
    </div>

      {/* Action Buttons */}
      <div className="modal-action mt-6">
        <button type="button" className="btn" onClick={onCancel} disabled={isBusy}>Cancel</button>
        <button type="submit" className="btn btn-secondary" disabled={isBusy}>
          {isSubmitting ? 'Saving...' : (currentService ? 'Update Service' : 'Add Service')}
        </button>
      </div>
    </form>
  );
};