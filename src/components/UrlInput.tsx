import { useState } from "react";
import { Link2, ArrowRight, Loader2, ClipboardPaste, Youtube, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UrlInputProps {
  onSubmit: (url: string, manualTranscript?: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const handleManualSubmit = () => {
    if (url.trim() && manualTranscript.trim()) {
      onSubmit(url.trim(), manualTranscript.trim());
      setIsDialogOpen(false);
      setManualTranscript("");
    }
  };

  const isValidYoutubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).+/;
    return pattern.test(url);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <form onSubmit={handleSubmit} className="w-full relative group perspective-1000">
        <div className="relative flex flex-col sm:flex-row items-center p-2 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[32px] transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] ring-1 ring-black/5">
          <div className="hidden sm:flex pl-5 pr-2 text-slate-400 group-focus-within:text-primary transition-colors">
            <Youtube className="h-6 w-6" />
          </div>
          <Input
            type="url"
            placeholder="Paste YouTube video link here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 h-14 bg-transparent border-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base md:text-lg font-medium text-slate-900 dark:text-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 sm:px-2 shadow-none w-full"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="h-13 px-8 w-full sm:w-auto mt-2 sm:mt-0 text-base font-black rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-emerald-500/30 dark:shadow-emerald-900/20 border-0 group/btn overflow-hidden relative"
            disabled={isLoading || !url.trim() || !isValidYoutubeUrl(url)}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Cooking...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Magic Notes</span>
                <Sparkles className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
              </div>
            )}
          </Button>
        </div>

        {url && !isValidYoutubeUrl(url) && (
          <div className="absolute -bottom-8 left-6 flex items-center gap-2 text-destructive animate-in slide-in-from-top-2">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider">Invalid YouTube Address</p>
          </div>
        )}
      </form>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 animate-in fade-in duration-1000 delay-500">
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>Need help?</span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-10 px-6 rounded-full border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 text-slate-600 dark:text-slate-400 hover:text-primary font-bold text-xs uppercase tracking-widest transition-all">
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Manual Transcript
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-950 border-none shadow-3xl rounded-[32px] overflow-hidden p-0">
            <div className="p-8 pb-0">
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <ClipboardPaste className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">Paste Manual Transcript</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium pt-1">
                  Use this if the video has restricted access or auto-fetch fails.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8 pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  YouTube URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 pl-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Full Transcript
                </label>
                <Textarea
                  placeholder="Paste the full transcript text here..."
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  className="min-h-[250px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 focus:ring-primary/20 transition-all font-medium resize-none"
                />
              </div>

              <Button
                onClick={handleManualSubmit}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                disabled={!url.trim() || !manualTranscript.trim() || !isValidYoutubeUrl(url)}
              >
                Generate From Transcript
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
