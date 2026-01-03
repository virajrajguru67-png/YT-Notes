import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FileText, Sparkles, Youtube, ExternalLink, PlayCircle, Loader2, Clock, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { UrlInput } from "@/components/UrlInput";
import { VideoPreview } from "@/components/VideoPreview";
import { NotesDisplay } from "@/components/NotesDisplay";
import { useYoutubeNotes } from "@/hooks/useYoutubeNotes";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface Recommendation {
  query: string;
  videoId?: string;
  title?: string;
  thumbnail?: string;
  channel?: string;
}

const Index = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const { token } = useAuth();
  const location = useLocation();
  const {
    isLoadingVideo,
    isLoadingNotes,
    currentStep,
    videoInfo,
    notes,
    processVideo,
    setVideoInfo,
    setNotes,
    reset,
  } = useYoutubeNotes();

  const fetchRecs = useCallback(async () => {
    if (!notes || !videoInfo?.title) return;

    setIsLoadingRecs(true);
    try {
      const res = await fetch('http://localhost:3001/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ videoTitle: videoInfo.title, notes })
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (e) {
      console.error("Failed to fetch recs", e);
    } finally {
      setIsLoadingRecs(false);
    }
  }, [notes, videoInfo?.title]);

  useEffect(() => {
    if (notes && videoInfo?.title) {
      fetchRecs();
    } else {
      setRecommendations([]);
    }
  }, [fetchRecs, notes, videoInfo?.title]);

  const handleHistorySelect = useCallback((item: any) => {
    setVideoInfo({
      id: item.videoId,
      title: item.title,
      channelTitle: "",
      thumbnail: item.thumbnail,
      description: "",
    });
    setNotes(item.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setVideoInfo, setNotes]);

  useEffect(() => {
    if (location.state?.selectedNote) {
      handleHistorySelect(location.state.selectedNote);
      // Clean up state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleHistorySelect]);

  const handleSubmit = async (url: string, manualTranscript?: string) => {
    await processVideo(url, manualTranscript);
    setHistoryTrigger(prev => prev + 1);
  };

  return (
    <>
      <Helmet>
        <title>NoteTube - AI Note Generator</title>
        <meta
          name="description"
          content="Transform YouTube videos into beginner-friendly study notes with AI."
        />
      </Helmet>

      <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
        <Sidebar onHistorySelect={handleHistorySelect} refreshTrigger={historyTrigger} onNewNote={reset} />



        <main className="lg:pl-[280px]">
          {(!videoInfo && !notes && !isLoadingVideo && !isLoadingNotes) ? (
            <div className="relative h-screen flex items-center justify-center overflow-hidden">
              {/* Dynamic Background Blobs */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

              <div className="container relative z-10 flex flex-col items-center justify-center">
                {/* Hero Section */}
                <section className="text-left lg:text-center space-y-8 animate-fade-in max-w-4xl mx-auto mb-10">
                  <div className="inline-flex items-center justify-start lg:justify-center px-3 py-1 mb-2 mt-16 lg:mt-0 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-primary mr-2" />
                    <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Powered by Genius AI</span>
                  </div>

                  {/* Scrolling Features Ticker */}
                  <div className="w-full overflow-hidden mb-6 opacity-60 flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    {[0, 1].map((i) => (
                      <div key={i} className="animate-infinite-scroll flex items-center gap-8 whitespace-nowrap min-w-full pr-8">
                        {[
                          "AI Summaries", "Markdown Ready", "60s Processing",
                          "AI Summaries", "Markdown Ready", "60s Processing"
                        ].map((text, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{text}</span>
                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <h1 className="flex flex-col items-start lg:items-center justify-center text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
                    Stop Watching.<br />
                    <span className="relative inline-block mt-2">
                      <span className="relative z-10 text-gradient-green animate-gradient bg-[length:200%_auto]">
                        Start Learning.
                      </span>
                      <span className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -rotate-1"></span>
                    </span>
                  </h1>

                  <p className="mx-0 lg:mx-auto max-w-xl text-base md:text-lg text-muted-foreground/80 leading-relaxed font-light">
                    The ultimate AI companion that turns<br className="lg:hidden" />
                    YouTube clutter into structured<br className="lg:hidden" />
                    genius-level notes in seconds.
                  </p>
                </section>

                {/* Input Section - Sleek & Minimal */}
                <section className="w-full max-w-2xl mx-auto px-4">
                  <UrlInput onSubmit={handleSubmit} isLoading={isLoadingVideo || isLoadingNotes} />
                </section>

                {/* Micro Features - Horizontal & Minimal */}

              </div>
            </div>
          ) : (
            /* Dashboard layout filling the screen */
            <div className="min-h-screen lg:h-screen p-4 lg:p-8 overflow-auto lg:overflow-hidden flex flex-col relative">
              {/* Background Blobs for Dashboard */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 animate-pulse [animation-delay:2s]"></div>

              <div className="grid lg:grid-cols-12 gap-8 h-auto lg:h-full max-w-[1600px] mx-auto w-full">
                {/* Video Column */}
                {/* Video Column */}
                <div className="lg:col-span-4 flex flex-col gap-2 h-auto lg:h-full min-h-0">
                  <div className="glass-card p-0 rounded-3xl overflow-hidden shrink-0 border-none shadow-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl max-w-sm mx-auto w-full lg:max-w-none">
                    <VideoPreview video={videoInfo} isLoading={isLoadingVideo} />
                  </div>

                  {/* Related Topics Widget */}
                  <div className="hidden lg:flex glass-card rounded-[32px] p-4 flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 border-none shadow-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Recommended Videos
                      </h3>
                      {recommendations.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={fetchRecs}
                          disabled={isLoadingRecs}
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                          title="Refresh"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecs ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 h-[240px]">
                      {isLoadingRecs ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                          <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-20" />
                          <span className="text-xs font-bold uppercase tracking-widest opacity-40">Curating...</span>
                        </div>
                      ) : recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {recommendations.map((rec, idx) => (
                            <button
                              key={idx}
                              onClick={async () => {
                                if (rec.videoId) {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                  await processVideo(`https://www.youtube.com/watch?v=${rec.videoId}`);
                                  setHistoryTrigger(prev => prev + 1);
                                } else {
                                  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.query)}`, '_blank');
                                }
                              }}
                              className="group w-full text-left p-2 rounded-2xl transition-all duration-300 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98] mb-1"
                            >
                              <div className="flex items-center gap-4">
                                <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-black/60 shrink-0 border border-slate-100 dark:border-white/5 group-hover:border-primary/40 transition-all duration-500 shadow-sm">
                                  {(rec.thumbnail || rec.videoId) ? (
                                    <img
                                      src={rec.thumbnail || (rec.videoId ? `https://i.ytimg.com/vi/${rec.videoId}/hqdefault.jpg` : '')}
                                      alt=""
                                      className="object-cover w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-white/5">
                                      <Youtube className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                                    </div>
                                  )}

                                  {rec.videoId && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 scale-75 group-hover:scale-100 transition-transform duration-500">
                                        <PlayCircle className="w-5 h-5 text-white fill-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                  <p className="font-black text-[12px] leading-tight text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-2 mb-1.5 tracking-tight">
                                    {rec.title || rec.query}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    {rec.channel ? (
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                                        <div className="w-1 h-1 rounded-full bg-red-500" />
                                        {rec.channel}
                                      </p>
                                    ) : (
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/10">
                                        <Sparkles className="w-2.5 h-2.5 text-primary" />
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Suggested</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                          <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 border border-dashed border-slate-200 dark:border-white/10">
                            <Youtube className="w-8 h-8 opacity-20" />
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recommendations yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Column - Full Height */}
                <div className="lg:col-span-8 h-auto lg:h-full min-h-0">
                  <NotesDisplay
                    notes={notes || ""}
                    isLoading={isLoadingNotes}
                    videoTitle={videoInfo?.title}
                    videoId={videoInfo?.id}
                    currentStep={currentStep}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Index;
