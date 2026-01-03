import { useState, useEffect } from "react";
import { Sparkles, GraduationCap, ArrowRight, ArrowLeft, RotateCcw, CheckCircle2, XCircle, Trophy, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Flashcard {
    front: string;
    back: string;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface InteractiveStudyProps {
    notes: string;
    videoTitle?: string;
    videoId?: string;
}

export function InteractiveStudy({ notes, videoTitle, videoId }: InteractiveStudyProps) {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
    const [isQuizLoading, setIsQuizLoading] = useState(false);
    const { token } = useAuth();

    // Flashcard State
    const [currentFlashIdx, setCurrentFlashIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Quiz State
    const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizScore, setQuizScore] = useState(0);
    const [isQuizFinished, setIsQuizFinished] = useState(false);

    // View State
    const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>('flashcards');

    const generateFlashcards = async () => {
        setIsFlashcardLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:3001/api/generate-flashcards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ notes, videoTitle }),
            });
            const data = await res.json();
            if (data.flashcards) setFlashcards(data.flashcards);
        } catch (err) {
            toast.error("Failed to generate flashcards");
        } finally {
            setIsFlashcardLoading(false);
        }
    };

    const generateQuiz = async () => {
        setIsQuizLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:3001/api/generate-quiz", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ notes, videoTitle, videoId }),
            });
            const data = await res.json();
            if (data.quiz) setQuiz(data.quiz);
        } catch (err) {
            toast.error("Failed to generate quiz");
        } finally {
            setIsQuizLoading(false);
        }
    };

    const handleNextFlashcard = () => {
        setIsFlipped(false);
        setCurrentFlashIdx((prev) => (prev + 1) % flashcards.length);
    };

    const handlePrevFlashcard = () => {
        setIsFlipped(false);
        setCurrentFlashIdx((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    };

    const handleQuizAnswer = async (idx: number) => {
        if (selectedOption !== null) return;
        setSelectedOption(idx);
        const currentQuestion = quiz[currentQuizIdx];

        if (idx === currentQuestion.correctAnswer) {
            setQuizScore(prev => prev + 1);
            toast.success("Correct!");
        } else {
            toast.error("Not quite!");
            // Report mistake to backend for adaptive learning
            try {
                await fetch("http://127.0.0.1:3001/api/report-mistake", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        videoId,
                        question: currentQuestion.question,
                        correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
                        userAnswer: currentQuestion.options[idx]
                    }),
                });
            } catch (err) {
                console.error("Failed to report mistake:", err);
            }
        }
    };

    const nextQuizQuestion = () => {
        if (currentQuizIdx + 1 < quiz.length) {
            setCurrentQuizIdx(prev => prev + 1);
            setSelectedOption(null);
        } else {
            setIsQuizFinished(true);
        }
    };

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {/* Header section with a bit more punch */}
            {/* Header section removed */}

            <div className="space-y-6">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveTab(prev => prev === 'flashcards' ? 'quiz' : 'flashcards')}
                        className="hover:bg-white/10 rounded-full h-10 w-10 hover:scale-110 transition-transform"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center gap-2 mb-1.5 text-sm font-bold uppercase tracking-widest whitespace-nowrap">
                            {activeTab === 'flashcards' ? <Sparkles className="w-4 h-4 text-primary" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                            <span>{activeTab === 'flashcards' ? 'Active Recall' : 'Knowledge Quiz'}</span>
                        </div>
                        <div className="flex gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${activeTab === 'flashcards' ? 'bg-primary w-4' : 'bg-white/20'}`} />
                            <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${activeTab === 'quiz' ? 'bg-primary w-4' : 'bg-white/20'}`} />
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveTab(prev => prev === 'flashcards' ? 'quiz' : 'flashcards')}
                        className="hover:bg-white/10 rounded-full h-10 w-10 hover:scale-110 transition-transform"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {activeTab === 'flashcards' ? (
                    /* Flashcards Section */
                    <div className="relative min-h-[360px] sm:min-h-[420px] animate-in fade-in slide-in-from-left-8 duration-500">
                        <div className="relative h-full p-4 sm:p-6 rounded-3xl flex flex-col border border-border dark:border-white/5 bg-card/50 dark:bg-black/40 backdrop-blur-md">
                            {flashcards.length > 0 && (
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                                        Question
                                    </span>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-primary">
                                            {currentFlashIdx + 1} <span className="text-muted-foreground/30 mx-1">/</span> {flashcards.length}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {flashcards.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                                        <RotateCcw className="w-6 h-6 text-foreground/20 animate-pulse" />
                                    </div>
                                    <h5 className="font-bold text-sm mb-2">Ready to Memorize?</h5>
                                    <p className="text-[11px] text-muted-foreground max-w-[200px] mb-8 leading-relaxed">
                                        Create a set of 10 high-impact flashcards optimized for long-term retention.
                                    </p>
                                    <Button
                                        onClick={generateFlashcards}
                                        disabled={isFlashcardLoading}
                                        className="w-full bg-white text-black hover:bg-white/90 font-bold h-11 rounded-1.5xl transition-all active:scale-95 shadow-lg shadow-white/5"
                                    >
                                        {isFlashcardLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Generate Flashcards"
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div
                                        className="flex-1 relative cursor-pointer perspective-1000 mb-6 min-h-[200px]"
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        <div className={`relative w-full h-full transition-all duration-700 preserve-3d grid grid-cols-1 ${isFlipped ? 'rotate-y-180' : ''}`}>
                                            {/* Front */}
                                            <div className="col-start-1 row-start-1 backface-hidden bg-card border border-border dark:border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl w-full h-full">
                                                <div className="flex-1 w-full flex items-center justify-center my-2 px-4">
                                                    <p className="text-base sm:text-lg font-bold leading-relaxed text-foreground text-center break-words whitespace-pre-wrap select-none">{flashcards[currentFlashIdx].front}</p>
                                                </div>

                                                <div className="w-full flex justify-center mt-2">
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-primary animate-bounce bg-primary/10 px-3 py-1 rounded-full">
                                                        <span>CLICK TO REVEAL</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Back */}
                                            <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl w-full h-full">
                                                <div className="flex-1 w-full flex items-center justify-center my-2 px-4">
                                                    <p className="text-sm sm:text-base font-medium leading-relaxed text-foreground dark:text-white/90 text-center break-words whitespace-pre-wrap select-none">{flashcards[currentFlashIdx].back}</p>
                                                </div>

                                                {/* Filler to match front spacing */}
                                                <div className="w-full flex justify-center mt-2 opacity-0">
                                                    <div className="px-3 py-1"><span>Placeholder</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-6">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handlePrevFlashcard}
                                            className="rounded-full h-10 w-10 border-white/10 hover:bg-white/5 bg-black/20"
                                        >
                                            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="min-w-[100px] text-[11px] font-bold uppercase tracking-widest border border-white/5 hover:bg-white/5 h-10 rounded-full bg-white/5"
                                            onClick={() => setIsFlipped(!isFlipped)}
                                        >
                                            Flip Card
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleNextFlashcard}
                                            className="rounded-full h-10 w-10 border-white/10 hover:bg-white/5 bg-black/20"
                                        >
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Quiz Section */
                    <div className="relative min-h-[420px] animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="relative h-full p-6 rounded-3xl flex flex-col border border-border dark:border-white/5 bg-card/50 dark:bg-black/40 backdrop-blur-md">
                            {quiz.length > 0 && !isQuizFinished && (
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                                        Question
                                    </span>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-primary">
                                            Q{currentQuizIdx + 1} <span className="text-muted-foreground/30 mx-1">/</span> {quiz.length}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {quiz.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                                        <CheckCircle2 className="w-6 h-6 text-foreground/40" />
                                    </div>
                                    <h5 className="font-bold text-sm mb-2">Challenge Your Mind</h5>
                                    <p className="text-[11px] text-muted-foreground max-w-[200px] mb-8 leading-relaxed">
                                        Test your understanding with a dynamically generated 5-question quiz.
                                    </p>
                                    <Button
                                        onClick={generateQuiz}
                                        disabled={isQuizLoading}
                                        className="w-full bg-white text-black hover:bg-white/90 font-bold h-11 rounded-1.5xl transition-all active:scale-95 border-none shadow-lg shadow-white/5"
                                    >
                                        {isQuizLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Start Quiz Master"
                                        )}
                                    </Button>
                                </div>
                            ) : isQuizFinished ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
                                        <div className="relative w-24 h-24 rounded-full bg-black flex items-center justify-center border-4 border-yellow-500/40 animate-pulse-slow">
                                            <Trophy className="w-12 h-12 text-yellow-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="text-2xl font-bold tracking-tight">Session Results</h5>
                                        <p className="text-sm text-muted-foreground">Your proficiency: <span className="text-yellow-500 font-bold">{Math.round((quizScore / quiz.length) * 100)}%</span></p>
                                        {quizScore === quiz.length && (
                                            <div className="mt-4 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 animate-bounce">
                                                <Sparkles className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Topic Master Earned</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-around">
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground/50 uppercase font-bold mb-1">Score</div>
                                            <div className="text-lg font-bold">{quizScore}</div>
                                        </div>
                                        <div className="w-px bg-white/10"></div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground/50 uppercase font-bold mb-1">Total</div>
                                            <div className="text-lg font-bold">{quiz.length}</div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setQuiz([]);
                                            setCurrentQuizIdx(0);
                                            setIsQuizFinished(false);
                                            setQuizScore(0);
                                            setSelectedOption(null);
                                        }}
                                        variant="ghost"
                                        className="w-full h-11 rounded-xl gap-2 font-bold text-xs uppercase tracking-widest hover:bg-white/5"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reset Challenge
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <p className="text-lg font-bold mb-8 leading-tight tracking-tight">
                                        {quiz[currentQuizIdx].question}
                                    </p>
                                    <div className="space-y-3 flex-1">
                                        {quiz[currentQuizIdx].options.map((option, idx) => {
                                            const isCorrect = idx === quiz[currentQuizIdx].correctAnswer;
                                            const isSelected = selectedOption === idx;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleQuizAnswer(idx)}
                                                    disabled={selectedOption !== null}
                                                    className={`
                                                    w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group/opt
                                                    ${selectedOption === null
                                                            ? 'bg-black/40 border-white/5 hover:border-primary/50 hover:bg-primary/5'
                                                            : isCorrect
                                                                ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                                                                : isSelected
                                                                    ? 'bg-red-500/20 border-red-500/50 text-red-400 opacity-100'
                                                                    : 'bg-black/20 border-white/5 opacity-30 scale-98'
                                                        }
                                                `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                        w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors
                                                        ${selectedOption === null ? 'border-white/10 bg-white/5 group-hover/opt:border-white/30 group-hover/opt:bg-white/10' : ''}
                                                        ${selectedOption !== null && isCorrect ? 'border-green-500/50 bg-green-500/20 text-green-400' : ''}
                                                        ${isSelected && !isCorrect ? 'border-red-500/50 bg-red-500/20 text-red-400' : ''}
                                                    `}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className="text-xs font-medium">{option}</span>
                                                    </div>
                                                    {selectedOption !== null && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                                    {selectedOption !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedOption !== null && (
                                        <Button onClick={nextQuizQuestion} className="w-full h-12 mt-6 gap-2 bg-white text-black hover:bg-white/90 font-bold rounded-2xl animate-in slide-in-from-bottom-2">
                                            {currentQuizIdx + 1 === quiz.length ? "View Final Score" : "Next Question"}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
