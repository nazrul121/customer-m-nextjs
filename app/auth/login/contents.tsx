"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {toast} from 'react-toastify';
import { authClient } from "@/lib/auth-client";

type LoginForm = {
  identifier: string;
  password: string;
};

type LoginErrors = {
  identifier?: string;
  password?: string;
};

const initialForm: LoginForm = {
  identifier: "",
  password: "",
  };

export default function LoginContents() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setGlobalError("");
  };

  const validate = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!form.identifier.trim()) {
      newErrors.identifier = "Email or phone number is required";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const isEmail = /\S+@\S+\.\S+/.test(form.identifier);

    try {
        let result;

        if (isEmail) {
            result = await authClient.signIn.email({
                email: form.identifier,
                password: form.password,
                rememberMe: true,
            });
        } else {
            result = await authClient.signIn.phoneNumber({
                phoneNumber: form.identifier,
                password: form.password,
                rememberMe: true,
            });
        }

        if (result.error) {
            toast.error(result.error.message);
            setGlobalError(result.error.message ?? "");
            setLoading(false);
            return;
        }

        // 🔑 Get user role from the session result
        const user = result.data?.user;
        // Safely get the role if it exists, otherwise fallback to undefined
        const role = (user && "role" in user && typeof (user as any).role === "string")
          ? ((user as any).role as string).toLowerCase()
          : undefined;

        localStorage.setItem("loginIdentifier", form.identifier);
        setForm(initialForm);

        // 🚀 Redirect based on Role
        if (role === "admin") {
            router.push("/dashboard/admin");
        } else if (role === "customer") {
            router.push("/dashboard/customer");
        } else {
            router.push("/dashboard");
        }

    } catch (err: any) {
        setGlobalError("An unexpected error occurred");
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {/* Restored your specific border and shadow styling */}
      <div className="rounded-lg shadow-lg p-8 w-full max-w-md text-base-content dark:border-2 border-x-fuchsia-900">
        
        <div className="flex justify-center mb-6">
          <Link href={'/'}>
            <Image src={'/images/logo.png'} style={{ height: '50px', width: 'auto' }} alt="Micro Datasoft" width={300} height={300}/>
          </Link>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6"> Sign in to your account </h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {globalError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {globalError}
            </div>
          )}

          <div>
            <label className="block font-medium mb-2" htmlFor="username"> Email or Phone </label>
            <input name="identifier" placeholder="Email or Phone Number"
              value={form.identifier} onChange={handleChange}
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-2" htmlFor="password"> Password </label>
            <input name="password" type="password" placeholder="Password"
              value={form.password} onChange={handleChange}
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox h-4 w-4" />
              <span className="text-sm">Remember me</span>
            </label>
            <Link href="#" className="text-sm link link-primary"> Forgot password? </Link>
          </div>

          <button type="submit" className="w-full btn btn-primary flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span> Checking...
                </>
            ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 20 20">
                      <path fill="currentColor" d="M9.76 0C15.417 0 20 4.477 20 10S15.416 20 9.76 20c-3.191 0-6.142-1.437-8.07-3.846a.644.644 0 0 1 .115-.918a.68.68 0 0 1 .94.113a8.96 8.96 0 0 0 7.016 3.343c4.915 0 8.9-3.892 8.9-8.692s-3.985-8.692-8.9-8.692a8.96 8.96 0 0 0-6.944 3.255a.68.68 0 0 1-.942.101a.644.644 0 0 1-.103-.92C3.703 1.394 6.615 0 9.761 0m.545 6.862l2.707 2.707c.262.262.267.68.011.936L10.38 13.15a.66.66 0 0 1-.937-.011a.66.66 0 0 1-.01-.937l1.547-1.548l-10.31.001A.66.66 0 0 1 0 10c0-.361.3-.654.67-.654h10.268L9.38 7.787a.66.66 0 0 1-.01-.937a.66.66 0 0 1 .935.011"></path>
                  </svg> Login
                </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-10">
          Don`t` have an account?{" "}
          <Link href="/auth/register" className="font-bold hover:underline decoration-2"> Sign Up </Link>
        </p>

      </div>
    </div>
  );
}

