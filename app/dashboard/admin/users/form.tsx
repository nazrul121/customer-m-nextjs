'use client';
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Ensure paths are correct
import { UserForm, userSchema } from '@/lib/schemas';
import { User } from '@/types/user'; 
import { toast } from 'react-toastify';

interface UserFormProps {
  currentUser: User | null;
  onCancel: () => void; 
  onSubmit: (data: UserForm & { id?: number }) => Promise<void>; 
  onSuccess: () => void;
}

export const FormPage: React.FC<UserFormProps> = ({currentUser,onCancel,onSuccess}) => {
  const { register, handleSubmit,  reset, 
    setError, 
    formState: { errors, isSubmitting }, 
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema), mode: 'onBlur', 
    defaultValues: { name: '', email: '', phoneNumber: ''},
  });

  useEffect(() => {
    if (currentUser) {
      reset({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        // role: (currentUser.role === 'user' || currentUser.role === 'admin' || currentUser.role === 'guest') ? currentUser.role : 'user',
      });
    } else {
      reset( { name: '', email: '',phoneNumber: ''
        //  role: 'user' 
        });
    }
  }, [currentUser, reset]); 


  const handleFormSubmit: SubmitHandler<UserForm> = async (data) => {
    const method = currentUser ? 'PUT' : 'POST'
    const payload = currentUser? { id: currentUser.id, ...data } : data
    try {
      const response = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle 409 Conflict (Email Uniqueness Error)
        if (response.status === 409) {
            setError("email", { 
              type: "manual", 
              message: errorData.message || 'Email already exists.' 
            });
            return;
        }
        toast.error(`Failed to ${method === 'POST' ? 'create' : 'update'} user`);
        throw new Error(`Failed to ${method === 'POST' ? 'create' : 'update'} user`)
      }
      onSuccess();
      if(currentUser)
        toast.success("Data updated successfully!");
      else 
        toast.success("Data created successfully!");

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
        <label className="label"><span className="label-text">Name</span></label>
        <input type="text" placeholder="John Doe" className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} {...register('name')} disabled={isBusy} />
        {errors.name && <label className="label"><span className="label-text-alt text-error">{errors.name.message}</span></label>}
      </div>

      <div className="form-control w-full mb-4">
        <label className="label"><span className="label-text">Email</span></label>
        <input type="email" placeholder="john.doe@example.com" className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} {...register('email')} disabled={!!currentUser || isBusy} />
        {errors.email && <label className="label"><span className="label-text-alt text-error">{errors.email.message}</span></label>}
      </div>

      <div className="form-control w-full mb-4">
        <label className="label"><span className="label-text">Phone No</span></label>
        <input type="number" placeholder="01..." className={`input input-bordered w-full ${errors.phoneNumber ? 'input-error' : ''}`} {...register('phoneNumber')} disabled={!!currentUser || isBusy} />
        {errors.phoneNumber && <label className="label"><span className="label-text-alt text-error">{errors.phoneNumber.message}</span></label>}
      </div>

      <div className="form-control w-full mb-4">
        <label className="label"><span className="label-text">Password</span></label>
        <input type="password" placeholder="*******" className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`} {...register('password')} disabled={!!currentUser || isBusy} />
        {errors.password && <label className="label"><span className="label-text-alt text-error">{errors.password.message}</span></label>}
      </div>


      {/* <div className="form-control w-full mb-4">
        <label className="label"><span className="label-text">Role</span></label>
        <select {...register('role')} className='select select-sm select-bordered w-full' disabled={isBusy}>
          <option value="user">User</option>
          <option value="guest">Guest</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <label className="label"><span className="label-text-alt text-error">{errors.role.message}</span></label>}
      </div> */}

      <div className="modal-action mt-6">
        <button type="button" className="btn" onClick={onCancel} disabled={isBusy}>Cancel </button>
        <button type="submit" className={`btn btn-secondary`} disabled={isBusy} >
          {isBusy ? 'Saving...' : (currentUser ? 'Update User' : 'Add User')}
        </button>
      </div>
    </form>
  );
};