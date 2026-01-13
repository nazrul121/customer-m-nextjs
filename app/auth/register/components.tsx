"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Loader2, UserPlus, Mail, Phone, Lock, User } from "lucide-react";
import {toast} from 'react-toastify';

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
};

export default function RegisterContents() {
  const router = useRouter();
  
  // State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // Centralized Change Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific error when user starts typing again
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email address";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const { error } = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phoneNumber:formData.phone,
        callbackURL: "/auth/register",
      });

      if (error) {
        toast.error(error.message || "Failed to create account");
        setErrorMessage(error.message || "Failed to create account");
      } else {
        toast.success("Welcome "+formData.name+"! Account created. Please wait for confirmation");
        router.push("/auth/login");
      }
    } catch (err) {
      setErrorMessage("A connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-xl  border">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-sm">Join us to start your journey</p>
        </div>

        {errorMessage && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4 ">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4" />
              <input
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition ${
                  errors.name ? "border-red-500 ring-1 ring-red-500" : "focus:ring-2 focus:ring-black/5 border-gray-300"
                }`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Phone Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4" />
              <input name="phone" placeholder="+880..."
                value={formData.phone} onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition ${
                  errors.phone ? "border-red-500 ring-1 ring-red-500" : "focus:ring-2 focus:ring-black/5 border-gray-300"
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4" />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition ${
                  errors.email ? "border-red-500 ring-1 ring-red-500" : "focus:ring-2 focus:ring-black/5 border-gray-300"
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium ">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 " />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition ${
                  errors.password ? "border-red-500 ring-1 ring-red-500" : "focus:ring-2 focus:ring-black/5 border-gray-300"
                }`}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
        </div>

        <button onClick={handleSignUp} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold btn btn-dash hover:text- transition disabled:bg-gray-400 active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Sign Up
            </>
          )}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold hover:underline decoration-2">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}