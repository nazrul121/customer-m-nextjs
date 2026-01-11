"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // 🔑 Added useEffect and useState
import { User, Mail, Phone, LogOut, ShieldCheck, UserCircle } from "lucide-react";

export default function AccountComponents() {
    const { data: session, isPending } = authClient.useSession();
    const [mounted, setMounted] = useState(false); // 🔑 Track if we are in the browser
    const router = useRouter();

    // 🔑 Force a re-render once the component hits the browser
    useEffect(() => {
        setMounted(true);
    }, []);

    const loginIdentifier = typeof window !== "undefined" ? localStorage.getItem("loginIdentifier") : null;

    // 1. Show nothing or a skeleton while loading the session
    if (!mounted || isPending) return (
        <div className="flex h-[40vh] items-center justify-center">
            <span className="loading loading-ring loading-lg text-primary"></span>
        </div>
    );
    
    // 2. If no session after mounting, redirect to login
    if (!session) {
        router.push("/auth/login");
        return null;
    }

    let route = '';
    if(session.user.role == 'admin') route= '/dashboard/admin';
    else if(session.user.role == 'user') route= '/dashboard/user';
    else if(session.user.role == 'customer') route= '/dashboard/customer';
    else route= '/dashboard';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Welcome Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Overview</h1>
                    <p className="text-base-content/60 italic">
                        Logged in as <span className="text-primary font-semibold">{session.user.role}</span>
                    </p>
                </div>
                <button 
                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
                    className="btn btn-ghost btn-error btn-sm sm:btn-md gap-2 border border-base-300"
                >
                    <LogOut size={18} /> Logout
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Account Details Card */}
                <div className="lg:col-span-2 card bg-base-100 border border-base-300 shadow-sm">
                    <div className="card-body">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <UserCircle size={24} />
                            </div>
                            <h2 className="card-title text-xl">Profile Information</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InfoBox label="Full Name" value={session.user.name} icon={<User size={16}/>} />
                            <InfoBox label="Email Address" value={session.user.email} icon={<Mail size={16}/>} />
                            <InfoBox label="Phone Number" value={session.user.phoneNumber || 'Not provided'} icon={<Phone size={16}/>} />
                            <InfoBox label="Login Method" value={loginIdentifier || 'Standard'} icon={<ShieldCheck size={16}/>} />
                        </div>
                    </div>
                </div>

                {/* Role-Based Action Card */}
                <div className="card bg-neutral text-neutral-content shadow-xl border-none">
                    <div className="card-body justify-center items-center text-center">
                        <div className="avatar placeholder mb-4 ">
                            <div className="bg-primary text-primary-content rounded-full w-16 flex justify-center items-center">
                                <span className="text-2xl uppercase">{session.user.role?.[0]}</span>
                            </div>
                        </div>
                        <h2 className="tracking-tighter"> You have loggedin as <b className="text-2xl">{session.user.role}</b> </h2>
                        <p className="text-sm opacity-70 mb-4"> Access your dedicated tools and management console.</p>
                        <button onClick={() => router.push(route)}className="btn btn-primary btn-block shadow-lg">
                            Enter Workspace
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value, icon }: any) {
    return (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl hover:bg-base-200/50 transition-colors">
            <span className="text-[10px] font-bold text-base-content/40 flex items-center gap-2 uppercase tracking-widest">
                {icon} {label}
            </span>
            <span className="text-sm font-semibold truncate">{value}</span>
        </div>
    );
}