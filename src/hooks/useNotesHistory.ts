import { useState, useEffect } from "react";

interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  notes: string;
  createdAt: number;
}

const STORAGE_KEY = "youtube-notes-history";
const MAX_HISTORY = 5;

export function useNotesHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, "id" | "createdAt">) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((h) => h.videoId !== item.videoId);
      // Add new item at the beginning
      const updated = [newItem, ...filtered];
      // Keep only MAX_HISTORY items
      return updated.slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addToHistory, clearHistory };
}
