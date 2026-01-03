import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface HistoryItem {
  id: number;
  videoId: string;
  title: string;
  thumbnail: string;
  notes: string;
  createdAt: string;
  video_id: string;
  video_title: string;
  video_thumbnail: string;
  created_at: string;
  user_id: number;
}

const API_BASE_URL = 'http://127.0.0.1:3001/api';

export function useNotesHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { token, isAuthenticated } = useAuth();

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend names to frontend names if necessary
        const mappedData = data.map((item: any) => ({
          ...item,
          videoId: item.video_id,
          title: item.video_title || item.title,
          thumbnail: item.thumbnail || item.video_thumbnail,
          createdAt: item.created_at
        }));
        setHistory(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch history from MySQL:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, token]);

  const addToHistory = (item: any) => {
    // We already save to DB in the processVideo hook, 
    // so we just refresh the history here
    fetchHistory();
  };

  const clearHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const deleteNote = async (id: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return { history, addToHistory, clearHistory, deleteNote, fetchHistory };
}
