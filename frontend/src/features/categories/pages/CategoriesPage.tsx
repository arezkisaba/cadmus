import type { IFlashcardCategory } from '@shared/models/FlashcardModels';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DI_CONSTANTS } from '@/di-constants';
import { useInjection } from '@/hooks/use-container';
import { MissedCards } from '../../flashcards/components/MissedCards';
import type { ICategoryStats, IFlashcardService } from '../../flashcards/services/ports/IFlashcardService';
import { DEFAULT_CARD_COUNT } from '../card-count';
import { CategoryCard } from '../components/CategoryCard';
import { CreateCategoryDialog } from '../components/CreateCategoryDialog';
import { ResetCategoryDialog } from '../components/ResetCategoryDialog';
import type { ICategoriesService } from '../services/ports/ICategoriesService';

const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3'];

export const CategoriesPage: React.FC = () => {
    const categoriesService = useInjection<ICategoriesService>(DI_CONSTANTS.ICategoriesService);
    const flashcardsService = useInjection<IFlashcardService>(DI_CONSTANTS.IFlashcardService);
    const navigate = useNavigate();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [resetCategory, setResetCategory] = useState<IFlashcardCategory | null>(null);
    const [resetCount, setResetCount] = useState(DEFAULT_CARD_COUNT);

    const data = useLiveQuery(async (): Promise<{
        categories: Awaited<ReturnType<ICategoriesService['getAll']>>;
        stats: Map<string, ICategoryStats>;
    }> => {
        const categories = await categoriesService.getAll();
        const stats = new Map<string, ICategoryStats>();
        for (const category of categories) {
            stats.set(category.id, await flashcardsService.getStatsByCategory(category.id));
        }
        return { categories, stats };
    }, [categoriesService, flashcardsService]);

    const handleReview = useCallback(
        (id: string): void => {
            navigate(`/review/${id}`);
        },
        [navigate]
    );

    const handleDelete = useCallback(
        async (id: string): Promise<void> => {
            if (!window.confirm('Delete this category and all its flashcards?')) {
                return;
            }
            await categoriesService.delete(id);
            toast.success('Category deleted');
        },
        [categoriesService]
    );

    const handleReset = useCallback(
        (id: string): void => {
            const category = data?.categories.find((item) => item.id === id);
            if (category === undefined) {
                return;
            }
            setResetCount(data?.stats.get(id)?.total ?? DEFAULT_CARD_COUNT);
            setResetCategory(category);
        },
        [data]
    );

    const renderSkeletons = (): React.ReactNode => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
                <Card key={key} className="flex flex-col gap-3 p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full" />
                </Card>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground text-sm">My language flashcard decks.</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus />
                    New category
                </Button>
            </div>

            <Tabs defaultValue="categories" className="w-full gap-6">
                <TabsList>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="missed">Missed</TabsTrigger>
                </TabsList>
                <TabsContent value="categories" className="flex flex-col gap-6">
                    {data === undefined ? (
                        renderSkeletons()
                    ) : data.categories.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                            <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                                <Sparkles className="size-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">No categories yet</h3>
                                <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
                                    Describe a theme like "les vêtements de tous les jours" and AI will generate a vocabulary deck for you.
                                </p>
                            </div>
                            <Button onClick={() => setDialogOpen(true)}>
                                <Plus />
                                Create your first category
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {data.categories.map((category) => {
                                const stats = data.stats.get(category.id);
                                return (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        stats={stats}
                                        onReview={handleReview}
                                        onReset={handleReset}
                                        onDelete={handleDelete}
                                    />
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="missed" className="flex flex-col gap-6">
                    <MissedCards />
                </TabsContent>
            </Tabs>

            <CreateCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            <ResetCategoryDialog
                category={resetCategory}
                initialCount={resetCount}
                open={resetCategory !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setResetCategory(null);
                    }
                }}
            />
        </div>
    );
};
