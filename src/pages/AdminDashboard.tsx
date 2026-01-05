import { Sidebar } from "@/components/Sidebar";
import { Shield, Users, FileText, Database, Activity, AlertTriangle, CheckCircle, Search, RefreshCw, Trash2, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState({ users: 0, notes: 0, storage: "0MB" });
    const [recentLogs, setRecentLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans selection:bg-primary/20 relative">
            <Sidebar />

            <main className="lg:pl-[280px] min-h-screen flex flex-col font-sans">
                <header className="px-6 pb-6 pt-20 md:p-10 border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                                Admin Command Center
                                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse w-fit">
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Control</span>
                                </div>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                                System-wide diagnostics and user management for Genius AI.
                            </p>
                        </div>
                        <Button className="h-12 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest gap-2.5 hover:bg-slate-50 transition-all">
                            <Activity className="w-4 h-4 text-primary" />
                            System Audit
                        </Button>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: "Total Scholars", value: "2.4k", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { label: "Knowledge Maps", value: "18.2k", icon: FileText, color: "text-primary", bg: "bg-primary/10" },
                                { label: "Vector Storage", value: "4.8GB", icon: Database, color: "text-emerald-500", bg: "bg-emerald-500/10" }
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-10 rounded-[40px] border-none shadow-xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl space-y-6">
                                    <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                                        <stat.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Table */}
                        <section className="glass-card rounded-[40px] border-none shadow-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Activity className="w-4 h-4" />
                                    Security & Activity Logs
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input placeholder="Filter logs..." className="pl-9 h-10 w-48 rounded-xl bg-slate-100/50 dark:bg-white/5 border-none text-xs font-bold" />
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-black/20">
                                            {["Event", "User", "Status", "Timestamp", ""].map(header => (
                                                <th key={header} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {[1, 2, 3, 4, 5].map((item) => (
                                            <tr key={item} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Note Generation</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-medium text-slate-500">scholar_{item * 123}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Success</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-xs text-slate-400 font-medium">2 mins ago</td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
