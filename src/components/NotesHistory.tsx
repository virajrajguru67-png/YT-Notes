import { Clock, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  notes: string;
  createdAt: number;
}

interface NotesHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export function NotesHistory({ history, onSelect, onClear }: NotesHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-card-foreground">Recent Notes</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="p-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                className="h-12 w-20 rounded object-cover"
              />
              <div className="flex-1 overflow-hidden">
                <p className="line-clamp-1 text-sm font-medium text-card-foreground">
                  {item.title}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
