import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { useAuth } from "@/contexts/AuthContext";
import {
    Trash2, Monitor, Moon, Sun, Info, ArrowLeft,
    User, Settings2, ShieldCheck, Sparkles,
    Languages, FileText, Download, Loader2,
    LogOut as LogOutIcon, Pencil, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import axios from "axios";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Eye } from "lucide-react";

const Settings = () => {
    const { clearHistory } = useNotesHistory();
    const { theme, setTheme } = useTheme();
    const { user, updateUser, token, logout } = useAuth();

    // Profile State
    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

    // AI Preferences
    const [detailLevel, setDetailLevel] = useState(user?.ai_detail_level || "detailed");
    const [tone, setTone] = useState(user?.ai_tone || "educational");
    const [language, setLanguage] = useState(user?.ai_language || "en");

    // Sync form with user context when it updates
    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            setDetailLevel(user.ai_detail_level || "detailed");
            setTone(user.ai_tone || "educational");
            setLanguage(user.ai_language || "en");
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const response = await axios.post("/api/update-user",
                {
                    username,
                    email,
                    avatar_url: user?.avatar_url,
                    password: password || undefined,
                    ai_tone: tone,
                    ai_detail_level: detailLevel,
                    ai_language: language
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data && response.data.user) {
                updateUser(response.data.user);
                toast.success("Profile updated successfully");
                setPassword(""); // Clear password field
                setIsEditing(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        setUsername(user?.username || "");
        setEmail(user?.email || "");
        setPassword("");
        setIsEditing(false);
    };

    return (
        <>
            <Helmet>
                <title>Settings - NoteTube</title>
            </Helmet>

            <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
                <Sidebar />
                <AvatarUploadDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} canEdit={isEditing} />

                <div className="fixed top-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                <main className="lg:pl-[280px]">
                    <div className="container py-8 lg:py-12 max-w-4xl mx-auto space-y-8 animate-fade-in">

                        <div className="flex items-center gap-4 mb-4">
                            <Link to="/">
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                                <p className="text-sm text-muted-foreground mt-1">Manage your account and app preferences</p>
                            </div>
                        </div>

                        <Tabs defaultValue="account" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="account" className="rounded-lg gap-2">
                                    <User className="w-4 h-4" /> Account
                                </TabsTrigger>
                                <TabsTrigger value="preferences" className="rounded-lg gap-2">
                                    <Settings2 className="w-4 h-4" /> Preferences
                                </TabsTrigger>
                                <TabsTrigger value="about" className="rounded-lg gap-2">
                                    <Info className="w-4 h-4" /> About
                                </TabsTrigger>
                            </TabsList>

                            {/* Account Tab */}
                            <TabsContent value="account" className="space-y-6">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                            Profile Information
                                        </h2>
                                        {!isEditing && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                                className="gap-2 text-muted-foreground hover:text-primary rounded-xl"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit Profile
                                            </Button>
                                        )}
                                    </div>
                                    <div className="glass-card p-6 rounded-2xl space-y-6 transition-all duration-300">
                                        <div className="flex flex-col items-center gap-6 py-4">
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsUploadDialogOpen(true)}
                                                    className={`relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted/50 flex items-center justify-center transition-all ${isEditing ? 'active:scale-95 ring-4 ring-primary/10' : (user?.avatar_url ? 'hover:scale-105 active:scale-95' : 'cursor-default opacity-80')}`}
                                                >
                                                    <Avatar className="w-full h-full">
                                                        <AvatarImage src={user?.avatar_url} />
                                                        <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground/50 uppercase">
                                                            {user?.username?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "UN"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {(isEditing || user?.avatar_url) && (
                                                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                            {isEditing ? <Upload className="w-6 h-6 text-white" /> : <Eye className="w-6 h-6 text-white" />}
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                            {isEditing ? (
                                                <p className="text-xs text-primary uppercase tracking-widest font-bold animate-pulse">Click to manage photo</p>
                                            ) : (
                                                user?.avatar_url ? (
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">Click to view photo</p>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-30">No profile photo</p>
                                                )
                                            )}
                                        </div>

                                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="username" className="text-muted-foreground/70">Username</Label>
                                                    <Input
                                                        id="username"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        disabled={!isEditing}
                                                        className={`bg-black/20 transition-all duration-300 ${!isEditing ? 'border-transparent bg-transparent pl-0 text-foreground font-semibold text-lg' : 'border-border'}`}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-muted-foreground/70">Email Address</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        disabled={!isEditing}
                                                        className={`bg-black/20 transition-all duration-300 ${!isEditing ? 'border-transparent bg-transparent pl-0 text-foreground font-semibold text-lg' : 'border-border'}`}
                                                    />
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="bg-black/20"
                                                    />
                                                </div>
                                            )}

                                            {isEditing && (
                                                <div className="flex items-center gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <Button type="submit" disabled={isUpdating} className="px-8 rounded-xl transition-all active:scale-95">
                                                        {isUpdating ? (
                                                            <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating... </>
                                                        ) : "Save Changes"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={handleCancel}
                                                        className="px-6 rounded-xl gap-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2 text-destructive">
                                        <LogOutIcon className="h-5 w-5" />
                                        Session
                                    </h2>
                                    <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-destructive/20 bg-destructive/5">
                                        <div className="space-y-1">
                                            <p className="font-medium">Logout from device</p>
                                            <p className="text-sm text-muted-foreground">Sign out of your current session on this browser.</p>
                                        </div>
                                        <Button variant="destructive" onClick={logout} className="rounded-xl">
                                            Sign Out
                                        </Button>
                                    </div>
                                </section>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent value="preferences" className="space-y-6">
                                <section className="space-y-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-yellow-500" />
                                        AI Output Preferences
                                    </h2>
                                    <div className="glass-card p-6 rounded-2xl space-y-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-medium">Summary Detail</p>
                                                    <p className="text-sm text-muted-foreground">How comprehensive should the generated notes be?</p>
                                                </div>
                                                <div className="flex bg-muted p-1 rounded-lg">
                                                    {['concise', 'balanced', 'detailed'].map((level) => (
                                                        <button
                                                            key={level}
                                                            onClick={() => setDetailLevel(level)}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize
                                                                ${detailLevel === level ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            {level}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-medium">Tone of Voice</p>
                                                    <p className="text-sm text-muted-foreground">The style and personality of the AI tutor.</p>
                                                </div>
                                                <div className="flex bg-muted p-1 rounded-lg">
                                                    {['educational', 'casual', 'technical'].map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setTone(t)}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize
                                                                ${tone === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-medium">Output Language</p>
                                                    <p className="text-sm text-muted-foreground">The language AI will use for notes and chat.</p>
                                                </div>
                                                <div className="flex bg-muted p-1 rounded-lg">
                                                    {[
                                                        { val: 'en', label: 'English' },
                                                        { val: 'hi', label: 'Hindi' }
                                                    ].map((l) => (
                                                        <button
                                                            key={l.val}
                                                            onClick={() => setLanguage(l.val)}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                                                ${language === l.val ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            {l.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-4 flex justify-end">
                                                <Button
                                                    onClick={handleUpdateProfile}
                                                    disabled={isUpdating}
                                                    className="rounded-xl px-8"
                                                >
                                                    {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Preferences"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Monitor className="h-5 w-5 text-primary" />
                                        Interface Appearance
                                    </h2>
                                    <div className="glass-card p-6 rounded-2xl space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium">Theme Mode</p>
                                                <p className="text-sm text-muted-foreground">Customize how NoteTube looks on your device.</p>
                                            </div>
                                            <div className="flex bg-muted p-1 rounded-lg">
                                                <button onClick={() => setTheme("light")} className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                                    <Sun className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setTheme("dark")} className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                                    <Moon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setTheme("system")} className={`p-2 rounded-md transition-all ${theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                                    <Monitor className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2 text-destructive">
                                        <Trash2 className="h-5 w-5" />
                                        Data Management
                                    </h2>
                                    <div className="glass-card p-6 rounded-2xl border-destructive/20 bg-destructive/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium text-destructive">Clear History</p>
                                                <p className="text-sm text-muted-foreground">This will permanently delete ALL your saved notes and history.</p>
                                            </div>
                                            <Button variant="destructive" className="rounded-xl px-6" onClick={() => {
                                                if (confirm("Are you sure? This action is irreversible.")) clearHistory();
                                            }}>
                                                Delete All Data
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            {/* About Tab */}
                            <TabsContent value="about" className="space-y-6">
                                <section className="space-y-4">
                                    <div className="glass-card p-8 rounded-3xl text-center space-y-6 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50"></div>
                                        <div className="w-20 h-20 bg-primary/10 rounded-3xl border border-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <Sparkles className="w-10 h-10 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">NoteTube AI</h3>
                                            <p className="text-sm text-muted-foreground mt-2">Version 1.2.0 "Lumina"</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                                            NoteTube transforms any YouTube video into your personal study repository using state-of-the-art Large Language Models.
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <Button variant="outline" size="sm" className="rounded-xl h-9 px-4">
                                                Docs
                                            </Button>
                                            <Button variant="outline" size="sm" className="rounded-xl h-9 px-4">
                                                Support
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Settings;
