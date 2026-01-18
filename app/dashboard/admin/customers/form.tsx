'use client';
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { User, Phone, FileUp, CheckCircle2, Circle, Camera, Mail, Code, IndentIcon } from 'lucide-react';

import { CustomerForm, CustomerSchema } from '@/lib/schemas';
import { Customer } from '@/types/customer'; 

interface CustomerFormProps {
  currentCustomer: Customer | null;
  onCancel: () => void; 
  onSuccess: () => void;
  onSubmit?: (data: any) => Promise<void>;
}

export const FormPage: React.FC<CustomerFormProps> = ({ currentCustomer, onCancel, onSuccess }) => {
  
  const { register, handleSubmit, reset, watch, setError, formState: { errors, isSubmitting } } = useForm<CustomerForm>({
    resolver: zodResolver(CustomerSchema),
    mode: 'onBlur',
    defaultValues: { 
      name: '', 
      customerCode:'',
      email: '', 
      phone: '', 
      status: 'ACTIVE' 
    },
  });

  const selectedStatus = watch("status");

  useEffect(() => {
    if (currentCustomer) {
      // Fill form with existing data for Editing
      reset({
        name: currentCustomer.name,  customerCode: currentCustomer.customerCode || '',
        email: currentCustomer.email || '', phone: currentCustomer.phone ? String(currentCustomer.phone) : '',
        status: (currentCustomer.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
      });
    } else {
      // 👈 CLEAR form when currenCustomer is null (Add New mode)
      reset({
        name: '', customerCode: '', email: '', phone: '',  aggrePaper:'', photo:'', status: 'ACTIVE',
      });
    }
  }, [currentCustomer, reset]);

  const handleFormSubmit: SubmitHandler<CustomerForm> = async (data) => {
    try {
      const formData = new FormData();
      // Append text fields
      formData.append('name', data.name);
      formData.append('customerCode', data.customerCode);
      formData.append('email', data.email || '');
      formData.append('phone', data.phone.toString());
      formData.append('status', data.status);
      
      // 🔑 Optional File: Photo
      if (data.photo && data.photo[0]) {
        formData.append('photo', data.photo[0]);
      }

      // 🔑 Optional File: Agreement Paper
      if (data.aggrePaper && data.aggrePaper[0]) {
        formData.append('aggrePaper', data.aggrePaper[0]);
      }

      const method = currentCustomer ? 'PUT' : 'POST';
      const endpoint = '/api/customer';
      if (currentCustomer) formData.append('id', currentCustomer.id);

      const response = await fetch(endpoint, {
        method,
        body: formData, // No Content-Type header needed for FormData
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save');

      // Show the toast FIRST, then trigger the success callback
      toast.success(result.message || "Customer saved successfully!");
      onSuccess();
    } catch (error: any) {
      setError("root", { type: "manual", message: error.message });
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 p-2 relative"> 
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-base-100/60 backdrop-blur-sm rounded-xl">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

     <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="form-control w-full md:flex-[0.6]">
            <label className="label-text font-bold mb-2">Customer Name</label>
            <div className="relative w-full"> 
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-40 pointer-events-none" />
                <input type="text"   {...register('name')} className="input input-bordered w-full pl-10 focus:outline-none"  placeholder="e.g. Nazrul Islam"  />
            </div>
            {errors.name && <span className="text-error text-xs mt-1">{errors.name.message}</span>}
        </div>

        <div className="form-control w-full md:flex-[0.4]">
            <label className="label-text font-bold mb-2">Customer Code</label>
            <div className="relative w-full"> 
                <IndentIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-40 pointer-events-none" />
                <input type="text" {...register('customerCode')} className="input input-bordered w-full pl-10 focus:outline-none" placeholder="e.g. micro-1" />
            </div>
            {errors.customerCode && <span className="text-error text-xs mt-1">{errors.customerCode.message}</span>}
        </div>
    </div>
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control w-full">
            <label className="label-text font-bold mb-2">Email Address</label>
            <div className="relative w-full"> 
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-40 pointer-events-none" />
                <input type="email" {...register('email')}  className="input input-bordered w-full pl-10 focus:outline-none" placeholder="customer@email.com" />
            </div>
        </div>

        <div className="form-control w-full">
            <label className="label-text font-bold mb-2">Phone No</label>
            <div className="relative w-full"> 
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-40 pointer-events-none" />
                <input type="text" {...register('phone')}  className="input input-bordered w-full pl-10 focus:outline-none" placeholder="01..." />
            </div>
        </div>
      </div>

      {/* Row 2: Optional File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label-text font-bold mb-2 flex items-center gap-2">
              <Camera size={16} /> Photo (Optional)
          </label>
          <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm w-full" {...register('photo')} />
        </div>

        <div className="form-control">
          <label className="label-text font-bold mb-2 flex items-center gap-2">
              <FileUp size={16} /> Agreement Paper (Optional PDF)
          </label>
          <input type="file"  accept=".pdf" className="file-input file-input-bordered file-input-sm w-full"  {...register('aggrePaper')}/>
        </div>
      </div>

      {/* Status Radio Box */}
      <div className="form-control">
        <label className="label-text font-bold mb-3">Account Status</label>
        <div className="flex gap-4">
          <label className={`flex-1 flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedStatus === 'ACTIVE' ? 'border-success bg-primary/5' : 'border-base-300 hover:border-base-content/20'}`}>
            <div className="flex items-center gap-3">
              {selectedStatus === 'ACTIVE' ? <CheckCircle2 className="text-success" /> : <Circle className="opacity-20" />}
              <span className={`font-bold ${selectedStatus === 'ACTIVE' ? 'text-success' : 'opacity-60'}`}>Active</span>
            </div>
            <input type="radio" value="ACTIVE" {...register('status')} className="hidden" />
          </label>

          <label className={`flex-1 flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedStatus === 'INACTIVE' ? 'border-error bg-error/5' : 'border-base-300 hover:border-base-content/20'}`}>
            <div className="flex items-center gap-3">
              {selectedStatus === 'INACTIVE' ? <CheckCircle2 className="text-error" /> : <Circle className="opacity-20" />}
              <span className={`font-bold ${selectedStatus === 'INACTIVE' ? 'text-error' : 'opacity-60'}`}>Inactive</span>
            </div>
            <input type="radio" value="INACTIVE" {...register('status')} className="hidden" />
          </label>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary px-10">
          {currentCustomer ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
};