
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    BookOpen,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    MoreVertical,
    FileText,
    Sparkles,
    Loader2,

    Plus,
    ArrowRight,
    Library as LibraryIcon,
    Trash2,
    Grid,
    List,
    ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Note {
    id: number;
    video_id: string;
    title: string;
    thumbnail: string;
    notes: string;
    created_at: string;
}

export default function Library() {
    const { token } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [synthesisResult, setSynthesisResult] = useState<string | null>(null);
    const [guideSearch, setGuideSearch] = useState("");

    useEffect(() => {
        if (token) fetchHistory();
    }, [token]);

    const fetchHistory = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setNotes(data);
        } catch (err) {
            toast.error("Failed to load library");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSynthesize = async () => {
        if (selectedIds.length < 2) {
            toast.error("Please select at least 2 notes to synthesize");
            return;
        }

        setIsSynthesizing(true);
        try {
            const res = await fetch("http://localhost:3001/api/synthesize-notes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ noteIds: selectedIds }),
            });
            const data = await res.json();

            if (data.masterGuide) {
                setSynthesisResult(data.masterGuide);
                navigator.clipboard.writeText(data.masterGuide);
                toast.success("Master Guide Generated & Copied to Clipboard!");
            }
        } catch (err) {
            toast.error("Synthesis failed");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );



    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground">
            <Sidebar />

            <main className="flex-1 lg:pl-[280px] relative">
                {/* Header Section */}
                <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto pl-14 pr-6 md:px-8 py-6 md:py-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1.5 mt-3 md:mt-0">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/60">
                                    {synthesisResult ? "Study Mode" : "Knowledge Library"}
                                </h1>
                                <div className="text-muted-foreground text-sm font-medium flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                    {synthesisResult ? (
                                        <span className="text-muted-foreground/80">
                                            Synthesized from <span className="text-primary font-bold">{selectedIds.length} notes</span>.
                                        </span>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-bold">
                                                    {notes.length} NOTES
                                                </span>
                                                <span>Manage your insights</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="relative group w-full max-w-[320px] mt-4 md:hidden">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder={synthesisResult ? "Find in guide..." : "Search insights..."}
                                        value={synthesisResult ? guideSearch : searchQuery}
                                        onChange={(e) => synthesisResult ? setGuideSearch(e.target.value) : setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 bg-secondary/50 border-white/10 focus:border-primary/50 focus:bg-secondary transition-all rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-3">
                                <div className="relative group w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder={synthesisResult ? "Find in guide..." : "Search insights..."}
                                        value={synthesisResult ? guideSearch : searchQuery}
                                        onChange={(e) => synthesisResult ? setGuideSearch(e.target.value) : setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 bg-secondary/50 border-white/10 focus:border-primary/50 focus:bg-secondary transition-all rounded-xl"
                                    />
                                </div>
                                {!synthesisResult && (
                                    <div className="hidden md:flex bg-secondary/50 rounded-lg p-1 border border-white/5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode('grid')}
                                            className={cn("h-8 w-8 p-0 rounded-md transition-all", viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <Grid className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode('list')}
                                            className={cn("h-8 w-8 p-0 rounded-md transition-all", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <List className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Synthesis Action Bar (Conditional) */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-500 ease-in-out",
                            selectedIds.length > 0 && !synthesisResult ? "max-h-20 opacity-100 mt-2 md:mt-6" : "max-h-0 opacity-0 mt-0"
                        )}>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 bg-transparent md:bg-primary/10 border-0 md:border md:border-primary/20 rounded-none md:rounded-xl p-0 md:p-3">
                                <span className="text-xs font-bold text-primary flex items-center gap-2 px-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {selectedIds.length} Selected
                                </span>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <Button size="sm" variant="ghost" className="h-8 text-xs hover:bg-white/5 hover:text-white px-2" onClick={() => setSelectedIds([])}>
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSynthesize}
                                        disabled={isSynthesizing || selectedIds.length < 2}
                                        className="h-8 text-xs font-bold gap-2 bg-primary text-black hover:bg-primary/90 flex-1 md:flex-none"
                                    >
                                        {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Synthesize
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Synthesis Result Display */}
                {synthesisResult ? (
                    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Sticky Header for Actions */}
                        <div className="sticky top-[88px] z-20 mb-2 py-2 bg-background/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between -mx-4 px-4 md:-mx-8 md:px-8 transition-all">
                            <Button
                                variant="ghost"
                                className="group gap-2 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10"
                                onClick={() => setSynthesisResult(null)}
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="font-semibold">Back to Library</span>
                                <span className="text-xs text-muted-foreground ml-2 border-l border-white/10 pl-3">
                                    {selectedIds.length} Notes Selected
                                </span>
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-white/5">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    AI Generated Master Guide
                                </div>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(synthesisResult || "");
                                        toast.success("Copied to Clipboard!");
                                    }}
                                    className="font-bold shadow-lg shadow-primary/20"
                                >
                                    Copy Guide
                                </Button>
                            </div>
                        </div>

                        {/* Document Container */}
                        <div className="bg-card/30 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:px-16 md:py-10 shadow-2xl min-h-[60vh]">
                            <article className="prose prose-invert max-w-none 
                                prose-headings:font-black prose-headings:tracking-tight 
                                prose-h1:text-4xl prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:bg-gradient-to-br prose-h1:from-white prose-h1:via-white/90 prose-h1:to-white/60 prose-h1:mb-8
                                prose-h2:text-2xl prose-h2:text-primary prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-primary/20 prose-h2:pb-4
                                prose-h3:text-xl prose-h3:text-foreground prose-h3:mt-8
                                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base
                                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                                prose-strong:text-foreground prose-strong:font-bold
                                prose-li:text-muted-foreground prose-li:marker:text-primary
                                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono
                                prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-6
                                [&>*:first-child]:mt-0">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => {
                                            if (!guideSearch) return <p>{children}</p>;
                                            // Basic highlighting for paragraph text nodes
                                            return (
                                                <p>
                                                    {Array.isArray(children) ? children.map((child, i) => {
                                                        if (typeof child === 'string') {
                                                            const parts = child.split(new RegExp(`(${guideSearch})`, 'gi'));
                                                            return parts.map((part, j) =>
                                                                part.toLowerCase() === guideSearch.toLowerCase() ?
                                                                    <span key={`${i}-${j}`} className="bg-primary/20 text-primary font-bold px-0.5 rounded">{part}</span> :
                                                                    part
                                                            );
                                                        }
                                                        return child;
                                                    }) : (typeof children === 'string' ?
                                                        children.split(new RegExp(`(${guideSearch})`, 'gi')).map((part, i) =>
                                                            part.toLowerCase() === guideSearch.toLowerCase() ?
                                                                <span key={i} className="bg-primary/20 text-primary font-bold px-0.5 rounded">{part}</span> :
                                                                part
                                                        ) : children
                                                    )}
                                                </p>
                                            )
                                        }
                                    }}
                                >
                                    {synthesisResult?.trim()}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </div>
                ) : (
                    /* Content Area */
                    <div className="max-w-7xl mx-auto px-6 pb-20 pt-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm font-medium tracking-wide animate-pulse">LOADING KNOWLEDGE...</p>
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-24 px-4">
                                <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                                    <LibraryIcon className="w-10 h-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Library is Empty</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mb-8">
                                    Videos you process will appear here. Start building your second brain today.
                                </p>
                                <Button className="rounded-xl px-8 font-bold" onClick={() => window.location.href = '/'}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Note
                                </Button>
                            </div>
                        ) : (
                            <div className={cn(
                                "grid gap-4 md:gap-6",
                                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" : "grid-cols-1"
                            )}>
                                {filteredNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={cn(
                                            "group relative bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-white/10",
                                            selectedIds.includes(note.id) && "ring-2 ring-primary border-primary bg-primary/5",
                                            // Base: List View (Mobile & Desktop List Mode)
                                            "flex items-center gap-3 p-2 h-auto",
                                            // Desktop Grid Mode Override
                                            viewMode === 'grid' && "md:block md:p-0 md:h-full"
                                        )}
                                        onClick={() => toggleSelection(note.id)}
                                    >
                                        {/* Thumbnail */}
                                        <div className={cn(
                                            "relative overflow-hidden shrink-0",
                                            // Base: List View Size
                                            "h-14 w-24 rounded-md",
                                            // Desktop Grid Override
                                            viewMode === 'grid' && "md:aspect-video md:w-full md:h-auto md:rounded-none"
                                        )}>
                                            <img
                                                src={note.thumbnail}
                                                alt={note.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                                            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedIds.includes(note.id)}
                                                    onCheckedChange={() => toggleSelection(note.id)}
                                                    className="w-5 h-5 rounded border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-lg"
                                                />
                                            </div>

                                            {viewMode === 'grid' && (
                                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(note.created_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className={cn(
                                            "flex flex-col justify-between min-w-0",
                                            // Base: List View Spacing
                                            "flex-1 py-1 pr-10",
                                            // Desktop Grid Override
                                            viewMode === 'grid' && "md:p-3 md:pr-3 md:space-y-2"
                                        )}>
                                            <div>
                                                <h3 className={cn(
                                                    "font-bold text-foreground leading-snug group-hover:text-primary transition-colors",
                                                    // Base: List View Text
                                                    "line-clamp-2 text-sm mb-1.5",
                                                    // Desktop Grid Override
                                                    viewMode === 'grid' && "md:line-clamp-2 md:text-base md:mb-0 md:min-h-[3rem]"
                                                )}>
                                                    {note.title}
                                                </h3>
                                                {/* Mobile Metadata (Always show in list view style on mobile) */}
                                                <div className={cn(
                                                    "flex items-center gap-3 text-[10px] text-muted-foreground/60 font-medium",
                                                    viewMode === 'grid' && "md:hidden"
                                                )}>
                                                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {note.notes.length > 5000 ? 'Deep Study' : 'Quick Guide'}</span>
                                                </div>
                                            </div>

                                            <div className={cn("hidden lg:flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity", viewMode === 'list' && "lg:hidden")}>
                                                {/* List mode actions handled by main click mostly, keeping separate buttons minimal */}
                                            </div>

                                            {viewMode === 'grid' && (
                                                <div className="flex items-center justify-between absolute top-2 right-2 border-none p-0 w-auto md:static md:w-full md:pt-4 md:border-t md:border-white/5 z-10">
                                                    <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {note.notes.length > 5000 ? 'Deep Study' : 'Quick Guide'}
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10 hover:text-white" onClick={(e) => e.stopPropagation()}>
                                                                <MoreVertical className="w-3 h-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 bg-card border-white/10 backdrop-blur-xl">
                                                            <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={(e) => { e.stopPropagation(); window.location.href = `/?video=${note.video_id}`; }}>
                                                                View Note
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-xs font-medium text-red-400 focus:text-red-400 cursor-pointer" onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm("Delete this note?")) {
                                                                    try {
                                                                        await fetch(`http://localhost:3001/api/history/${note.id}`, {
                                                                            method: 'DELETE',
                                                                            headers: { "Authorization": `Bearer ${token}` }
                                                                        });
                                                                        setNotes(prev => prev.filter(n => n.id !== note.id));
                                                                        toast.success("Note deleted");
                                                                    } catch (err) {
                                                                        toast.error("Failed to delete");
                                                                    }
                                                                }
                                                            }}>
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
