import { useState, useEffect } from "react";
import {
    Play,
    Pause,
    Volume2,
    Moon,
    Sun,
    Coffee,
    Type,
    MoveLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useTheme } from "@/hooks/useTheme";

interface FocusModeProps {
    notes: string;
    videoTitle?: string;
    onClose: () => void;
}

export function FocusMode({ notes, videoTitle, onClose }: FocusModeProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(50);


    const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
    const { theme: globalTheme } = useTheme();
    const [theme, setTheme] = useState<'midnight' | 'paper' | 'dim'>(
        globalTheme === 'light' ? 'paper' : 'midnight'
    );

    // Lo-Fi YouTube IDs: 
    const lofiVideoId = "jfKfPfyJRdk"; // lofigirl

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Theme Configurations
    const themes = {
        midnight: {
            bg: 'bg-[#050505]',
            text: 'text-gray-300',
            prose: 'prose-invert prose-gray',
            ui_bg: 'bg-white/5',
            border: 'border-white/10'
        },
        paper: {
            bg: 'bg-[#f4f4f5]', // Zinc-100
            text: 'text-gray-800',
            prose: 'prose-stone',
            ui_bg: 'bg-black/5',
            border: 'border-black/5'
        },
        dim: {
            bg: 'bg-[#1a1c23]', // Deep blue-gray
            text: 'text-gray-300',
            prose: 'prose-invert prose-slate',
            ui_bg: 'bg-white/5',
            border: 'border-white/5'
        }
    };

    const currentTheme = themes[theme];

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-700 animate-in fade-in zoom-in-95 duration-300 ${currentTheme.bg} ${currentTheme.text}`}>

            {/* Top Navigation Bar */}
            <header className={`px-6 py-4 flex items-center justify-between z-10 ${currentTheme.bg}`}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className={`rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors ${currentTheme.text}`}
                        title="Exit Focus Mode (ESC)"
                    >
                        <MoveLeft className="w-5 h-5" />
                    </Button>
                    <div className="h-8 w-px bg-current opacity-10"></div>
                    <div>
                        <h2 className="text-xs font-bold tracking-widest uppercase opacity-40 mb-0.5">Focusing On</h2>
                        <p className="text-sm font-semibold truncate max-w-md">{videoTitle || "Untitled Note"}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-1.5 p-1.5 rounded-full ${currentTheme.ui_bg} border ${currentTheme.border}`}>
                    {/* Theme Switcher */}
                    <div className="flex bg-black/5 rounded-full p-0.5 mr-2">
                        <div className="flex gap-1">
                            {(['midnight', 'paper', 'dim'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${theme === t ? 'bg-primary text-white shadow-lg scale-105' : 'hover:bg-black/5 opacity-50'}`}
                                    title={`Theme: ${t}`}
                                >
                                    {t === 'midnight' && <Moon className="w-3 h-3" />}
                                    {t === 'paper' && <Sun className="w-3 h-3" />}
                                    {t === 'dim' && <Coffee className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </div>


                </div>
            </header>

            {/* Main Reading Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative px-4">
                <div className={`max-w-2xl mx-auto pt-8 pb-32 transition-all duration-500 ${fontSize === 'lg' ? 'scale-[1.02]' : fontSize === 'sm' ? 'scale-[0.95]' : ''
                    }`}>
                    <article className={`prose ${fontSize === 'lg' ? 'prose-xl' : fontSize === 'sm' ? 'prose-sm' : 'prose-base'} max-w-none ${currentTheme.prose} 
                        prose-headings:font-bold prose-headings:tracking-tight 
                        prose-p:leading-8 prose-p:opacity-90 
                        prose-li:opacity-90
                        prose-strong:text-primary prose-strong:font-black
                        prose-blockquote:border-l-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:rounded-r-lg`}>
                        <ReactMarkdown>{notes}</ReactMarkdown>
                    </article>

                    {/* End Marker */}
                    <div className="mt-16 flex justify-center opacity-20">
                        <div className="w-2 h-2 rounded-full bg-current mx-1"></div>
                        <div className="w-2 h-2 rounded-full bg-current mx-1"></div>
                        <div className="w-2 h-2 rounded-full bg-current mx-1"></div>
                    </div>
                </div>
            </main>

            {/* Floating Player Control */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className={`group flex items-center gap-4 px-2 py-2 pr-6 rounded-full border shadow-2xl backdrop-blur-xl transition-all hover:scale-105 ${currentTheme.bg} ${currentTheme.border}`}>
                    <Button
                        size="icon"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`rounded-full h-12 w-12 shadow-lg ${isPlaying ? 'bg-primary text-white animate-pulse' : 'bg-secondary text-secondary-foreground'}`}
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </Button>

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-primary">Focus Audio</span>
                        <span className="text-xs font-medium opacity-70">Lofi Girl Radio</span>
                    </div>

                    <div className="w-px h-8 bg-current opacity-10 mx-2"></div>

                    <div className="flex items-center gap-2 group/vol">
                        <Volume2 className="w-4 h-4 opacity-50" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(parseInt(e.target.value))}
                            className="w-20 h-1 rounded-full appearance-none bg-current opacity-20 hover:opacity-100 cursor-pointer accent-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Hidden Player */}
            {isPlaying && (
                <div className="hidden">
                    <iframe
                        width="200"
                        height="200"
                        src={`https://www.youtube.com/embed/${lofiVideoId}?autoplay=1&mute=0&volume=${volume}`}
                        allow="autoplay"
                    ></iframe>
                </div>
            )}
        </div>
    );
}
