import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
  hasCaptions?: boolean;
}

const API_BASE_URL = 'http://127.0.0.1:3001/api';

export function useYoutubeNotes() {
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { token } = useAuth();

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

  const processVideo = async (
    url: string,
    manualTranscript?: string
  ): Promise<{ video: VideoInfo; notes: string } | null> => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid YouTube URL" });
      return null;
    }

    setIsLoadingVideo(true);
    setIsLoadingNotes(true);
    setCurrentStep("Initializing...");
    setVideoInfo(null);
    setNotes("");

    try {
      const response = await fetch(`${API_BASE_URL}/process-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ videoId, manualTranscript })
      });

      if (!response.ok) throw new Error('Failed to start processing');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let resultVideo = null;
      let resultNotes = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setCurrentStep(data.message);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              } else if (data.type === 'done') {
                setVideoInfo(data.video);
                setNotes(data.notes);
                resultVideo = data.video;
                resultNotes = data.notes;
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }

      if (resultVideo && resultNotes) {
        toast({ title: "Notes generated!", description: "Saved to your library." });
        return { video: resultVideo, notes: resultNotes };
      }
      return null;

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      return null;
    } finally {
      setIsLoadingVideo(false);
      setIsLoadingNotes(false);
      setCurrentStep("");
    }
  };

  const reset = () => {
    setVideoInfo(null);
    setNotes("");
    setCurrentStep("");
  };

  return {
    isLoadingVideo,
    isLoadingNotes,
    currentStep,
    videoInfo,
    notes,
    processVideo,
    setVideoInfo,
    setNotes,
    setCurrentStep,
    reset,
  };
}
