import type { IFlashcardCategory } from '@shared/models/FlashcardModels';
import { ArrowRight, Layers, Repeat, Target, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getLanguageLabel } from '@/features/settings/models/languages';
import type { ICategoryStats } from '../../flashcards/services/ports/IFlashcardService';

interface ICategoryCardProps {
    category: IFlashcardCategory;
    stats?: ICategoryStats;
    onReview: (id: string) => void;
    onDelete: (id: string) => void;
}

export const CategoryCard: React.FC<ICategoryCardProps> = ({ category, stats, onReview, onDelete }) => {
    const total = stats?.total ?? 0;
    const mastered = stats?.mastered ?? 0;
    const accuracy = stats?.accuracy ?? null;
    const sessions = category.sessionCount ?? 0;
    const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{category.name}</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(category.id)}
                        aria-label={`Delete ${category.name}`}
                    >
                        <Trash2 />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                        {getLanguageLabel(category.sourceLang)} → {getLanguageLabel(category.targetLang)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 pb-4">
                <p className="text-muted-foreground line-clamp-2 text-sm italic">"{category.prompt}"</p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                        <Layers className="size-4" />
                        {total} cards
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Repeat className="size-4" />
                        {sessions} sessions
                    </span>
                    {accuracy !== null && (
                        <span className="flex items-center gap-1.5">
                            <Target className="size-4" />
                            {accuracy}% correct
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Progress value={masteryPct} className="h-2 flex-1" />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {mastered}/{total} mastered
                    </span>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => onReview(category.id)}>
                    Review
                    <ArrowRight />
                </Button>
            </CardFooter>
        </Card>
    );
};
