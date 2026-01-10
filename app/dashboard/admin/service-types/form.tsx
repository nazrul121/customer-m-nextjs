'use client';
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Ensure paths are correct
import { ServiceTypeForm, ServiceTypeSchema } from '@/lib/schemas';
import { ServiceType } from '@/types/serviceType'; 
import { toast } from 'react-toastify';

interface ServiceTypeFormProps {
  currentServiceType: ServiceType | null;
  onCancel: () => void; 
  onSubmit: (data: ServiceTypeForm & { id?: number }) => Promise<void>; 
  onSuccess: () => void;
}

export const FormPage: React.FC<ServiceTypeFormProps> = ({currentServiceType,onCancel,onSuccess}) => {
  const { register, handleSubmit,  reset, 
    setError, 
    formState: { errors, isSubmitting }, 
  } = useForm<ServiceTypeForm>({
    resolver: zodResolver(ServiceTypeSchema), mode: 'onBlur', 
    defaultValues: { title: '', description: '',},
  });

  useEffect(() => {
    if (currentServiceType) {
      reset({
        title: currentServiceType?.title || '',
        description: currentServiceType?.description || '',
     });
    } else {
      reset( { title: '', description: '' });
    }
  }, [currentServiceType, reset]); 


  const handleFormSubmit: SubmitHandler<ServiceTypeForm> = async (data) => {
    const method = currentServiceType ? 'PUT' : 'POST'
    const payload = currentServiceType? { id: currentServiceType.id, ...data } : data
    try {
      const response = await fetch('/api/service-type', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle 409 Conflict (Email Uniqueness Error)
        if (response.status === 409) {
            setError("title", { 
              type: "manual", 
              message: errorData.message || 'title already exists.' 
            });
            return;
        }
        toast.error(`Failed to ${method === 'POST' ? 'create' : 'update'} Service type`);
        throw new Error(`Failed to ${method === 'POST' ? 'create' : 'update'} Service type`)
      }
      onSuccess();
      if(currentServiceType) toast.success("Data updated successfully!");
      else toast.success("Data created successfully!");

    } catch (error:Error|any) {
      const errorMessage = (error && typeof error.message === 'string')  ? error.message : 'An unknown error occurred during submission.';
      setError("root", { 
        type: "manual", 
        message: errorMessage // Now guaranteed to be a string
      });
    }
  };
  
  const isBusy = isSubmitting;
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}> 
      {isBusy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/1 backdrop-blur-sm transition-opacity duration-300">
            <span className="loading loading-spinner loading-lg text-secondary"></span>
        </div>
      )}

      {errors.root && (
        <div role="alert" className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{errors.root.message}</span>
        </div>
      )}
      
      <div className="form-control w-full mb-4">
        <label className="label"><span className="label-text">Service Type</span></label>
        <input type="text" placeholder="John Doe" className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`} {...register('title')} disabled={isBusy} />
        {errors.title && <label className="label"><span className="label-text-alt text-error">{errors.title.message}</span></label>}
      </div>


     <div className="form-control w-full mb-4">
      <label className="label">
        <span className="label-text">Description <span className="text-xs opacity-50">[optional]</span></span>
      </label>
      
      <textarea 
        placeholder="Enter description..." 
        className={`textarea textarea-bordered w-full h-24 ${errors.description ? 'textarea-error' : ''}`} 
        {...register('description')}
      />
      
      {errors.description && (
        <label className="label">
          <span className="label-text-alt text-error">{errors.description.message}</span>
        </label>
      )}
    </div>

      <div className="modal-action mt-6">
        <button type="button" className="btn" onClick={onCancel} disabled={isBusy}>Cancel </button>
        <button type="submit" className={`btn btn-secondary`} disabled={isBusy} >
          {isBusy ? 'Saving...' : (currentServiceType ? 'Update Service Type' : 'Add Service Type')}
        </button>
      </div>
    </form>
  );
};