import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CollectionItem {
    id: number;
    collection_id: number;
    note_id: number;
    title: string;
    thumbnail: string;
    video_id: string;
    added_at: string;
    notes?: string;
}

export interface Collection {
    id: number;
    user_id: number;
    name: string;
    description: string;
    created_at: string;
    items: CollectionItem[];
}

export function useCollections() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();

    const fetchCollections = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/collections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCollections(data);
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const createCollection = async (name: string, description: string = "") => {
        if (!token) return;
        try {
            const response = await fetch('http://localhost:3001/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
            });

            if (response.ok) {
                toast.success("Course created successfully");
                fetchCollections();
            } else {
                toast.error("Failed to create course");
            }
        } catch (error) {
            toast.error("Error creating course");
        }
    };

    const addToCollection = async (collectionId: number, noteId: number) => {
        if (!token) return;
        try {
            const response = await fetch(`http://localhost:3001/api/collections/${collectionId}/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ noteId })
            });

            if (response.ok) {
                toast.success("Added to course");
                fetchCollections();
            } else {
                toast.error("Failed to add note to course");
            }
        } catch (error) {
            toast.error("Error adding to course");
        }
    };

    const deleteCollection = async (collectionId: number) => {
        if (!token) return;
        try {
            const response = await fetch(`http://localhost:3001/api/collections/${collectionId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Course deleted");
                fetchCollections();
            } else {
                toast.error("Failed to delete course");
            }
        } catch (error) {
            toast.error("Error deleting course");
        }
    };

    return {
        collections,
        isLoading,
        fetchCollections,
        createCollection,
        addToCollection,
        deleteCollection
    };
}
