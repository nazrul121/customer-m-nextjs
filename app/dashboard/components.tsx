"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, Phone, LogOut, ShieldCheck, UserCircle } from "lucide-react";

export default function AccountComponents() {
    const { data: session, isPending } = authClient.useSession();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // 🔑 FIXED: Redirect logic moved inside useEffect to prevent the "Router update" error
    useEffect(() => {
        if (mounted && !isPending && !session) {
            router.push("/auth/login");
        }
    }, [mounted, isPending, session, router]);

    const loginIdentifier = typeof window !== "undefined" ? localStorage.getItem("loginIdentifier") : null;

    // 1. Show loading state while checking session
    if (!mounted || isPending) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <span className="loading loading-ring loading-lg text-primary"></span>
            </div>
        );
    }

    // 2. Return null if no session (the useEffect above handles the actual redirect)
    if (!session) return null;

    // 3. Determine the workspace route
    const getWorkspaceRoute = () => {
        const role = session.user.role;
        if (role === 'admin') return '/dashboard/admin';
        if (role === 'user') return '/dashboard/user';
        if (role === 'customer') return '/dashboard/customer';
        return '/dashboard';
    };

    const workspaceRoute = getWorkspaceRoute();

    return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Overview</h1>
                    <p className="text-base-content/60 italic">
                        Logged in as <span className="text-primary font-semibold lowercase">{session.user.role}</span>
                    </p>
                </div>
                <button 
                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
                    className="btn btn-ghost btn-error btn-sm sm:btn-md gap-2 border border-base-300 rounded-xl"
                >
                    <LogOut size={18} /> Logout
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Account Details Card */}
                <div className="lg:col-span-2 card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
                    <div className="card-body">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <UserCircle size={24} />
                            </div>
                            <h2 className="card-title text-xl">Profile Information</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoBox label="Full Name" value={session.user.name} icon={<User size={14}/>} />
                            <InfoBox label="Email Address" value={session.user.email} icon={<Mail size={14}/>} />
                            <InfoBox label="Phone Number" value={session.user.phoneNumber || 'Not provided'} icon={<Phone size={14}/>} />
                            <InfoBox label="Login Method" value={loginIdentifier || 'Standard Auth'} icon={<ShieldCheck size={14}/>} />
                        </div>
                    </div>
                </div>

                {/* Role-Based Action Card */}
                <div className="card bg-neutral text-neutral-content shadow-xl border-none rounded-2xl overflow-hidden relative">
                    {/* Decorative Background Pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck size={100} />
                    </div>

                    <div className="card-body justify-center items-center text-center z-10">
                        <div className="avatar placeholder mb-4">
                            <div className="bg-primary flex items-center justify-center text-primary-content rounded-full w-20 shadow-lg ring-4 ring-primary/20">
                                <span className="text-3xl font-bold uppercase">{session.user.role?.[0]}</span>
                            </div>
                        </div>
                        <h2 className="text-lg">You have logged in as</h2>
                        <b className="text-3xl font-black text-primary tracking-tight uppercase mb-2">
                            {session.user.role}
                        </b>
                        <p className="text-sm opacity-70 mb-6"> 
                            Access your dedicated tools and management console.
                        </p>
                        <button onClick={() => router.push(workspaceRoute)} className="btn btn-primary btn-block shadow-lg rounded-xl h-12">
                            Enter Workspace
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-base-200/30 border border-base-content/5 hover:border-primary/20 transition-all group">
            <span className="text-[10px] font-bold text-base-content/40 flex items-center gap-2 uppercase tracking-widest group-hover:text-primary transition-colors">
                {icon} {label}
            </span>
            <span className="text-sm font-bold text-base-content/80 truncate">{value}</span>
        </div>
    );
}