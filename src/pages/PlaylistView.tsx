
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download, Sparkles, Youtube, PlayCircle, ArrowLeft, MoreVertical, CheckCircle, RefreshCw, X, FileAudio, FileVideo, ListVideo } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PlaylistVideo {
    videoId: string;
    title: string;
    thumbnail: string;
    channel: string;
}

interface ActiveDownload {
    id: string; // Unique ID for the download task
    videoId: string;
    title: string;
    quality: string;
    status: 'preparing' | 'started' | 'done';
    progress: number;
}

export default function PlaylistView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();

    // State
    const [videos, setVideos] = useState<PlaylistVideo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

    // Download Queue State
    const [downloads, setDownloads] = useState<ActiveDownload[]>([]);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [bulkQuality, setBulkQuality] = useState("best");

    // Initial load
    useEffect(() => {
        if (location.state?.videos) {
            setVideos(location.state.videos);
        } else if (id) {
            fetchPlaylist(id);
        }
    }, [id, location.state]);

    const fetchPlaylist = async (playlistId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:3001/api/playlist/${playlistId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.videos) {
                setVideos(data.videos.map((v: any) => ({
                    videoId: v.videoId,
                    title: v.title,
                    thumbnail: v.thumbnail,
                    channel: v.channel
                })));
            }
        } catch (e) {
            toast.error("Failed to load playlist. Try refreshing.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedVideos(videos.map(v => v.videoId));
        } else {
            setSelectedVideos([]);
        }
    };

    const toggleSelection = (videoId: string) => {
        setSelectedVideos(prev =>
            prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
        );
    };

    const startDownload = async (videoId: string, title: string, quality: string) => {
        const downloadId = Math.random().toString(36).substring(2);

        // Add to queue
        setDownloads(prev => [...prev, {
            id: downloadId,
            videoId,
            title,
            quality,
            status: 'preparing',
            progress: 0
        }]);

        // Simulated progress for "Server Processing"
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress > 90) progress = 90; // Hold until ready
            setDownloads(prev => prev.map(d =>
                d.id === downloadId && d.status === 'preparing' ? { ...d, progress } : d
            ));
        }, 800);

        try {
            // Step 1: Prepare (Wait for server)
            const params = new URLSearchParams({ quality }).toString();
            // Use 127.0.0.1 to match server config, but fetch works cross-origin if CORS allows
            // Since we are likely on localhost, and server allows CORS (typically), this is fine.
            const res = await fetch(`http://127.0.0.1:3001/api/prepare-download/${videoId}?${params}`);

            if (!res.ok) throw new Error("Processing failed");

            const data = await res.json();

            // Step 2: Serve (Instant start)
            clearInterval(progressInterval);

            // Mark as 100% / Done
            setDownloads(prev => prev.map(d =>
                d.id === downloadId ? { ...d, status: 'done', progress: 100 } : d
            ));

            const serveParams = new URLSearchParams({
                title: title.substring(0, 100)
            }).toString();

            const serveUrl = `http://127.0.0.1:3001/api/serve-download/${data.filename}?${serveParams}`;

            // Trigger download via invisible iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = serveUrl;
            document.body.appendChild(iframe);

            toast.success("Download started!");

            // Cleanup UI
            setTimeout(() => {
                setDownloads(prev => prev.filter(d => d.id !== downloadId));
            }, 4000);

            // Cleanup iframe
            setTimeout(() => {
                try { document.body.removeChild(iframe); } catch (e) { }
            }, 60000);

        } catch (error) {
            clearInterval(progressInterval);
            toast.error("Download failed to prepare.");
            setDownloads(prev => prev.filter(d => d.id !== downloadId));
        }
    };

    const handleIndividualDownload = (video: PlaylistVideo, quality: string) => {
        startDownload(video.videoId, video.title, quality);
    };

    const confirmBulkDownload = () => {
        setShowBulkDialog(false);
        const videosToDownload = videos.filter(v => selectedVideos.includes(v.videoId));
        toast.info(`Starting batch download for ${videosToDownload.length} videos...`);

        videosToDownload.forEach((video, index) => {
            setTimeout(() => {
                startDownload(video.videoId, video.title, bulkQuality);
            }, index * 1500); // Stagger downloads slightly
        });
        setSelectedVideos([]);
    };

    // URL Entry for "Playlist Manager" sidebar link
    const [inputUrl, setInputUrl] = useState("");

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const match = inputUrl.match(/[?&]list=([^#\&\?]+)/);
        if (match && match[1]) {
            navigate(`/playlist/${match[1]}`);
        } else {
            toast.error("Invalid YouTube Playlist URL. Look for '?list=...' in the link.");
        }
    };

    if (!id && !location.state?.videos) {
        return (
            <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
                <Sidebar />
                <main className="lg:pl-[280px] min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-black/20">
                    <div className="w-full max-w-lg space-y-8 text-center bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-10 rounded-[32px] shadow-xl border border-white/20">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                            <ListVideo className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Load Playlist
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Paste a YouTube playlist URL to view videos, download in bulk, or transcribe.
                        </p>

                        <form onSubmit={handleUrlSubmit} className="space-y-4 pt-4">
                            <Input
                                placeholder="https://www.youtube.com/playlist?list=..."
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                className="h-12 rounded-xl bg-white/50 border-slate-200 dark:border-white/10 dark:bg-black/20 text-center font-medium"
                            />
                            <Button type="submit" size="lg" className="w-full h-12 rounded-xl font-bold text-md shadow-lg shadow-primary/25">
                                Load Playlist
                            </Button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
            <Sidebar />

            <main className="lg:pl-[280px] min-h-screen flex flex-col relative">
                <header className="px-6 pb-6 pt-20 md:p-10 border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0">
                    <div className="max-w-7xl mx-auto space-y-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/playlist')} // Go back to Playlist Selection
                            className="text-muted-foreground hover:text-primary -ml-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Select Different Playlist
                        </Button>


                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                                    Playlist Manager
                                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{videos.length} Videos</span>
                                    </div>
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                                    {id ? `Playlist ID: ${id}` : 'Manage your playlist videos'}
                                </p>
                            </div>



                            <div className="flex gap-3">
                                {selectedVideos.length > 0 && (
                                    <Button
                                        onClick={() => setShowBulkDialog(true)}
                                        className="h-12 px-6 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Selected ({selectedVideos.length})
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 bg-slate-50/50 dark:bg-black/20">
                    <div className="max-w-7xl mx-auto">
                        <div className="glass-card rounded-[32px] overflow-hidden border-none shadow-xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl">
                            {/* Table Header */}
                            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_3fr_2fr_auto] gap-4 p-6 border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-white/5 items-center font-bold text-xs text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center justify-center w-10">
                                    <Checkbox
                                        checked={selectedVideos.length === videos.length && videos.length > 0}
                                        onCheckedChange={(c) => handleSelectAll(c as boolean)}
                                    />
                                </div>
                                <div>Video</div>
                                <div className="hidden md:block">Channel</div>
                                <div className="text-right">Actions</div>
                            </div>

                            {/* List */}
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="p-6 flex items-center gap-4">
                                            <Skeleton className="w-8 h-8 rounded-md" />
                                            <Skeleton className="w-32 h-20 rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-1/2" />
                                                <Skeleton className="h-3 w-1/3" />
                                            </div>
                                        </div>
                                    ))
                                ) : videos.map((video) => (
                                    <div key={video.videoId} className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_3fr_2fr_auto] gap-4 p-4 hover:bg-white/60 dark:hover:bg-white/5 transition-colors items-center">
                                        <div className="flex items-center justify-center w-10">
                                            <Checkbox
                                                checked={selectedVideos.includes(video.videoId)}
                                                onCheckedChange={() => toggleSelection(video.videoId)}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="relative w-24 h-14 md:w-32 md:h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-4">{video.title}</h3>
                                                <p className="md:hidden text-xs text-slate-500 mt-1">{video.channel}</p>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-medium">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {video.channel.charAt(0)}
                                            </div>
                                            {video.channel}
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="hidden md:flex h-9 px-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs gap-2"
                                                onClick={() => {
                                                    navigate('/', { state: { autoPlayVideoId: video.videoId, playlistVideos: videos } });
                                                }}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Transcribe
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
                                                        <Download className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                                                    <DropdownMenuItem onClick={() => handleIndividualDownload(video, 'best')} className="font-medium text-xs p-2 rounded-lg cursor-pointer">
                                                        <CheckCircle className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Best Available
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleIndividualDownload(video, '1080')} className="font-medium text-xs p-2 rounded-lg cursor-pointer">
                                                        1080p Full HD
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleIndividualDownload(video, '720')} className="font-medium text-xs p-2 rounded-lg cursor-pointer">
                                                        720p HD
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleIndividualDownload(video, '480')} className="font-medium text-xs p-2 rounded-lg cursor-pointer">
                                                        480p SD
                                                    </DropdownMenuItem>
                                                    <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                                                    <DropdownMenuItem onClick={() => handleIndividualDownload(video, 'audio')} className="font-medium text-xs p-2 rounded-lg cursor-pointer">
                                                        <Youtube className="w-3.5 h-3.5 mr-2" /> Audio Only (M4A)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Progress Floating Panel */}
                {downloads.length > 0 && (
                    <div className="fixed bottom-6 right-6 w-80 max-h-[400px] overflow-y-auto space-y-2 z-50">
                        {downloads.map(d => (
                            <div key={d.id} className="glass-card p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-2xl border border-white/20 backdrop-blur-md">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.status === 'done' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {d.status === 'done' ? <CheckCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-bold truncate">{d.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{d.quality} • {d.status === 'done' ? 'Downloaded' : 'Processing...'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setDownloads(prev => prev.filter(x => x.id !== d.id))}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                                <Progress value={d.progress} className="h-1" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Bulk Download Dialog */}
                <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>Download Selected Videos</DialogTitle>
                            <DialogDescription>
                                You are about to download {selectedVideos.length} videos. Select your preferred quality.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Format & Quality</h4>
                                <Select value={bulkQuality} onValueChange={setBulkQuality}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select quality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="best">Best Available (Auto)</SelectItem>
                                        <SelectItem value="1080">1080p Full HD</SelectItem>
                                        <SelectItem value="720">720p HD</SelectItem>
                                        <SelectItem value="480">480p SD</SelectItem>
                                        <SelectItem value="audio">Audio Only (M4A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowBulkDialog(false)} className="rounded-xl">Cancel</Button>
                            <Button onClick={confirmBulkDownload} className="rounded-xl font-bold">Start Download</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
}
