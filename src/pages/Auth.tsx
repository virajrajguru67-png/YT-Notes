import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, Sparkles, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                toast.success("Welcome back!");
            } else {
                await register(username, email, password);
                toast.success("Account created successfully!");
                setIsLogin(true);
            }
            if (isLogin) navigate(from, { replace: true });
        } catch (error: any) {
            toast.error(error.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
            </div>

            <div className="w-full max-w-md glass-card p-8 rounded-[32px] shadow-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border-none animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center gap-4 mb-10">
                    <div className="p-3 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl shadow-xl shadow-primary/20">
                        <Youtube className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                            NoteTube<span className="text-primary italic">.</span>
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Genius AI Learning
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-2">
                            <Input
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-slate-100 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-100 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-100 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {isLoading ? "Please wait..." : isLogin ? "Login to Dashboard" : "Create My Account"}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 text-center">
                    <p className="text-sm text-slate-500 font-medium mb-4">
                        {isLogin ? "New to NoteTube?" : "Already have an account?"}
                    </p>
                    <Button
                        variant="ghost"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary font-bold hover:bg-primary/5 rounded-xl transition-all"
                    >
                        {isLogin ? "Switch to Registration" : "Return to Login"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
