import type { DifficultyLevel, FlashcardType } from '@shared/models/FlashcardModels';
import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DI_CONSTANTS } from '@/di-constants';
import { LANGUAGES } from '@/features/settings/models/languages';
import type { ISettingsService } from '@/features/settings/services/ports/ISettingsService';
import { useInjection } from '@/hooks/use-container';
import { CARD_COUNT_OPTIONS, DEFAULT_CARD_COUNT } from '../card-count';
import { DIFFICULTY_LEVELS, FLASHCARD_TYPES } from '../flashcard-types';
import type { ICategoriesService } from '../services/ports/ICategoriesService';

interface ICreateCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CreateCategoryDialog: React.FC<ICreateCategoryDialogProps> = ({ open, onOpenChange }) => {
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const settingsService = useInjection<ISettingsService>(DI_CONSTANTS.ISettingsService);
    const initialSettings = settingsService.getSettings();
    const [prompt, setPrompt] = useState('');
    const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);
    const [contentType, setContentType] = useState<FlashcardType>('word');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
    const [sourceLang, setSourceLang] = useState(initialSettings.sourceLang);
    const [targetLang, setTargetLang] = useState(initialSettings.targetLang);
    const [loading, setLoading] = useState(false);
    const [progressText, setProgressText] = useState('');

    const handleCreate = useCallback(async (): Promise<void> => {
        const trimmed = prompt.trim();
        if (trimmed.length === 0) {
            return;
        }
        setLoading(true);
        setProgressText(`Generating ${contentType} cards with AI...`);
        try {
            await categoriesService.createFromPrompt(
                trimmed,
                { sourceLang, targetLang },
                (stage) => setProgressText(stage),
                cardCount,
                contentType,
                difficulty
            );
            toast.success('Category created');
            setPrompt('');
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create category';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [prompt, sourceLang, targetLang, cardCount, contentType, difficulty, categoriesService, onOpenChange]);

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
                        <Sparkles className="size-4" />
                        New category
                    </DialogTitle>
                    <DialogDescription>Describe a theme, AI builds a list of flashcards in the language pair of your choice.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="dialog-source-lang">Source language</Label>
                            <Select
                                id="dialog-source-lang"
                                value={sourceLang}
                                onChange={(event) => setSourceLang(event.target.value)}
                                disabled={loading}
                            >
                                {LANGUAGES.map((language) => (
                                    <option key={language.code} value={language.code}>
                                        {language.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="dialog-target-lang">Target language</Label>
                            <Select
                                id="dialog-target-lang"
                                value={targetLang}
                                onChange={(event) => setTargetLang(event.target.value)}
                                disabled={loading}
                            >
                                {LANGUAGES.map((language) => (
                                    <option key={language.code} value={language.code}>
                                        {language.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="dialog-content-type">Content type</Label>
                        <Select
                            id="dialog-content-type"
                            value={contentType}
                            onChange={(event) => setContentType(event.target.value as FlashcardType)}
                            disabled={loading}
                        >
                            {FLASHCARD_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="dialog-difficulty">Difficulty</Label>
                            <Select
                                id="dialog-difficulty"
                                value={difficulty}
                                onChange={(event) => setDifficulty(event.target.value as DifficultyLevel)}
                                disabled={loading}
                            >
                                {DIFFICULTY_LEVELS.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="dialog-card-count">Number of cards</Label>
                            <Select
                                id="dialog-card-count"
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
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="dialog-prompt">Category description</Label>
                        <Textarea
                            id="dialog-prompt"
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            placeholder='e.g. "les vêtements de tous les jours"'
                            disabled={loading}
                            rows={3}
                        />
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
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={loading || prompt.trim().length === 0}>
                        {loading ? 'Creating...' : 'Generate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
