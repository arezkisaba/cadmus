import type { IFlashcard, IFlashcardCategory } from '@shared/models/FlashcardModels';
import { ArrowLeft, CheckCircle2, PartyPopper, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DI_CONSTANTS } from '@/di-constants';
import { useInjection } from '@/hooks/use-container';
import type { ICategoriesService } from '../../categories/services/ports/ICategoriesService';
import { FlashcardCard } from '../components/FlashcardCard';
import type { IFlashcardService } from '../services/ports/IFlashcardService';

export const FlashcardReviewPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const flashcardsService = useInjection<IFlashcardService>(DI_CONSTANTS.IFlashcardService);

    const [category, setCategory] = useState<IFlashcardCategory | undefined>(undefined);
    const [deck, setDeck] = useState<IFlashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async (): Promise<void> => {
            if (categoryId === undefined) {
                return;
            }
            const [loadedCategory, loadedCards] = await Promise.all([
                categoriesService.getById(categoryId),
                flashcardsService.getDueFlashcards(categoryId),
            ]);
            if (cancelled) {
                return;
            }
            setCategory(loadedCategory);
            setDeck(loadedCards);
            setLoading(false);
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [categoryId, categoriesService, flashcardsService]);

    useEffect(() => {
        for (const card of deck) {
            if (card.imageUrl) {
                const image = new window.Image();
                image.src = card.imageUrl;
            }
        }
    }, [deck]);

    const handleAnswer = useCallback(
        async (correct: boolean): Promise<void> => {
            const current = deck[index];
            if (current === undefined) {
                return;
            }
            await flashcardsService.answer(current, correct);
            if (correct) {
                setCorrectCount((prev) => prev + 1);
            } else {
                setWrongCount((prev) => prev + 1);
            }
            if (index + 1 >= deck.length) {
                setFinished(true);
            } else {
                setIndex((prev) => prev + 1);
            }
        },
        [deck, index, flashcardsService]
    );

    const handleBack = useCallback((): void => {
        navigate('/');
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[24rem] w-full max-w-md rounded-3xl" />
            </div>
        );
    }

    if (category === undefined) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <h2 className="text-xl font-semibold">Category not found</h2>
                <Button onClick={handleBack}>
                    <ArrowLeft />
                    Back to categories
                </Button>
            </div>
        );
    }

    if (deck.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="size-8" />
                </div>
                <h2 className="text-xl font-semibold">All caught up!</h2>
                <p className="text-muted-foreground max-w-sm text-sm">
                    No flashcards are due for review in "{category.name}". Come back later or create a new category.
                </p>
                <Button onClick={handleBack}>
                    <ArrowLeft />
                    Back to categories
                </Button>
            </div>
        );
    }

    if (finished) {
        const total = correctCount + wrongCount;
        const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8 text-center">
                <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
                    <PartyPopper className="size-10" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold">Session complete!</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        You reviewed {total} cards in "{category.name}".
                    </p>
                </div>
                <Card className="grid w-full grid-cols-3 gap-2 p-4">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl font-bold">{total}</span>
                        <span className="text-muted-foreground text-xs">Reviewed</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                            {correctCount}
                        </span>
                        <span className="text-muted-foreground text-xs">Correct</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-2xl font-bold text-red-600 dark:text-red-400">
                            <XCircle className="size-5" />
                            {wrongCount}
                        </span>
                        <span className="text-muted-foreground text-xs">Wrong</span>
                    </div>
                </Card>
                <Card className="w-full p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-semibold">{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} />
                </Card>
                <Button size="lg" onClick={handleBack}>
                    Done
                </Button>
            </div>
        );
    }

    const current = deck[index];
    const progressValue = Math.round((index / deck.length) * 100);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" onClick={handleBack} aria-label="Back to categories">
                    <ArrowLeft />
                </Button>
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{category.name}</h2>
                    <p className="text-muted-foreground text-xs">
                        Card {index + 1} of {deck.length}
                    </p>
                </div>
            </div>
            <Progress value={progressValue} />
            <FlashcardCard
                key={current.id}
                card={current}
                sourceLang={category.sourceLang}
                targetLang={category.targetLang}
                onAnswer={handleAnswer}
            />
        </div>
    );
};
