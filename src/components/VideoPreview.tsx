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
      <div className="animate-pulse rounded-xl border border-border bg-card p-4">
        <div className="aspect-video w-full rounded-lg bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="animate-fade-in rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="overflow-hidden rounded-lg">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="mt-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-card-foreground">
          {video.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{video.channelTitle}</p>
      </div>
    </div>
  );
}
