import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>

            <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative inline-block">
                    <h1 className="text-[180px] font-black leading-none tracking-tighter text-slate-100 dark:text-white/5 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-24 h-24 text-primary animate-bounce duration-[2000ms]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Lost in Space?
                    </h2>
                    <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400 font-medium">
                        Even our Genius AI couldn't find this page. Let's get you back to learning!
                    </p>
                </div>

                <Button asChild className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3">
                    <Link to="/">
                        <Home className="w-5 h-5" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}
