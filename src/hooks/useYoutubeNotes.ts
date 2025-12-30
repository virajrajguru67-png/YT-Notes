import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
}

export function useYoutubeNotes() {
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchVideoInfo = async (videoId: string): Promise<VideoInfo | null> => {
    const { data, error } = await supabase.functions.invoke("fetch-video-info", {
      body: { videoId },
    });

    if (error) {
      console.error("Error fetching video info:", error);
      throw new Error("Failed to fetch video information");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  };

  const fetchTranscript = async (videoId: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("fetch-transcript", {
      body: { videoId },
    });

    if (error) {
      console.error("Error fetching transcript:", error);
      throw new Error("Failed to fetch transcript");
    }

    if (data.error) {
      throw new Error(data.message || data.error);
    }

    return data.transcript;
  };

  const generateNotes = async (transcript: string, videoTitle: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("generate-notes", {
      body: { transcript, videoTitle },
    });

    if (error) {
      console.error("Error generating notes:", error);
      throw new Error("Failed to generate notes");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data.notes;
  };

  const processVideo = async (url: string): Promise<{ video: VideoInfo; notes: string } | null> => {
    const videoId = extractVideoId(url);

    if (!videoId) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid YouTube video URL",
      });
      return null;
    }

    setIsLoadingVideo(true);
    setVideoInfo(null);
    setNotes("");

    try {
      // Fetch video info
      const video = await fetchVideoInfo(videoId);
      if (!video) throw new Error("Video not found");
      setVideoInfo(video);
      setIsLoadingVideo(false);

      // Fetch transcript and generate notes
      setIsLoadingNotes(true);
      const transcript = await fetchTranscript(videoId);
      const generatedNotes = await generateNotes(transcript, video.title);
      setNotes(generatedNotes);

      toast({
        title: "Notes generated!",
        description: "Your study notes are ready",
      });

      return { video, notes: generatedNotes };
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
      return null;
    } finally {
      setIsLoadingVideo(false);
      setIsLoadingNotes(false);
    }
  };

  const reset = () => {
    setVideoInfo(null);
    setNotes("");
  };

  return {
    isLoadingVideo,
    isLoadingNotes,
    videoInfo,
    notes,
    processVideo,
    setVideoInfo,
    setNotes,
    reset,
  };
}
