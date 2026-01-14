"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
    UserIcon, Mail, Phone, LogOut, ShieldCheck, 
    UserCircle, CheckCircle2, XCircle 
} from "lucide-react";
import { User } from "@/types/user";
import { toast } from "react-toastify";

interface Props {
    loggedinUser: User | null; // Fresh data from Prisma
}

export const AccountComponents: React.FC<Props> = ({ loggedinUser }) => {
    const { data: session, isPending } = authClient.useSession();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * 🛡️ LIVE SECURITY CHECK
     * If the user is found to be INACTIVE, we destroy the session immediately.
     */
    useEffect(() => {
        if (mounted && loggedinUser) {
            if (loggedinUser.status !== 'ACTIVE') {
                const forceLogout = async () => {
                    await authClient.signOut({
                        fetchOptions: {
                            onSuccess: () => {
                                // Clear local storage and redirect
                                localStorage.removeItem("loginIdentifier");
                                toast.error("Your account is deactivated. Please contact support.");
                                router.push("/auth/login?error=deactivated");
                                router.refresh(); // Clear Next.js server cache
                            }
                        }
                    });
                };
                forceLogout();
            }
        }
    }, [mounted, loggedinUser, router]);

    // Standard session check (Redirect if session naturally expires)
    useEffect(() => {
        if (mounted && !isPending && !session) {
            router.push("/auth/login");
        }
    }, [mounted, isPending, session, router]);

    if (!mounted || isPending) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <span className="loading loading-ring loading-lg text-primary"></span>
            </div>
        );
    }

    // Safety return if session is lost during logout transition
    if (!session || loggedinUser?.status !== 'ACTIVE') return null;

    const displayUser = loggedinUser || session.user;
    const loginIdentifier = typeof window !== "undefined" ? localStorage.getItem("loginIdentifier") : null;

    const getWorkspaceRoute = () => {
        const role = displayUser.role?.toLowerCase();
        if (role === 'admin') return '/dashboard/admin';
        if (role === 'customer') return '/dashboard/customer';
        return '/dashboard';
    };

    return (
        <div className="p-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Overview</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-base-content/60 italic">
                            Logged in as <span className="text-primary font-semibold lowercase">{displayUser.role}</span>
                        </span>
                        
                        <div className={`badge badge-sm gap-1 font-bold ${displayUser.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                            {displayUser.status === 'ACTIVE' ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                            {displayUser.status}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/auth/login") } })}
                    className="btn btn-ghost text-error btn-sm sm:btn-md gap-2 border border-base-300 rounded-xl hover:bg-error/10"
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
                            <InfoBox label="Full Name" value={displayUser.name || 'N/A'} icon={<UserIcon size={14}/>} />
                            <InfoBox label="Email Address" value={displayUser.email || 'N/A'} icon={<Mail size={14}/>} />
                            <InfoBox label="Phone Number" value={displayUser.phoneNumber || 'Not provided'} icon={<Phone size={14}/>} />
                            <InfoBox label="Login Method" value={loginIdentifier || 'Standard Auth'} icon={<ShieldCheck size={14}/>} />
                        </div>
                    </div>
                </div>

                {/* Welcome Card */}
                <div className="card bg-neutral text-neutral-content shadow-xl border-none rounded-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck size={100} />
                    </div>

                    <div className="card-body justify-center items-center text-center z-10">
                        <div className="avatar placeholder mb-4">
                            <div className="bg-primary flex items-center justify-center text-primary-content rounded-full w-20 h-20 shadow-lg ring-4 ring-primary/20">
                                <span className="text-3xl font-bold uppercase">{displayUser.name?.[0]}</span>
                            </div>
                        </div>
                        <h2 className="text-lg opacity-80 font-medium">Welcome back,</h2>
                        <b className="text-2xl font-black text-primary tracking-tight uppercase mb-4">
                            {displayUser.name?.split(' ')[0]}
                        </b>
                        
                        <button 
                            onClick={() => router.push(getWorkspaceRoute())} 
                            className="btn btn-primary btn-block shadow-lg rounded-xl h-12"
                        >
                            Enter {displayUser.role} Workspace
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
            <span className="text-[11px] font-bold text-base-content/40 flex items-center gap-2 uppercase tracking-widest group-hover:text-primary transition-colors">
                {icon} {label}
            </span>
            <span className="text-sm font-bold text-base-content/80 truncate">{value}</span>
        </div>
    );
}