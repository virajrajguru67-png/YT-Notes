import { Copy, Download, Loader2, Printer, ChevronLeft, ChevronRight, MessageSquare, FileText, Volume2, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";
import { ChatInterface } from "./ChatInterface";
import { InteractiveStudy } from "./InteractiveStudy";
import { FocusMode } from "./FocusMode";
import { GraduationCap, Share2, Eye } from "lucide-react";

interface NotesDisplayProps {
    notes: string;
    isLoading: boolean;
    videoTitle?: string;
    videoId?: string;
    currentStep?: string;
}

export function NotesDisplay({ notes, isLoading, videoTitle, videoId, currentStep }: NotesDisplayProps) {
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
        // Map currentStep to a progress state
        const steps = [
            { id: 1, label: "Acquiring Video", keywords: ["Searching", "Retrieving", "Download"] },
            { id: 2, label: "Transcribing Audio", keywords: ["Transcribing", "Extracting"] },
            { id: 3, label: "AI Analysis", keywords: ["Structuring", "Analyzing", "Crafting"] },
            { id: 4, label: "Finalizing", keywords: ["Finalizing", "Saving"] }
        ];

        const activeStepIndex = steps.findIndex(s => s.keywords.some(k => currentStep?.includes(k))) || 0;
        const progress = ((activeStepIndex + 1) / steps.length) * 100;

        return (
            <div className="glass-card flex flex-col items-center justify-center rounded-3xl p-8 lg:p-12 min-h-[500px] border-none shadow-2xl relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
                {/* Ambient Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-emerald-500 animate-gradient-x"></div>
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Main Pulse Animation */}
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75 duration-[3s]"></div>
                        <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse duration-[2s]"></div>
                        <div className="relative bg-white dark:bg-slate-800 rounded-full p-6 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10">
                            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                        </div>
                    </div>

                    {/* Text Status */}
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            {currentStep || "Initializing AI..."}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Generating Genius Notes
                        </p>
                    </div>

                    {/* Step Cards */}
                    <div className="space-y-3">
                        {steps.map((step, idx) => {
                            const isActive = idx === activeStepIndex;
                            const isCompleted = idx < activeStepIndex;
                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-500 ${isActive
                                            ? 'bg-primary/5 border-primary/20 scale-105 shadow-lg'
                                            : isCompleted
                                                ? 'bg-slate-50/50 dark:bg-white/5 border-transparent opacity-60'
                                                : 'border-transparent opacity-30'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                        }`}>
                                        {isCompleted ? "✓" : step.id}
                                    </div>
                                    <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {step.label}
                                    </span>
                                    {isActive && <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto" />}
                                </div>
                            );
                        })}
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
