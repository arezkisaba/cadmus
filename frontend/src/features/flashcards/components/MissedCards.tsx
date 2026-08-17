import type { IFlashcard, IFlashcardCategory } from '@shared/models/FlashcardModels';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DI_CONSTANTS } from '@/di-constants';
import { useInjection } from '@/hooks/use-container';
import type { ICategoriesService } from '../../categories/services/ports/ICategoriesService';
import type { IFlashcardService } from '../services/ports/IFlashcardService';

export const MissedCards: React.FC = () => {
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const flashcardsService = useInjection<IFlashcardService>(DI_CONSTANTS.IFlashcardService);

    const data = useLiveQuery(async (): Promise<{ categories: IFlashcardCategory[]; wrong: IFlashcard[] }> => {
        const [categories, wrong] = await Promise.all([categoriesService.getAll(), flashcardsService.getWrongCards()]);
        return { categories, wrong };
    }, [categoriesService, flashcardsService]);

    if (data === undefined) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-[10rem] w-full rounded-3xl" />
                <Skeleton className="h-[10rem] w-full rounded-3xl" />
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
            <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
                    <CheckCircle2 className="size-7" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Nothing missed</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                        Cards answered "I didn't know" during their last session will appear here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {Array.from(groups.entries()).map(([categoryId, cards]) => {
                const category = categoryMap.get(categoryId);
                if (category === undefined) {
                    return null;
                }
                return (
                    <div key={categoryId} className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold">{category.name}</h3>
                            <Badge variant="secondary">{cards.length} missed</Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {cards.map((card) => (
                                <Card key={card.id} className="flex flex-col gap-2 p-4">
                                    <div className="flex items-center gap-3">
                                        {card.imageUrl ? (
                                            <img src={card.imageUrl} alt={card.front} className="size-10 rounded-md object-cover" loading="lazy" />
                                        ) : (
                                            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                                                <Languages className="size-4" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{card.front}</p>
                                            <p className="text-muted-foreground truncate text-sm">{card.back}</p>
                                        </div>
                                    </div>
                                    {card.backDefinition !== undefined && card.backDefinition.length > 0 && (
                                        <p className="text-muted-foreground/70 line-clamp-2 text-xs italic">{card.backDefinition}</p>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
