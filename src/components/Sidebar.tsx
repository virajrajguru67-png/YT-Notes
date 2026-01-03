import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { History, Home, Menu, Settings as SettingsIcon, Video, LogOut, Youtube, Sparkles, Trash2, MoreVertical, Library as LibraryIcon, Shield } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { useCollections, Collection } from "@/hooks/useCollections";
import { FolderPlus, BookOpen, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onHistorySelect?: (item: any) => void;
    refreshTrigger?: number;
    onNewNote?: () => void;
}

export function Sidebar({ className, onHistorySelect, refreshTrigger, onNewNote }: SidebarProps) {
    const [open, setOpen] = useState(false);
    const { history, fetchHistory, clearHistory, deleteNote } = useNotesHistory();
    const { collections, fetchCollections, createCollection, addToCollection, deleteCollection } = useCollections();
    const [newCourseName, setNewCourseName] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { user, logout, isAuthenticated, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory();
            fetchCollections();
        }
    }, [refreshTrigger, isAuthenticated]);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCourseName.trim()) {
            await createCollection(newCourseName);
            setNewCourseName("");
            setIsCreateDialogOpen(false);
        }
    };

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl">
            {/* Logo Section */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate("/")}>
                    <div className="p-1.5 bg-gradient-to-br from-primary to-emerald-600 rounded-lg shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
                        <Youtube className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-black tracking-tighter text-slate-900 dark:text-white">
                            NoteTube<span className="text-primary italic">.</span>
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 -mt-0.5">
                            Genius AI
                        </span>
                    </div>
                </div>
                <div className="hidden lg:block">
                    <ThemeToggle />
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                    {/* Main Nav */}
                    <div className="space-y-1">
                        <Button
                            variant={location.pathname === "/" ? "secondary" : "ghost"}
                            className={`w-full justify-start gap-3 h-10 px-4 rounded-xl transition-all duration-300 ${location.pathname === "/" ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                            asChild
                            onClick={() => {
                                onNewNote?.();
                                setOpen(false);
                            }}
                        >
                            <Link to="/">
                                <Home className="h-4 w-4" />
                                <span className="font-bold text-xs">Dashboard</span>
                            </Link>
                        </Button>
                        <Button
                            variant={location.pathname === "/library" ? "secondary" : "ghost"}
                            className={`w-full justify-start gap-3 h-10 px-4 rounded-xl transition-all duration-300 ${location.pathname === "/library" ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                            asChild
                            onClick={() => setOpen(false)}
                        >
                            <Link to="/library">
                                <LibraryIcon className="h-4 w-4" />
                                <span className="font-bold text-xs">Knowledge Maps</span>
                            </Link>
                        </Button>
                        {isAdmin && (
                            <Button
                                variant={location.pathname === "/admin" ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 h-10 px-4 rounded-xl transition-all duration-300 ${location.pathname === "/admin" ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                                asChild
                                onClick={() => setOpen(false)}
                            >
                                <Link to="/admin">
                                    <Shield className="h-4 w-4" />
                                    <span className="font-bold text-xs">Admin HQ</span>
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* History Section */}
                    <div className="space-y-4">
                        <div className="px-5 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" />
                                Recent Activity
                            </h3>
                            {history.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-3 text-[10px] font-bold text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                    onClick={() => {
                                        if (confirm("Clear all notes?")) {
                                            clearHistory();
                                            toast.success("History cleared");
                                        }
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2 px-2">
                            {history.length === 0 ? (
                                <div className="p-8 text-center bg-slate-100/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                    <History className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-3 opacity-50" />
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Empty History</p>
                                </div>
                            ) : (
                                history.map((item: any) => (
                                    <ContextMenu key={item.id}>
                                        <ContextMenuTrigger>
                                            <TooltipProvider delayDuration={300}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            to="/"
                                                            state={{ selectedNote: item }}
                                                            onClick={(e) => {
                                                                if (onHistorySelect) {
                                                                    e.preventDefault();
                                                                    onHistorySelect(item);
                                                                }
                                                                setOpen(false);
                                                            }}
                                                            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all duration-300 hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-black/5 group border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                                                        >
                                                            <div className="shrink-0 relative">
                                                                <img
                                                                    src={item.thumbnail}
                                                                    alt={item.title}
                                                                    className="h-9 w-14 rounded-lg object-cover shadow-sm bg-slate-200 dark:bg-slate-800 transition-transform duration-500 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                                    <Video className="w-3 h-3 text-white drop-shadow-md" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors leading-tight mb-0.5 truncate">
                                                                    {item.title}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-wider">
                                                                    {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="bg-slate-900 border-white/10 text-white font-medium text-xs max-w-[200px]">
                                                        {item.title}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48 rounded-xl p-1 bg-black/90 backdrop-blur-xl border-white/10 shadow-2xl">
                                            <ContextMenuItem className="flex items-center gap-2 text-xs font-medium p-2 rounded-lg cursor-pointer">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                Add to Course...
                                            </ContextMenuItem>
                                            <div className="pl-4 space-y-1">
                                                <ContextMenuItem
                                                    className="text-[10px] p-1.5 rounded-md cursor-pointer hover:bg-primary/20 text-primary font-bold flex items-center gap-1.5"
                                                    onClick={() => setIsCreateDialogOpen(true)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Create New...
                                                </ContextMenuItem>
                                                {collections.map(c => (
                                                    <ContextMenuItem
                                                        key={c.id}
                                                        className="text-[10px] p-1.5 rounded-md cursor-pointer hover:bg-primary/20"
                                                        onClick={() => addToCollection(c.id, item.id)}
                                                    >
                                                        {c.name}
                                                    </ContextMenuItem>
                                                ))}
                                            </div>
                                            <div className="h-px bg-white/10 my-1" />
                                            <ContextMenuItem
                                                className="flex items-center gap-2 text-xs font-medium p-2 rounded-lg focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                onClick={() => {
                                                    deleteNote(item.id);
                                                    toast.success("Note deleted");
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete Note
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="mt-auto p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                    <div className="group flex items-center gap-2.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white dark:hover:bg-white/5 cursor-default relative overflow-hidden border border-transparent hover:border-slate-100 dark:hover:border-white/10 shadow-sm hover:shadow-xl hover:shadow-black/5">
                        <div className="relative">
                            <Avatar className="h-9 w-9 rounded-xl border-2 border-white dark:border-slate-800 shadow-xl">
                                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-emerald-500/20 text-primary font-black text-[10px] uppercase rounded-xl">
                                    {user?.username?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "UN"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg"></div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors tracking-tight leading-tight">
                                    {user?.username || "Guest Learner"}
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight">
                                PRO ACCOUNT
                            </p>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-10 sm:group-hover:opacity-100 transition-all">
                            <div className="lg:hidden mr-1">
                                <ThemeToggle />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95"
                                asChild
                                onClick={() => setOpen(false)}
                            >
                                <Link to="/settings">
                                    <SettingsIcon className="h-3.5 w-3.5 text-slate-500" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                                onClick={() => {
                                    logout();
                                    toast.info("Logged out successfully");
                                }}
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed left-4 top-4 z-40 bg-background/80 backdrop-blur-sm border border-border overflow-hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            <div className={cn("hidden lg:block w-[280px] h-screen fixed left-0 top-0 border-r bg-muted/40 z-40", className)}>
                <SidebarContent />
            </div>
        </>
    );
}
