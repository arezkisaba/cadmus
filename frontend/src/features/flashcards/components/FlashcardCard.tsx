import type { IFlashcard } from '@shared/models/FlashcardModels';
import { Check, Eye, History, Languages, Volume2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { speak } from '@/features/_shared/utils/speech';

interface IFlashcardCardProps {
    card: IFlashcard;
    sourceLang: string;
    targetLang: string;
    onAnswer: (correct: boolean) => void;
}

const CardStats: React.FC<{ card: IFlashcard }> = ({ card }) => (
    <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            {card.correctCount}
        </span>
        <span className="flex items-center gap-1">
            <X className="size-3.5 text-red-600 dark:text-red-400" />
            {card.wrongCount}
        </span>
        <span className="flex items-center gap-1">
            <History className="size-3.5" />
            {card.reviewCount}
        </span>
        <Badge variant="secondary" className="font-mono text-xs">
            Lv. {card.level}
        </Badge>
    </div>
);

export const FlashcardCard: React.FC<IFlashcardCardProps> = ({ card, sourceLang, targetLang, onAnswer }) => {
    const [flipped, setFlipped] = useState(false);
    const [displayImage] = useState<string | null>(() => {
        const candidates = [card.imageUrl, card.imageUrl2].filter((url): url is string => typeof url === 'string' && url.length > 0);
        if (candidates.length === 0) {
            return null;
        }
        return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    });

    const handleReveal = useCallback((): void => {
        setFlipped(true);
    }, []);

    const handleAnswer = useCallback(
        (correct: boolean): void => {
            onAnswer(correct);
            setFlipped(false);
        },
        [onAnswer]
    );

    return (
        <div className="flip-card mx-auto h-[26rem] w-full max-w-md select-none">
            <div className={`flip-card-inner relative h-full w-full ${flipped ? 'is-flipped' : ''}`}>
                <div className="flip-card-face bg-card border-border absolute inset-0 flex flex-col rounded-3xl border p-5 shadow-lg">
                    <CardStats card={card} />
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <div className="flex flex-col items-center gap-3">
                            {displayImage ? (
                                <img
                                    src={displayImage}
                                    alt={card.front}
                                    className="h-32 w-32 rounded-2xl border border-gray-200 object-cover dark:border-gray-700"
                                    decoding="async"
                                />
                            ) : (
                                <div className="bg-muted text-muted-foreground flex h-32 w-32 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <Languages className="size-10" />
                                </div>
                            )}
                            <span className="text-center text-3xl font-bold">{card.front}</span>
                            {card.frontDefinition !== undefined && card.frontDefinition.length > 0 && (
                                <span className="text-muted-foreground max-w-sm text-center text-sm">{card.frontDefinition}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => speak(card.front, sourceLang)}
                                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                aria-label={`Listen to ${card.front}`}
                            >
                                <Volume2 className="size-4" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 flex h-12 w-full">
                        <Button variant="outline" className="w-full" onClick={handleReveal}>
                            <Eye />
                            Reveal
                        </Button>
                    </div>
                </div>

                <div className="flip-card-face flip-card-back bg-card border-border absolute inset-0 flex flex-col rounded-3xl border p-5 shadow-lg">
                    <CardStats card={card} />
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <div className="flex flex-col items-center gap-3">
                            {displayImage ? (
                                <img
                                    src={displayImage}
                                    alt={card.back}
                                    className="h-32 w-32 rounded-2xl border border-gray-200 object-cover dark:border-gray-700"
                                    decoding="async"
                                />
                            ) : (
                                <div className="bg-muted text-muted-foreground flex h-32 w-32 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <Languages className="size-10" />
                                </div>
                            )}
                            <span className="text-primary text-center text-3xl font-bold">{card.back}</span>
                            {card.backDefinition !== undefined && card.backDefinition.length > 0 && (
                                <span className="text-muted-foreground max-w-sm text-center text-sm">{card.backDefinition}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => speak(card.back, targetLang)}
                                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                aria-label={`Listen to ${card.back}`}
                            >
                                <Volume2 className="size-4" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 flex h-12 w-full gap-3">
                        <Button
                            variant="outline"
                            className="hover:bg-red-500/10 flex-1 border-red-500/40 text-red-600"
                            onClick={() => handleAnswer(false)}
                        >
                            <X />I didn't know
                        </Button>
                        <Button className="flex-1" onClick={() => handleAnswer(true)}>
                            <Check />I knew it
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
