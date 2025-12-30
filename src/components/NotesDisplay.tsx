import { Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NotesDisplayProps {
  notes: string;
  isLoading: boolean;
  videoTitle?: string;
}

export function NotesDisplay({ notes, isLoading, videoTitle }: NotesDisplayProps) {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(notes);
    toast({
      title: "Copied!",
      description: "Notes copied to clipboard",
    });
  };

  const downloadAsTxt = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle || "notes"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Notes saved as text file",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Generating notes...</p>
        <p className="mt-1 text-sm text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  if (!notes) return null;

  return (
    <div className="animate-fade-in rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-card-foreground">Generated Notes</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsTxt}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-card-foreground">{notes}</div>
        </div>
      </div>
    </div>
  );
}
