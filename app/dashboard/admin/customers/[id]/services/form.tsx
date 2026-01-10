'use client';
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { User, Phone, FileUp, Camera, Mail, IndentIcon } from 'lucide-react';

import { CustomerServiceForm, CustomerSchema } from '@/lib/schemas';
import { Customer } from '@/types/customer'; 

interface CustomerServiceFormProps {
  customer: Customer | null;
  onCancel: () => void; 
  onSuccess: () => void;
}

export const FormPage: React.FC<CustomerServiceFormProps> = ({ customer, onCancel, onSuccess }) => {
  
  const { register, handleSubmit, reset, watch, setError, formState: { errors, isSubmitting } } = useForm<CustomerServiceForm>({
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


  const handleFormSubmit: SubmitHandler<CustomerServiceForm> = async (data) => {
   
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
     

      {/* Footer Buttons */}
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary px-10">
         save
        </button>
      </div>
    </form>
  );
};