import { Loader2, Send, Sparkles } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DI_CONSTANTS } from '@/di-constants';
import type { ISettingsService } from '@/features/settings/services/ports/ISettingsService';
import { useInjection } from '@/hooks/use-container';
import type { IAiMessage } from '../../ai/services/ai-utils';
import type { IAiGenerationService } from '../../ai/services/ports/IAiGenerationService';

const SUGGESTIONS: string[] = [
    'Explain a grammar rule of the language I am learning, with examples.',
    'Give me 5 common expressions and what they mean.',
    'Correct this sentence and explain the mistake: "I am agree with you".',
    'How do I order food politely?',
    'Conjugate a common verb in the past tense.',
    'Explain the difference between two words that are easy to confuse.',
];

export const ChatPage: React.FC = () => {
    const aiService = useInjection<IAiGenerationService>(DI_CONSTANTS.IAiGenerationService);
    const settingsService = useInjection<ISettingsService>(DI_CONSTANTS.ISettingsService);
    const [messages, setMessages] = useState<IAiMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = useCallback((): void => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const sendMessage = useCallback(
        async (content: string): Promise<void> => {
            const trimmed = content.trim();
            if (trimmed.length === 0 || loading) {
                return;
            }
            const history: IAiMessage[] = [...messages, { role: 'user', content: trimmed }];
            setMessages(history);
            setInput('');
            setLoading(true);
            try {
                const settings = settingsService.getSettings();
                const reply = await aiService.chat(history, settings.sourceLang, settings.targetLang);
                setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
                scrollToBottom();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to get an answer';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        },
        [messages, loading, aiService, settingsService, scrollToBottom]
    );

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="shrink-0">
                <h2 className="text-2xl font-semibold tracking-tight">Chat</h2>
                <p className="text-muted-foreground text-sm">Ask anything about the language you are learning. Try a suggestion below.</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Sparkles className="size-4" />
                            Suggestions
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => sendMessage(suggestion)}
                                    disabled={loading}
                                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {messages.map((message, index) => (
                            <div key={`${index}-${message.role}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                                <div
                                    className={
                                        message.role === 'user'
                                            ? 'bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2 text-sm'
                                            : 'bg-muted max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2 text-sm whitespace-pre-wrap'
                                    }
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <p className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Loader2 className="size-4 animate-spin" />
                                Thinking...
                            </p>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t pt-3 pb-[env(safe-area-inset-bottom)]">
                <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            sendMessage(input);
                        }
                    }}
                    placeholder="Ask your language question..."
                    disabled={loading}
                />
                <Button onClick={() => sendMessage(input)} disabled={loading || input.trim().length === 0}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Send />}
                    Send
                </Button>
            </div>
        </div>
    );
};
