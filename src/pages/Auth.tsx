import { useState, useEffect } from "react";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Youtube, Loader2, Mail, Lock, User, Sparkles, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const from = (location.state as any)?.from?.pathname || "/";

    // View state
    const [view, setView] = useState<'auth' | 'forgot' | 'reset'>('auth');
    const resetToken = searchParams.get("token");

    useEffect(() => {
        if (resetToken) {
            setView('reset');
        }
    }, [resetToken]);

    // Form states
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [regUsername, setRegUsername] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [showRegPassword, setShowRegPassword] = useState(false);

    const [forgotEmail, setForgotEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
                toast.success(`Welcome back, ${data.user.username}!`);
                navigate(from, { replace: true });
            } else {
                toast.error(data.error || "Login failed");
            }
        } catch (err) {
            toast.error("Connection to server failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: regUsername,
                    email: regEmail,
                    password: regPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Account created! You can now login.");
            } else {
                toast.error(data.error || "Registration failed");
            }
        } catch (err) {
            toast.error("Connection to server failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setView('auth');
            } else {
                toast.error(data.error || "Failed to send reset link");
            }
        } catch (err) {
            toast.error("Connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                navigate("/auth", { replace: true });
                setView('auth');
            } else {
                toast.error(data.error || "Reset failed");
            }
        } catch (err) {
            toast.error("Connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
                toast.success(`Welcome, ${data.user.username}!`);
                navigate(from, { replace: true });
            } else {
                toast.error(data.error || "Google Sign-In failed");
            }
        } catch (err) {
            toast.error("Connection to server failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-[#030711] overflow-hidden font-sans selection:bg-primary/30">
            {/* Left Side - Image/Card Section (Visible on Mobile now) */}
            <div className="relative flex flex-col justify-center items-center overflow-hidden h-[30vh] lg:h-auto lg:[clip-path:polygon(0_0,100%_0,90%_100%,0_%100%)]">
                {/* Background Image Container */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/auth-sidebar.png"
                        alt="Abstract Future"
                        className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-[30s] ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/40 to-black/10" />
                    <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />

                    {/* Animated Particles/Blobs */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 w-full max-w-xl px-6 lg:px-16 space-y-3 lg:space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000 -mt-5 lg:mt-0">
                    <div className="flex items-center gap-3 lg:gap-4 group justify-center lg:justify-start">
                        <div className="p-3 lg:p-4 bg-gradient-to-br from-primary via-emerald-500 to-teal-500 rounded-2xl shadow-2xl shadow-primary/40 ring-1 ring-white/20 transform group-hover:rotate-[10deg] transition-transform duration-500">
                            <Youtube className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tighter drop-shadow-sm">NoteTube AI</h1>
                    </div>

                    <div className="space-y-4 lg:space-y-6 text-center lg:text-left hidden lg:block">
                        <h2 className="text-3xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                            Unlock the Power of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400 animate-gradient-x">
                                Visual Learning
                            </span>
                        </h2>
                        <p className="text-lg lg:text-xl text-slate-300/90 leading-relaxed font-medium max-w-md border-l-0 lg:border-l-2 border-primary/50 lg:pl-6 py-2">
                            Stop watching, start learning. Our AI distills hours of video into brilliant, structured knowledge maps and study guides.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="relative flex flex-col justify-start lg:justify-center items-center px-4 sm:px-12 lg:px-20 min-h-[60vh] lg:min-h-screen pb-32 lg:pb-0">
                {/* Background decorative elements for Right side */}
                <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[120px] opacity-40 pointer-events-none animate-blob" />
                <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full filter blur-[120px] opacity-30 pointer-events-none animate-blob animation-delay-2000" />

                <div className="w-full max-w-[380px] space-y-4 z-20 transition-all duration-500 ease-in-out -mt-24 lg:mt-0">
                    <Card className="border-none bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden p-1 ring-1 ring-slate-200/50 dark:ring-slate-800/50">
                        <CardContent className="p-6">
                            {view === 'auth' && (
                                <Tabs defaultValue="login" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl h-11">
                                        <TabsTrigger
                                            value="login"
                                            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Sign In
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="register"
                                            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Sign Up
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="login" className="space-y-5 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-1 mb-4">
                                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Welcome Back</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Please enter your details</p>
                                        </div>
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        type="email"
                                                        placeholder="john@example.com"
                                                        className="pl-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                        required
                                                        value={loginEmail}
                                                        onChange={(e) => setLoginEmail(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between ml-1">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Password</Label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setView('forgot')}
                                                        className="text-[10px] text-primary hover:text-primary/80 font-black transition-colors uppercase tracking-wider"
                                                    >
                                                        Forgot?
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        type={showLoginPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        className="pl-10 pr-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                        required
                                                        value={loginPassword}
                                                        onChange={(e) => setLoginPassword(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                    >
                                                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <Button className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] mt-2" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                Sign In
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="register" className="space-y-5 outline-none animate-in fade-in slide-in-from-left-4 duration-500">
                                        <div className="space-y-1 mb-4">
                                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Create Account</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Join our community today</p>
                                        </div>
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Username</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        placeholder="johndoe123"
                                                        className="pl-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                        required
                                                        value={regUsername}
                                                        onChange={(e) => setRegUsername(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        type="email"
                                                        placeholder="john@example.com"
                                                        className="pl-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                        required
                                                        value={regEmail}
                                                        onChange={(e) => setRegEmail(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        type={showRegPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        className="pl-10 pr-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                        required
                                                        value={regPassword}
                                                        onChange={(e) => setRegPassword(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                        onClick={() => setShowRegPassword(!showRegPassword)}
                                                    >
                                                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <Button className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] mt-2" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
                                                Get Started
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            )}

                            {view === 'forgot' && (
                                <div className="space-y-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                    <button
                                        onClick={() => setView('auth')}
                                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-2"
                                    >
                                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                                        Back
                                    </button>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Forgot?</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">We'll send a secure link to your email.</p>
                                    </div>
                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    className="pl-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                    required
                                                    value={forgotEmail}
                                                    onChange={(e) => setForgotEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                            Send Link
                                        </Button>
                                    </form>
                                </div>
                            )}

                            {view === 'reset' && (
                                <div className="space-y-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">New Password</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Enter a secure new password for your account.</p>
                                    </div>
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 h-10 rounded-xl text-sm font-medium"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                            Update
                                        </Button>
                                    </form>
                                </div>
                            )}

                            {view === 'auth' && (
                                <div className="mt-8 space-y-6 animate-in fade-in duration-700">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-slate-100 dark:border-slate-800" />
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                                            <span className="bg-white/60 dark:bg-slate-950/40 px-3 text-slate-400">Or continue with</span>
                                        </div>
                                    </div>

                                    <div className="w-full flex justify-center">
                                        <div className="rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-sm border border-slate-100 dark:border-white/5">
                                            <GoogleLogin
                                                onSuccess={handleGoogleSuccess}
                                                onError={() => toast.error("Google Login Failed")}
                                                theme="outline"
                                                shape="pill"
                                                width="280"
                                                text="continue_with"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col items-center gap-4 text-[10px] font-black text-slate-400 tracking-[0.15em] pt-4 uppercase">
                        <div className="flex items-center gap-4">
                            <span className="hover:text-primary transition-colors cursor-pointer">Privacy</span>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                            <span className="hover:text-primary transition-colors cursor-pointer">Terms</span>
                        </div>
                        <span>&copy; 2026 NoteTube AI</span>
                    </div>
                </div>
            </div>
        </div >
    );
}
