"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, Phone, ShieldCheck, Activity, Zap, Users, LayoutDashboard, CircleUser} from "lucide-react";

import { createColumnHelper, PaginationState, SortingState } from "@tanstack/react-table";
import { CustomerService } from "@/types/customerService";
import { DataTable } from "@/app/components/common/DataTable";
import { useQuery } from "@tanstack/react-query";

// 🔑 FIXED TYPES
interface DashboardStats {
    activeServices: number;
    totalUsers: number;
    systemHealth: string;
}

export default function DashboardComponent() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        activeServices: 0,
        totalUsers: 0,
        systemHealth: "99.9%"
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
    const [globalFilter, setGlobalFilter] = useState('');

    const selectedMonth = new Date().toISOString().slice(0, 7);

    useEffect(() => {
        setMounted(true);
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                const data = await res.json();
                if (res.ok) setStats(data);
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

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['monthly-bills', selectedMonth, pagination.pageIndex, pagination.pageSize, globalFilter, sorting],
        queryFn: async () => {
            const sortId = sorting[0]?.id || 'createdAt';
            const sortDir = sorting[0]?.desc ? 'desc' : 'asc';
            const params = new URLSearchParams({
                page: (pagination.pageIndex + 1).toString(),
                pageSize: pagination.pageSize.toString(),
                search: globalFilter, 
                sortId,
                sortDir
            });
            const response = await fetch(`/api/bills/monthly?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch billing data');
            return await response.json();
        },
        enabled: mounted && !!session
    });
    
    if (!mounted || isPending) return (
        <div className="flex h-[80vh] items-center justify-center">
            <span className="loading loading-ring loading-lg text-primary"></span>
        </div>
    );

    if (!session) {
        router.push("/auth/login");
        return null;
    }

    const customerServices = data?.data || [];
    const totalCount = data?.meta?.totalCount || 0;
    const columnHelper = createColumnHelper<CustomerService>();

    const columns = [
        columnHelper.accessor('customer', {
            header: 'Customer',
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <div className="avatar">
                        <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center overflow-hidden">
                            {info.getValue()?.photo ? (
                                <img src={info.getValue()?.photo} alt="" className="object-cover w-full h-full" />
                            ) : ( <User size={20} /> )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{info.getValue()?.name}</span>
                        <span className="text-[10px] opacity-60 uppercase">{info.getValue()?.customerCode}</span>
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('mmc', {
            header: 'Bill Amount',
            cell: (info) => (
                <div className="font-mono font-bold">
                    {Number(info.getValue()).toLocaleString()} <span className="text-[10px]">BDT</span>
                </div>
            ),
        }),
        columnHelper.display({
            id: 'status',
            header: 'Status',
            cell: (info) => {
                const totalPaid = (info.row.original.bills || []).reduce((sum, b) => sum + Number(b.paidAmount), 0);
                const isFullyPaid = totalPaid >= Number(info.row.original.mmc);
                return (
                    <div className={`badge ${isFullyPaid ? 'badge-success' : 'badge-error'} gap-2 font-bold text-[10px]`}>
                        {isFullyPaid ? 'PAID' : 'UNPAID'}
                    </div>
                );
            }
        })
    ];

    const formatMonth = (monthStr: string) => {
        if (!monthStr) return "";
        const date = new Date(`${monthStr}-02`); 
        return new Intl.DateTimeFormat('en-US', {
            month: 'long', year: 'numeric',
        }).format(date);
    };

    return (
        <div className="max-w-full mx-auto space-y-8 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-300 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary text-primary-content rounded-2xl shadow-lg shadow-primary/20">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Admin Console</h1>
                        <p className="text-base-content/60 flex items-center gap-2 text-sm">
                            Welcome, <span className="font-bold text-base-content">{session.user.name}</span>
                            <span className="badge badge-primary badge-sm font-bold uppercase">{session.user.role}</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* --- STATS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Services" value={stats.activeServices} isLoading={statsLoading} icon={<Zap size={20} />} color="text-yellow-500 bg-yellow-500/10" />
                <StatCard title="Total Customers" value={stats.totalUsers} isLoading={statsLoading} icon={<Users size={20} />} color="text-blue-500 bg-blue-500/10" />
                <StatCard title="System Health" value={stats.systemHealth} isLoading={false} icon={<Activity size={20} />} color="text-green-500 bg-green-500/10" />
                <StatCard title="Security Level" value="Tier 3" isLoading={false} icon={<ShieldCheck size={20} />} color="text-purple-500 bg-purple-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 🔑 FIXED: Account Info (DataTable REMOVED FROM HERE) */}
                <div className="lg:col-span-2 card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-base-300 bg-base-200/30">
                        <h2 className="card-title text-xl font-bold flex items-center gap-2">
                            <CircleUser className="text-primary" /> Profile Credentials
                        </h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InfoBox label="Full Name" value={session.user.name} icon={<User size={16}/>} />
                        <InfoBox label="Email Address" value={session.user.email} icon={<Mail size={16}/>} />
                        <InfoBox label="Phone Number" value={session.user.phoneNumber || 'Not linked'} icon={<Phone size={16}/>} />
                        <InfoBox label="Role" value={session.user.role} icon={<ShieldCheck size={16}/>} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="card bg-neutral text-neutral-content shadow-xl overflow-hidden h-fit">
                    <div className="card-body">
                        <h2 className="card-title italic font-black text-2xl tracking-tighter">Micro Datasoft PRO</h2>
                        <progress className="progress progress-primary w-full mt-4" value="14" max="100"></progress>
                        <p className="text-xs opacity-50 mt-2">Server Load: 14%</p>
                    </div>
                </div>
            </div>

            <div className="divider my-0 opacity-80 mb-1.5"></div>

            {/* 🔑 FIXED: DataTable moved to its own section for proper width */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold px-1">Billing Overview for <b className="text-info">{formatMonth(selectedMonth)}</b></h2>
                <DataTable 
                    data={customerServices} 
                    columns={columns} 
                    totalCount={totalCount} 
                    isLoading={isLoading} 
                    isFetching={isFetching} 
                    pagination={pagination}
                    onPaginationChange={setPagination} 
                    sorting={sorting} 
                    onSortingChange={setSorting}
                    globalFilter={globalFilter}
                    onGlobalFilterChange={setGlobalFilter}
                />
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS WITH PROPER TYPES ---

function StatCard({ title, value, icon, color, isLoading }: { title: string, value: any, icon: any, color: string, isLoading: boolean }) {
    return (
        <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all group">
            <div className="card-body p-5 flex-row items-center gap-4">
                <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
                <div>
                    <p className="text-[10px] uppercase font-black text-base-content/40 tracking-widest">{title}</p>
                    {isLoading ? <div className="h-7 w-16 bg-base-300 animate-pulse rounded mt-1" /> : <p className="text-2xl font-black">{value}</p>}
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1 text-primary/60">{icon}</div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-bold text-base-content/80">{value}</span>
            </div>
        </div>
    );
}