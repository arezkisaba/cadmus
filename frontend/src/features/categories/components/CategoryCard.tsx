import type { IFlashcardCategory } from '@shared/models/FlashcardModels';
import { Layers, Play, Repeat, RotateCcw, Trash2 } from 'lucide-react';
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
    onReset: (id: string) => void;
    onDelete: (id: string) => void;
}

export const CategoryCard: React.FC<ICategoryCardProps> = ({ category, stats, onReview, onReset, onDelete }) => {
    const total = stats?.total ?? 0;
    const mastered = stats?.mastered ?? 0;
    const sessions = category.sessionCount ?? 0;
    const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    const masteryClass =
        masteryPct >= 67
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : masteryPct >= 34
              ? 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400'
              : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400';

    return (
        <Card className="flex flex-col gap-3 py-4">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{category.name}</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => onReset(category.id)}
                            aria-label={`Reset ${category.name}`}
                        >
                            <RotateCcw />
                        </Button>
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
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                        {getLanguageLabel(category.sourceLang)} → {getLanguageLabel(category.targetLang)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 pb-3">
                <p className="text-muted-foreground line-clamp-1 text-sm italic">"{category.prompt}"</p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                        <Layers className="size-4" />
                        {total} cards
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Repeat className="size-4" />
                        {sessions} sessions
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Progress value={masteryPct} className="h-1.5 flex-1" />
                    <Badge variant="outline" className={masteryClass}>
                        {mastered}/{total} mastered
                    </Badge>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => onReview(category.id)}>
                    <Play />
                    Play
                </Button>
            </CardFooter>
        </Card>
    );
};
