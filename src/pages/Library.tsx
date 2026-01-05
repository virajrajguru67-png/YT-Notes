import { Sidebar } from "@/components/Sidebar";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { useCollections } from "@/hooks/useCollections";
import { BookOpen, Clock, FileText, Search, Trash2, FolderOpen, PlayCircle, MoreVertical } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function Library() {
    const { history, deleteNote, isLoading } = useNotesHistory();
    const { collections, deleteCollection } = useCollections();
    const [searchTerm, setSearchTerm] = useState("");
    const { isAuthenticated } = useAuth();

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
            <Helmet>
                <title>Library | Knowledge Maps</title>
            </Helmet>

            <Sidebar />

            <main className="lg:pl-[280px] min-h-screen flex flex-col">
                <header className="px-6 pb-6 pt-20 md:p-10 border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                                    Knowledge Maps
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{history.length} Saved</span>
                                    </div>
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                                    Your personal universe of video metadata and AI-structured wisdom.
                                </p>
                            </div>

                            <div className="relative w-full md:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search your notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 bg-slate-50/50 dark:bg-black/20">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {/* Collections Grid */}
                        {collections.length > 0 && (
                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <FolderOpen className="w-4 h-4" />
                                    Active Courses
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {collections.map(collection => (
                                        <Link
                                            key={collection.id}
                                            to={`/collections/${collection.id}`}
                                            className="glass-card p-6 rounded-[32px] group hover:bg-white dark:hover:bg-slate-900/60 transition-all duration-500 shadow-xl shadow-black/5 border-none relative overflow-hidden active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">
                                                        {collection.name}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {collection.items.length || 0} Modules Loaded
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/40 rounded-full" style={{ width: '40%' }} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Notes History List */}
                        <section className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <FileText className="w-4 h-4" />
                                All Generated Notes
                            </h3>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="h-48 rounded-[32px] bg-white/40 animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="p-20 text-center glass-card rounded-[40px] border-dashed border-slate-200 dark:border-white/10">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">No notes found</h4>
                                    <p className="text-slate-500 font-medium">Try processing a new video on the dashboard.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                    {filteredHistory.map((notesItem) => (
                                        <div
                                            key={notesItem.id}
                                            className="group glass-card rounded-[32px] overflow-hidden hover:bg-white dark:hover:bg-slate-900/60 transition-all duration-500 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] cursor-pointer"
                                            onClick={() => {
                                                // Handle selection logic, navigate back to index with state
                                                window.location.href = `/?id=${notesItem.id}`;
                                            }}
                                        >
                                            <div className="aspect-video relative overflow-hidden">
                                                <img
                                                    src={notesItem.thumbnail}
                                                    alt={notesItem.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-500" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlayCircle className="w-12 h-12 text-white fill-white shadow-xl" />
                                                </div>
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-destructive hover:text-white transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNote(notesItem.id);
                                                            toast.success("Note deleted");
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-3">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                    {notesItem.title}
                                                </h4>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(notesItem.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
