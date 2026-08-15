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
import type { ICategoriesService } from '../services/ports/ICategoriesService';

interface ICreateCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EXAMPLE_PROMPTS = ['les vêtements de tous les jours', 'la nourriture au restaurant', 'le vocabulaire du voyage', 'les objets de la maison'];

export const CreateCategoryDialog: React.FC<ICreateCategoryDialogProps> = ({ open, onOpenChange }) => {
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const settingsService = useInjection<ISettingsService>(DI_CONSTANTS.ISettingsService);
    const initialSettings = settingsService.getSettings();
    const [prompt, setPrompt] = useState('');
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
        setProgressText('Generating vocabulary with AI...');
        try {
            await categoriesService.createFromPrompt(trimmed, { sourceLang, targetLang }, (stage) => setProgressText(stage));
            toast.success('Category created');
            setPrompt('');
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create category';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [prompt, sourceLang, targetLang, categoriesService, onOpenChange]);

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
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    <Textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder='e.g. "les vêtements de tous les jours"'
                        disabled={loading}
                        rows={3}
                    />
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PROMPTS.map((example) => (
                            <button
                                key={example}
                                type="button"
                                onClick={() => setPrompt(example)}
                                disabled={loading}
                                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50"
                            >
                                {example}
                            </button>
                        ))}
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
