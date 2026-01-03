import { Youtube } from "lucide-react";

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
      <div className="flex flex-col gap-5 p-5 animate-in fade-in duration-500">
        <div className="aspect-video w-full rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        <div className="space-y-3 px-1">
          <div className="h-6 w-3/4 rounded-full bg-slate-100 dark:bg-white/5" />
          <div className="h-4 w-1/2 rounded-full bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  if (!video) return null;

  // Extract video ID safely
  const videoId = video.id && video.id !== "manual" ? video.id : null;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col gap-5 p-5 group">
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 shadow-2xl relative aspect-video group/video ring-1 ring-black/5">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/video:scale-110 opacity-70"
            />
            <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl scale-90 group-hover/video:scale-100 transition-transform duration-500">
                <Youtube className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-1 space-y-2">
        <h3 className="line-clamp-2 text-sm md:text-base font-black text-slate-800 dark:text-slate-100 leading-snug group-hover:text-primary transition-colors tracking-tight">
          {video.title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <Youtube className="w-3 h-3 text-red-500" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
            {video.channelTitle || "GENIUS SELECTED"}
          </p>
        </div>
      </div>
    </div>
  );
}
