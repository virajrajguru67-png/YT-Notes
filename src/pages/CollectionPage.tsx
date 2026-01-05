import { Sidebar } from "@/components/Sidebar";
import { useParams, Link } from "react-router-dom";
import { useCollections } from "@/hooks/useCollections";
import { FolderOpen, BookOpen, Clock, PlayCircle, MoreVertical, Trash2, ArrowLeft, RefreshCw, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function CollectionPage() {
    const { id } = useParams();
    const { collections, isLoading, fetchCollections } = useCollections();
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const collection = collections.find(c => c.id === Number(id));

    const handleSynthesize = async () => {
        if (!collection?.items?.length) return;
        setIsSynthesizing(true);
        try {
            const noteIds = collection.items.map((n: any) => n.id);
            const res = await fetch('http://127.0.0.1:3001/api/synthesize-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ noteIds })
            });
            const data = await res.json();
            if (data.masterGuide) {
                toast.success("Master Guide Generated!");
                // You would navigate to a display page or show it here
            }
        } catch (e) {
            toast.error("Synthesis failed");
        } finally {
            setIsSynthesizing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
            <Sidebar />

            <main className="lg:pl-[280px] min-h-screen flex flex-col">
                <header className="px-6 pb-6 pt-20 md:p-10 border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <Link to="/library" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-4">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Library
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex flex-col md:flex-row md:items-center gap-4">
                                    {isLoading ? <Skeleton className="h-10 w-64" /> : (collection?.name || "Collection")}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                                    A curated sequence of learning modules organized by you.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleSynthesize}
                                    disabled={isSynthesizing || !collection?.items?.length}
                                    className="h-12 px-8 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 text-white font-black text-xs uppercase tracking-widest gap-2.5 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isSynthesizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Synthesize Master Guide
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 bg-slate-50/50 dark:bg-black/20">
                    <div className="max-w-7xl mx-auto">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map(n => <Skeleton key={n} className="h-48 rounded-[32px]" />)}
                            </div>
                        ) : !collection?.items?.length ? (
                            <div className="p-20 text-center glass-card rounded-[40px] border-dashed border-slate-200 dark:border-white/10">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="w-10 h-10 text-slate-300" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">No videos in this course</h4>
                                <p className="text-slate-500 font-medium">Add notes from your library or dashboard to begin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                                {collection.items.map((notesItem: any, idx: number) => (
                                    <div
                                        key={notesItem.id}
                                        className="group glass-card rounded-[32px] overflow-hidden hover:bg-white dark:hover:bg-slate-900/60 transition-all duration-500 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] cursor-pointer"
                                        onClick={() => {
                                            window.location.href = `/?id=${notesItem.id}`;
                                        }}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-xl bg-primary/90 text-white flex items-center justify-center font-black text-xs shadow-lg">
                                                {idx + 1}
                                            </div>
                                            <img
                                                src={notesItem.thumbnail}
                                                alt={notesItem.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-500" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PlayCircle className="w-12 h-12 text-white fill-white shadow-xl" />
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-3">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {notesItem.title}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Module {idx + 1}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
