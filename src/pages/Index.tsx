import { Helmet } from "react-helmet-async";
import { FileText, Sparkles, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { UrlInput } from "@/components/UrlInput";
import { VideoPreview } from "@/components/VideoPreview";
import { NotesDisplay } from "@/components/NotesDisplay";
import { NotesHistory } from "@/components/NotesHistory";
import { useYoutubeNotes } from "@/hooks/useYoutubeNotes";
import { useNotesHistory } from "@/hooks/useNotesHistory";

const Index = () => {
  const {
    isLoadingVideo,
    isLoadingNotes,
    videoInfo,
    notes,
    processVideo,
    setVideoInfo,
    setNotes,
  } = useYoutubeNotes();

  const { history, addToHistory, clearHistory } = useNotesHistory();

  const handleSubmit = async (url: string, manualTranscript?: string) => {
    const result = await processVideo(url, manualTranscript);
    if (result) {
      addToHistory({
        videoId: result.video.id,
        title: result.video.title,
        thumbnail: result.video.thumbnail,
        notes: result.notes,
      });
    }
  };

  const handleHistorySelect = (item: {
    videoId: string;
    title: string;
    thumbnail: string;
    notes: string;
  }) => {
    setVideoInfo({
      id: item.videoId,
      title: item.title,
      channelTitle: "",
      thumbnail: item.thumbnail,
      description: "",
    });
    setNotes(item.notes);
  };

  return (
    <>
      <Helmet>
        <title>NoteTube - YouTube Video Notes Generator</title>
        <meta
          name="description"
          content="Transform YouTube videos into beginner-friendly study notes with AI. Generate comprehensive notes from any YouTube video instantly."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8 lg:py-12">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Turn YouTube Videos into
              <span className="text-primary"> Study Notes</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Paste any YouTube video URL and get comprehensive, beginner-friendly notes
              powered by AI. Perfect for learning from tutorials, lectures, and educational content.
            </p>
          </section>

          {/* Input Section */}
          <section className="mx-auto mb-12 max-w-3xl">
            <UrlInput onSubmit={handleSubmit} isLoading={isLoadingVideo || isLoadingNotes} />
          </section>

          {/* Features */}
          {!videoInfo && !notes && (
            <section className="mx-auto mb-12 max-w-4xl">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-card-foreground">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced AI transforms transcripts into clear, organized study notes
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-card-foreground">Beginner-Friendly</h3>
                  <p className="text-sm text-muted-foreground">
                    Notes are written in simple language, perfect for learning new topics
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-card-foreground">Save Time</h3>
                  <p className="text-sm text-muted-foreground">
                    Get comprehensive notes in seconds instead of watching entire videos
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              <VideoPreview video={videoInfo} isLoading={isLoadingVideo} />
              <NotesDisplay
                notes={notes}
                isLoading={isLoadingNotes}
                videoTitle={videoInfo?.title}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <NotesHistory
                history={history}
                onSelect={handleHistorySelect}
                onClear={clearHistory}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;
