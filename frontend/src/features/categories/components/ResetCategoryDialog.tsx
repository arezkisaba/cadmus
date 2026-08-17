import type { IFlashcardCategory } from '@shared/models/FlashcardModels';
import { Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { DI_CONSTANTS } from '@/di-constants';
import { getLanguageLabel } from '@/features/settings/models/languages';
import { useInjection } from '@/hooks/use-container';
import { CARD_COUNT_OPTIONS, DEFAULT_CARD_COUNT } from '../card-count';
import { getDifficultyLabel, getFlashcardTypeLabel } from '../flashcard-types';
import type { ICategoriesService } from '../services/ports/ICategoriesService';

interface IResetCategoryDialogProps {
    category: IFlashcardCategory | null;
    initialCount?: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ResetCategoryDialog: React.FC<IResetCategoryDialogProps> = ({ category, initialCount, open, onOpenChange }) => {
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const [cardCount, setCardCount] = useState(initialCount ?? DEFAULT_CARD_COUNT);
    const [loading, setLoading] = useState(false);
    const [progressText, setProgressText] = useState('');

    const handleReset = useCallback(async (): Promise<void> => {
        if (category === undefined || category === null) {
            return;
        }
        setLoading(true);
        setProgressText('Regenerating cards with AI...');
        try {
            await categoriesService.resetCategory(category.id, cardCount, (stage) => setProgressText(stage));
            toast.success('Category reset');
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reset category';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [category, cardCount, categoriesService, onOpenChange]);

    const handleOpenChange = useCallback(
        (next: boolean): void => {
            if (!loading) {
                onOpenChange(next);
            }
        },
        [loading, onOpenChange]
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={!loading}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="size-4" />
                        Reset category
                    </DialogTitle>
                    <DialogDescription>
                        Regenerates the cards with AI, which resets all progress and flashcards. You can pick a new number of cards.
                    </DialogDescription>
                </DialogHeader>
                {category !== null && category !== undefined && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
                            <span className="font-semibold">{category.name}</span>
                            <span className="text-muted-foreground italic">"{category.prompt}"</span>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {getFlashcardTypeLabel(category.type)}
                                </Badge>
                                <Badge variant="outline" className="font-mono text-xs">
                                    {getDifficultyLabel(category.difficulty)}
                                </Badge>
                                <span className="text-muted-foreground font-mono text-xs">
                                    {getLanguageLabel(category.sourceLang)} → {getLanguageLabel(category.targetLang)}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:max-w-[14rem]">
                            <Label htmlFor="reset-card-count">Number of cards</Label>
                            <Select
                                id="reset-card-count"
                                value={String(cardCount)}
                                onChange={(event) => setCardCount(Number(event.target.value))}
                                disabled={loading}
                            >
                                {CARD_COUNT_OPTIONS.map((count) => (
                                    <option key={count} value={count}>
                                        {count} cards
                                    </option>
                                ))}
                            </Select>
                        </div>
                        {loading && (
                            <div className="flex flex-col gap-2">
                                <Progress value={undefined} />
                                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                                    <Loader2 className="size-4 animate-spin" />
                                    {progressText}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleReset} disabled={loading || category === null || category === undefined}>
                        {loading ? 'Resetting...' : 'Reset & regenerate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
