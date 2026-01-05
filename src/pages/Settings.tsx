import { Sidebar } from "@/components/Sidebar";
import { User, Shield, Bell, Moon, Globe, Trash2, Save, Sparkles, Key } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Settings() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.username || "");
    const [aiTone, setAiTone] = useState("Educational");

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
            <Sidebar />

            <main className="lg:pl-[280px] min-h-screen flex flex-col font-sans">
                <header className="px-6 pb-6 pt-20 md:p-10 border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex flex-col md:flex-row items-start md:items-center gap-4">
                            System Preferences
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                            Configure your AI learning environment and account security.
                        </p>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 bg-slate-50/50 dark:bg-black/20">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Profile Section */}
                        <section className="glass-card p-8 rounded-[40px] shadow-2xl shadow-black/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-none space-y-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <User className="w-4 h-4" />
                                Personal Identity
                            </h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Learning Alias</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-12 rounded-2xl bg-slate-100/50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Email</label>
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="h-12 rounded-2xl bg-slate-100/30 dark:bg-white/5 border-none opacity-60 font-medium"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Theme Section */}
                        <section className="glass-card p-8 rounded-[40px] shadow-2xl shadow-black/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-none flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <Moon className="w-4 h-4" />
                                    Visual Experience
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Switch between deep dark and glass light themes.</p>
                            </div>
                            <ThemeToggle />
                        </section>

                        {/* AI Section */}
                        <section className="glass-card p-8 rounded-[40px] shadow-2xl shadow-black/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-none space-y-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Sparkles className="w-4 h-4" />
                                AI Tutor Personality
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {["Educational", "Professional", "Simplified", "Humorous"].map(tone => (
                                    <button
                                        key={tone}
                                        onClick={() => setAiTone(tone)}
                                        className={`p-4 rounded-[24px] border-2 transition-all duration-300 font-black text-xs uppercase tracking-widest ${aiTone === tone ? 'border-primary bg-primary/5 text-primary scale-105 shadow-xl shadow-primary/10' : 'border-transparent bg-slate-100/50 dark:bg-white/5 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="p-8 rounded-[40px] border-2 border-dashed border-destructive/20 bg-destructive/5 space-y-6">
                            <h3 className="text-xs font-black text-destructive uppercase tracking-[0.2em] flex items-center gap-3">
                                <Shield className="w-4 h-4" />
                                Danger Territory
                            </h3>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <p className="text-xs text-destructive/70 font-medium max-w-sm">
                                    Permanently erase all your generated notes, courses, and account metadata. This action is irreversible.
                                </p>
                                <Button variant="destructive" className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-destructive/20 transition-all hover:scale-105 active:scale-95">
                                    <Trash2 className="w-4 h-4" />
                                    Purge Data
                                </Button>
                            </div>
                        </section>

                        <div className="pt-10 pb-20 flex justify-end">
                            <Button className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-[0.15em] shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 gap-3">
                                <Save className="w-5 h-5" />
                                Save Preferences
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
