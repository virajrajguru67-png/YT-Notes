import { Skeleton } from "@/components/ui/skeleton";
import { Youtube, ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoInfo {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    description: string;
}

interface VideoPreviewProps {
    video: VideoInfo | null;
    isLoading: boolean;
}

export function VideoPreview({ video, isLoading }: VideoPreviewProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <div className="space-y-2 px-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        );
    }

    if (!video) return null;

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="relative group">
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 shadow-2xl relative">
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-white/30 scale-90 group-hover:scale-100 transition-transform duration-500">
                            <PlayCircle className="w-8 h-8 text-white fill-white shadow-xl" />
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
                            onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-3 px-1">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        {video.title}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                        <Youtube className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                            Youtube
                        </span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {video.channelTitle || "Channel Unknown"}
                    </p>
                </div>

                {video.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium mt-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        {video.description}
                    </p>
                )}
            </div>
        </div>
    );
}
