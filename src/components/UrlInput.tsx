import { useState } from "react";
import { Link2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const isValidYoutubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).+/;
    return pattern.test(url);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste YouTube video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-14 pl-12 pr-4 text-base"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-14 px-8 text-base font-medium"
          disabled={isLoading || !url.trim() || !isValidYoutubeUrl(url)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Notes
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
      {url && !isValidYoutubeUrl(url) && (
        <p className="mt-2 text-sm text-destructive">Please enter a valid YouTube URL</p>
      )}
    </form>
  );
}
