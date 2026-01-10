"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
    User, Mail, Phone, LogOut, ShieldCheck, 
    Activity, Zap, Users, LayoutDashboard, 
    ChevronRight, Bell
} from "lucide-react";
import { toast } from "react-toastify";

// Types for our dynamic stats
type DashboardStats = {
    activeServices: number;
    totalUsers: number;
    systemHealth: string;
};

type SessionUser = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    phoneNumber?: string | null;
    phoneNumberVerified?: boolean;
    // Add any other properties your user object has
    role: string; // <-- Add this line
};

type Session = {
    user: SessionUser;
    // Add any other properties your session object has
};

export default function DashboardComponent() {
    const { data: session, isPending } = authClient.useSession() as { data: Session | null, isPending: boolean };
    const router = useRouter();
    
    // States
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        activeServices: 0,
        totalUsers: 0,
        systemHealth: "99.9%"
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const loginIdentifier = typeof window !== "undefined" ? localStorage.getItem("loginIdentifier") : null;

    // 1. Handle Hydration & Initial Fetch
    useEffect(() => {
        setMounted(true);

        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                const data = await res.json();
                if (res.ok) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setStatsLoading(false);
            }
        };

        if (session?.user?.role === "admin") {
            fetchStats();
        }
    }, [session]);

    // 2. Loading State (Full Page)
    if (!mounted || isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <span className="loading loading-ring loading-lg text-primary"></span>
            </div>
        );
    }

    // 3. Security Redirect (if session lost)
    if (!session) {
        router.push("/auth/login");
        return null;
    }

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Logged out successfully");
                    router.push("/");
                }
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-300 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary text-primary-content rounded-2xl shadow-lg shadow-primary/20">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Admin Console</h1>
                        <p className="text-base-content/60 flex items-center gap-2">
                            Welcome back, <span className="font-bold text-base-content">{session.user.name}</span>
                            <span className="badge badge-primary badge-sm font-bold uppercase">{session.user.role}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-circle">
                        <Bell size={20} />
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="btn btn-outline btn-error btn-sm md:btn-md gap-2 rounded-xl"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            {/* --- DYNAMIC STAT CARDS --- */}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Services" 
                    value={stats.activeServices} 
                    isLoading={statsLoading}
                    icon={<Zap size={20} />} 
                    color="text-yellow-500 bg-yellow-500/10" 
                />
                <StatCard 
                    title="Total Customers" 
                    value={stats.totalUsers} 
                    isLoading={statsLoading}
                    icon={<Users size={20} />} 
                    color="text-blue-500 bg-blue-500/10" 
                />
                <StatCard 
                    title="System Health" 
                    value={stats.systemHealth} 
                    isLoading={false}
                    icon={<Activity size={20} />} 
                    color="text-green-500 bg-green-500/10" 
                />
                <StatCard 
                    title="Security Level" 
                    value="Tier 3" 
                    isLoading={false}
                    icon={<ShieldCheck size={20} />} 
                    color="text-purple-500 bg-purple-500/10" 
                />
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Account Details */}
                <div className="lg:col-span-2 card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                    <div className="card-body p-0">
                        <div className="p-6 border-b border-base-300 bg-base-200/30">
                            <h2 className="card-title text-xl font-bold flex items-center gap-2">
                                <UserCircleIcon className="text-primary" /> Profile Credentials
                            </h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            <InfoBox label="Full Name" value={session.user.name} icon={<User size={16}/>} />
                            <InfoBox label="Email Address" value={session.user.email} icon={<Mail size={16}/>} />
                            <InfoBox label="Phone Number" value={session.user.phoneNumber || 'Not linked'} icon={<Phone size={16}/>} />
                            <InfoBox label="Identity Verified" value={loginIdentifier || 'Active Session'} icon={<ShieldCheck size={16}/>} />
                        </div>
                        <div className="p-4 bg-base-200/50 text-center">
                            <button className="btn btn-ghost btn-xs text-primary gap-1">Edit Profile <ChevronRight size={14}/></button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Widget */}
                <div className="flex flex-col gap-6">
                    <div className="card bg-neutral text-neutral-content shadow-xl border-none relative overflow-hidden">
                        <div className="absolute top-[-10px] right-[-10px] opacity-10 rotate-12">
                            <Zap size={120} />
                        </div>
                        <div className="card-body z-10">
                            <h2 className="card-title italic font-black text-2xl tracking-tighter">Micro Datasoft PRO</h2>
                            <p className="text-sm opacity-70">Enterprise License Active.</p>
                            <div className="divider divider-neutral"></div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Server Load</span>
                                    <span>14%</span>
                                </div>
                                <progress className="progress progress-primary w-full" value="14" max="100"></progress>
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <button className="btn btn-sm btn-primary shadow-lg border-none px-6">View Logs</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon, color, isLoading }: any) {
    return (
        <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="card-body p-5 flex-row items-center gap-4">
                <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${color}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-base-content/40 tracking-[0.2em]">{title}</p>
                    {isLoading ? (
                        <div className="h-7 w-16 bg-base-300 animate-pulse rounded-md mt-1"></div>
                    ) : (
                        <p className="text-2xl font-black tracking-tight">{value}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value, icon }: any) {
    return (
        <div className="flex items-start gap-4 p-2">
            <div className="mt-1 text-primary/60">{icon}</div>
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">
                    {label}
                </span>
                <span className="text-sm font-bold text-base-content/80 break-all">{value}</span>
            </div>
        </div>
    );
}

function UserCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
        </svg>
    );
}