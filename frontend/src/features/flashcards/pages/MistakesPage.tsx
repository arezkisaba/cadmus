import type { IFlashcard, IFlashcardCategory } from '@shared/models/FlashcardModels';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Languages, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DI_CONSTANTS } from '@/di-constants';
import { speak } from '@/features/_shared/utils/speech';
import { useInjection } from '@/hooks/use-container';
import type { ICategoriesService } from '../../categories/services/ports/ICategoriesService';
import type { IFlashcardService } from '../services/ports/IFlashcardService';

export const MistakesPage: React.FC = () => {
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const flashcardsService = useInjection<IFlashcardService>(DI_CONSTANTS.IFlashcardService);

    const data = useLiveQuery(async (): Promise<{ categories: IFlashcardCategory[]; wrong: IFlashcard[] }> => {
        const [categories, wrong] = await Promise.all([categoriesService.getAll(), flashcardsService.getWrongCards()]);
        return { categories, wrong };
    }, [categoriesService, flashcardsService]);

    if (data === undefined) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[16rem] w-full rounded-3xl" />
            </div>
        );
    }

    const categoryMap = new Map(data.categories.map((category) => [category.id, category]));
    const groups = new Map<string, IFlashcard[]>();
    for (const card of data.wrong) {
        const list = groups.get(card.categoryId) ?? [];
        list.push(card);
        groups.set(card.categoryId, list);
    }

    if (data.wrong.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="size-8" />
                </div>
                <h2 className="text-xl font-semibold">Nothing missed</h2>
                <p className="text-muted-foreground max-w-sm text-sm">Cards answered "I didn't know" during their last session will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Missed</h2>
                <p className="text-muted-foreground text-sm">Cards you missed in their last session, grouped by category.</p>
            </div>

            {Array.from(groups.entries()).map(([categoryId, cards]) => {
                const category = categoryMap.get(categoryId);
                if (category === undefined) {
                    return null;
                }
                return (
                    <Card key={categoryId}>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base">{category.name}</CardTitle>
                                <Badge variant="secondary">{cards.length} missed</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {cards.map((card) => (
                                <div key={card.id} className="flex items-center gap-3 rounded-lg border p-3">
                                    {card.imageUrl ? (
                                        <img src={card.imageUrl} alt={card.front} className="size-10 rounded-md object-cover" loading="lazy" />
                                    ) : (
                                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                                            <Languages className="size-4" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-1 font-medium">
                                            <span className="truncate">{card.front}</span>
                                            <button
                                                type="button"
                                                onClick={() => speak(card.front, category.sourceLang)}
                                                className="text-muted-foreground hover:text-foreground shrink-0"
                                                aria-label={`Listen to ${card.front}`}
                                            >
                                                <Volume2 className="size-3.5" />
                                            </button>
                                        </p>
                                        <p className="text-muted-foreground truncate text-sm">{card.back}</p>
                                        {card.backDefinition !== undefined && card.backDefinition.length > 0 && (
                                            <p className="text-muted-foreground/70 line-clamp-1 text-xs italic">{card.backDefinition}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
