import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, FileText, Sparkles, BrainCircuit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Collection } from "@/hooks/useCollections";
import { InteractiveStudy } from "@/components/InteractiveStudy";

export default function CollectionPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [studyMode, setStudyMode] = useState(false);

    useEffect(() => {
        const fetchCollection = async () => {
            if (!token || !id) return;
            try {
                const response = await fetch(`/api/collections/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data: Collection = await response.json();
                    setCollection(data);
                } else {
                    toast.error("Failed to load course");
                }
            } catch (error) {
                console.error("Error fetching collection:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCollection();
    }, [id, token]);

    const handleSynthesize = async () => {
        if (!collection || !collection.items.length) return;
        setIsSynthesizing(true);
        try {
            const noteIds = collection.items.map(item => item.note_id);
            const response = await fetch('/api/synthesize-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ noteIds })
            });

            if (response.ok) {
                const data = await response.json();
                navigator.clipboard.writeText(data.synthesis);
                toast.success("Master Guide Generated! Copied to clipboard.");
            } else {
                toast.error("Failed to synthesize guide");
            }
        } catch (error) {
            toast.error("Error synthesizing");
        } finally {
            setIsSynthesizing(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
    if (!collection) return <div className="min-h-screen bg-background flex items-center justify-center">Course not found</div>;

    const combinedNotes = collection.items.map(item => item.notes || "").join("\n\n");

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 lg:pl-[280px] p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">
                    {studyMode ? (
                        <div className="space-y-6">
                            <Button variant="ghost" className="gap-2" onClick={() => setStudyMode(false)}>
                                <ArrowLeft className="w-4 h-4" /> Back to Course Overview
                            </Button>
                            <InteractiveStudy
                                notes={combinedNotes}
                                videoTitle={collection.name}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-primary mb-2">
                                    <BookOpen className="w-6 h-6" />
                                    <span className="text-sm font-bold uppercase tracking-widest">Knowledge Course</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight lg:text-5xl">{collection.name}</h1>
                                <p className="text-xl text-muted-foreground">{collection.items.length} Modules • Created {new Date(collection.created_at).toLocaleDateString()}</p>
                            </div>

                            <div className="flex flex-wrap gap-4 p-6 rounded-2xl bg-secondary/30 border border-border">
                                <Button
                                    size="lg"
                                    className="font-bold gap-2 text-md h-12 rounded-xl"
                                    onClick={handleSynthesize}
                                    disabled={isSynthesizing || collection.items.length < 2}
                                >
                                    {isSynthesizing ? (
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <BrainCircuit className="w-5 h-5" />
                                    )}
                                    {isSynthesizing ? "Synthesizing..." : "Generate Master Guide (AI)"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="font-bold gap-2 text-md h-12 rounded-xl"
                                    onClick={() => setStudyMode(true)}
                                    disabled={collection.items.length === 0}
                                >
                                    <Play className="w-5 h-5" />
                                    Start Course Quiz
                                </Button>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {collection.items.map((item, index) => (
                                    <div key={item.id} className="group relative aspect-video rounded-xl overflow-hidden bg-muted border border-border cursor-pointer hover:ring-2 ring-primary transition-all">
                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">Module {index + 1}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 drop-shadow-lg group-hover:scale-105 transition-transform origin-bottom-left">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-white drop-shadow-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
