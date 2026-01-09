import { Copy, Download, Loader2, Printer, ChevronLeft, ChevronRight, MessageSquare, FileText, Volume2, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";
import { ChatInterface } from "./ChatInterface";
import { InteractiveStudy } from "./InteractiveStudy";
import { FocusMode } from "./FocusMode";
import { GraduationCap, Share2, Eye } from "lucide-react";

export interface NotesDisplayProps {
    notes: string;
    isLoading: boolean;
    videoTitle?: string;
    videoId?: string;
    currentStep?: string;
    onNextVideo?: () => void;
    onPrevVideo?: () => void;
    onBackToPlaylist?: () => void;
}

export function NotesDisplay({ notes, isLoading, videoTitle, videoId, currentStep, onNextVideo, onPrevVideo, onBackToPlaylist }: NotesDisplayProps) {
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'notes' | 'chat' | 'study'>('notes');
    const contentRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<string[]>([]);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // ... (keep useEffect for notes pagination)

    useEffect(() => {
        if (notes) {
            const paragraphs = notes.split(/\n\n+/);
            const newPages: string[] = [];
            let currentChunk = "";
            const CHARS_PER_PAGE = 1500;

            for (const p of paragraphs) {
                if ((currentChunk.length + p.length) > CHARS_PER_PAGE) {
                    if (currentChunk) newPages.push(currentChunk);
                    currentChunk = p;
                } else {
                    currentChunk += (currentChunk ? '\n\n' : '') + p;
                }
            }
            if (currentChunk) newPages.push(currentChunk);

            setPages(newPages.length > 0 ? newPages : [notes]);
            setCurrentPage(1);
        } else {
            setPages([]);
        }
    }, [notes]);

    const totalPages = pages.length;
    const currentContent = pages[currentPage - 1] || "";

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(notes);
        toast({ title: "Copied!", description: "Full notes copied to clipboard" });
    };

    const downloadAsTxt = () => {
        const blob = new Blob([notes], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${videoTitle || "notes"}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded!", description: "Notes saved as text file" });
    };

    const printNotes = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${videoTitle || 'Notes'}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
              h1, h2, h3 { color: #1a1a1a; }
              p { line-height: 1.6; color: #333; }
              pre { background: #f4f4f4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
              img { max-width: 100%; height: auto; }
              blockquote { border-left: 4px solid #ddd; padding-left: 1rem; color: #666; }
            </style>
          </head>
          <body>
            <h1>${videoTitle || 'Notes'}</h1>
            <pre style="white-space: pre-wrap; font-family: sans-serif;">${notes}</pre>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        setIsSpeaking(true);

        // Speak the current visible page content for better context and reliability
        const textToSpeak = currentContent || notes;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        utterance.rate = 1;
        utterance.pitch = 1;

        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US English"))
                || voices.find(v => v.name.includes("Microsoft Zira"))
                || voices.find(v => v.lang.startsWith("en"));

            if (preferredVoice) utterance.voice = preferredVoice;
        };

        setVoice();

        // Ensure voices are loaded (Chrome requirement sometimes)
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoice;
        }

        utterance.onend = () => {
            setIsSpeaking(false);
            speechRef.current = null;
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
            speechRef.current = null;
            // Don't show toast on cancel (which triggers error in some browsers)
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
                toast({ title: "Error", description: "Audio playback failed", variant: "destructive" });
            }
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        window.speechSynthesis.getVoices();
        return () => window.speechSynthesis.cancel(); // Cleanup on unmount
    }, []);

    if (isLoading) {
        return (
            <div className="glass-card flex flex-col items-center justify-center rounded-[40px] p-12 min-h-[600px] border-none shadow-2xl relative overflow-hidden group">
                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse -z-10" />

                <div className="relative mb-16 perspective-1000">
                    {/* The 3D Card Icon */}
                    <div className="w-32 h-44 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-transparent backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform -rotate-y-12 rotate-z-3 animate-float flex flex-col items-center justify-center relative overflow-hidden">

                        {/* Card Content Lines */}
                        <div className="w-16 h-2 bg-white/40 rounded-full mb-3" />
                        <div className="w-20 h-2 bg-white/20 rounded-full mb-2" />
                        <div className="w-20 h-2 bg-white/20 rounded-full mb-2" />
                        <div className="w-12 h-2 bg-white/20 rounded-full" />

                        {/* Central Glowing Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-14 h-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
                        </div>

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>

                    {/* Orbiting Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-primary/30 rounded-full animate-[spin_8s_linear_infinite]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-dashed border-primary/20 rounded-full animate-[spin_12s_linear_infinite_reverse]" />

                    {/* Small orbiting dots */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full animate-[spin_4s_linear_infinite]">
                        <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] absolute top-0 left-1/2 -translate-x-1/2 -mt-1.5" />
                    </div>
                </div>

                <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-md relative z-10">
                    <div>
                        <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 tracking-tighter mb-2">
                            {currentStep || "Generating Magic"}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Distilling video content into genius notes...
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col items-center gap-4 w-64 mx-auto">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                            <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full animate-progress-indeterminate origin-left shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!notes) return null;

    return (
        <div className="glass-card animate-in fade-in zoom-in-95 duration-500 rounded-2xl shadow-xl flex flex-col h-auto lg:h-full border-none overflow-hidden bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
            {/* Header / Tabs Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 px-4 py-3 md:px-6 md:py-5 bg-white/40 dark:bg-black/20 shrink-0">
                <div className="grid grid-cols-3 gap-1 w-full md:w-auto bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
                    {[
                        { id: 'notes', icon: FileText, label: 'Notes' },
                        { id: 'chat', icon: MessageSquare, label: 'AI Tutor' },
                        { id: 'study', icon: GraduationCap, label: 'Study' }
                    ].map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`text-[10px] sm:text-xs font-bold rounded-xl h-8 sm:h-10 px-2 sm:px-4 transition-all duration-300 ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-foreground'}`}
                        >
                            <tab.icon className={`mr-1.5 h-3.5 w-3.5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                            {tab.label}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-2 w-full md:w-auto md:justify-end">
                    {activeTab === 'notes' && (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                            <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all" title="Copy">
                                <Copy className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={downloadAsTxt} className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all" title="Download">
                                <Download className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={printNotes} className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all" title="Print">
                                <Printer className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-500" />
                            </Button>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSpeak}
                                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all ${isSpeaking ? "bg-primary text-white" : "hover:bg-white dark:hover:bg-slate-800 text-slate-500"}`}
                                title={isSpeaking ? "Stop" : "Listen"}
                            >
                                {isSpeaking ? <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" /> : <Volume2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
                            </Button>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFocusMode(true)}
                        className="hidden sm:inline-flex h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all text-slate-500"
                        title="Focus Mode"
                    >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    {onBackToPlaylist && (
                        <Button
                            variant="ghost"
                            onClick={onBackToPlaylist}
                            className="hidden sm:inline-flex h-8 w-auto px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 font-bold text-xs uppercase tracking-wide gap-2 transition-all mr-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span>List</span>
                        </Button>
                    )}

                    {onPrevVideo && (
                        <Button
                            variant="ghost"
                            onClick={onPrevVideo}
                            className="hidden sm:inline-flex h-8 w-auto px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 font-bold text-xs uppercase tracking-wide gap-2 transition-all mr-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Prev</span>
                        </Button>
                    )}

                    {onNextVideo && (
                        <Button
                            variant="ghost"
                            onClick={onNextVideo}
                            className="hidden sm:inline-flex h-8 w-auto px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wide gap-2 transition-all"
                        >
                            <span>Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                {activeTab === 'notes' ? (
                    <>
                        <div className="flex-1 overflow-visible lg:overflow-y-auto custom-scrollbar" ref={contentRef}>
                            <div className="max-w-4xl mx-auto px-4 py-4 md:px-10 md:py-8 pb-20">
                                <article className="markdown-content prose prose-sm prose-slate dark:prose-invert max-w-none 
                                    prose-headings:text-foreground prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                                    prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-normal prose-p:text-xs
                                    prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:text-xs
                                    prose-strong:text-foreground prose-strong:font-bold
                                    prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
                                    prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                                    prose-img:rounded-2xl prose-img:shadow-2xl
                                    prose-hr:border-slate-200 dark:prose-hr:border-white/10">
                                    <ReactMarkdown>{currentContent}</ReactMarkdown>
                                </article>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="border-t border-black/5 dark:border-white/5 p-2 sm:p-4 bg-white/40 dark:bg-black/20 flex items-center justify-center sm:justify-between shrink-0 px-2 sm:px-10 gap-4 sm:gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setCurrentPage(p => Math.max(1, p - 1));
                                        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === 1}
                                    className="rounded-xl h-8 sm:h-10 px-2 sm:px-4 font-bold text-xs"
                                >
                                    <ChevronLeft className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-slate-400">Section</span>
                                    <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-center">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 rounded-full transition-all duration-500 ${currentPage === i + 1 ? 'w-4 sm:w-8 bg-primary' : 'w-1.5 sm:w-2 bg-slate-200 dark:bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-bold text-foreground min-w-[2rem] sm:min-w-[3rem] text-center whitespace-nowrap">
                                        {currentPage} / {totalPages}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setCurrentPage(p => Math.min(totalPages, p + 1));
                                        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="rounded-xl h-8 sm:h-10 px-2 sm:px-4 font-bold text-xs"
                                >
                                    <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4 sm:ml-2" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : activeTab === 'chat' ? (
                    <div className="h-[500px] lg:h-full lg:flex-1 overflow-hidden">
                        <ChatInterface notes={notes} videoTitle={videoTitle} embedded={true} />
                    </div>
                ) : (
                    <div className="flex-1 overflow-visible lg:overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-black/20">
                        <div className="p-6 md:p-10 max-w-5xl mx-auto">
                            <InteractiveStudy notes={notes} videoTitle={videoTitle} videoId={videoId} />
                        </div>
                    </div>
                )}
            </div>

            {isFocusMode && (
                <FocusMode
                    notes={notes}
                    videoTitle={videoTitle}
                    onClose={() => setIsFocusMode(false)}
                />
            )}
        </div>
    );
}
