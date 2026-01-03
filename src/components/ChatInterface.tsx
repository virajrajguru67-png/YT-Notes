import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    notes: string;
    videoTitle?: string;
    embedded?: boolean;
}

export function ChatInterface({ notes, videoTitle, embedded = false }: ChatInterfaceProps) {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hi! Ask me anything about this video.`
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    context: notes,
                    videoTitle
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I encountered an error while processing your request. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex flex-col animate-fade-in overflow-hidden ${embedded ? 'h-full' : 'h-[600px] glass-card rounded-xl border border-white/10 mt-6'}`}>
            {/* Header removed for cleaner look */}

            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-black/5">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${msg.role === 'user' ? 'bg-primary/20 border-primary/20' : 'bg-white/10 border-white/5'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-muted-foreground" />}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={`
                                        rounded-2xl px-5 py-3 text-sm shadow-md
                                        ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-primary to-purple-600 text-white border border-primary/20'
                                            : 'bg-white/5 border border-white/10 text-foreground/90 backdrop-blur-sm'
                                        }
                                    `}
                                >
                                    <div className={`prose prose-sm dark:prose-invert max-w-none leading-relaxed break-words [&_p]:m-0 ${msg.role === 'user' ? '[&_p]:text-white' : ''}`}>
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex w-full justify-start animate-pulse">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/5 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="rounded-2xl px-5 py-3 bg-white/5 border border-white/10 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Analysing Context...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-3 max-w-3xl mx-auto relative"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for clarification or details..."
                        className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-sm h-12 pl-4 pr-12 rounded-xl shadow-inner placeholder:text-muted-foreground/50 transition-all focus:bg-white/10"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-lg transition-transform active:scale-95"
                    >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}
