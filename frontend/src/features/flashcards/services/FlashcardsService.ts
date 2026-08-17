import type { IFlashcard } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../di-constants';
import type { DatabaseService } from '../../_shared/services/DatabaseService';
import { computeAnswerResult } from './flashcard-scheduler';
import type { ICategoryStats, IFlashcardService } from './ports/IFlashcardService';

@injectable()
export class FlashcardsService implements IFlashcardService {
    public constructor(@inject(DI_CONSTANTS.IDatabaseService) private readonly databaseService: DatabaseService) {}

    public async getDueFlashcards(categoryId: string, limit = 20): Promise<IFlashcard[]> {
        const now = Date.now();
        const all = await this.databaseService.database.flashcards.where('categoryId').equals(categoryId).toArray();
        return all
            .filter((card) => card.nextReviewAt === null || card.nextReviewAt <= now)
            .sort((a, b) => {
                const aNext = a.nextReviewAt ?? 0;
                const bNext = b.nextReviewAt ?? 0;
                return aNext - bNext;
            })
            .slice(0, limit);
    }

    public async getAllByCategory(categoryId: string): Promise<IFlashcard[]> {
        return this.databaseService.database.flashcards.where('categoryId').equals(categoryId).toArray();
    }

    public async getCountByCategory(categoryId: string): Promise<number> {
        return this.databaseService.database.flashcards.where('categoryId').equals(categoryId).count();
    }

    public async getDueCount(categoryId: string): Promise<number> {
        const now = Date.now();
        const all = await this.databaseService.database.flashcards.where('categoryId').equals(categoryId).toArray();
        return all.filter((card) => card.nextReviewAt === null || card.nextReviewAt <= now).length;
    }

    public async getStatsByCategory(categoryId: string): Promise<ICategoryStats> {
        const now = Date.now();
        const all = await this.databaseService.database.flashcards.where('categoryId').equals(categoryId).toArray();
        let due = 0;
        let mastered = 0;
        let correctCount = 0;
        let wrongCount = 0;
        for (const card of all) {
            if (card.nextReviewAt === null || card.nextReviewAt <= now) {
                due += 1;
            }
            if (card.lastResult === true) {
                mastered += 1;
            }
            correctCount += card.correctCount;
            wrongCount += card.wrongCount;
        }
        const answered = correctCount + wrongCount;
        return {
            total: all.length,
            due,
            mastered,
            correctCount,
            wrongCount,
            accuracy: answered > 0 ? Math.round((correctCount / answered) * 100) : null,
        };
    }

    public async getWrongCards(): Promise<IFlashcard[]> {
        const all = await this.databaseService.database.flashcards.toArray();
        return all.filter((card) => card.lastResult === false);
    }

    public async answer(card: IFlashcard, correct: boolean): Promise<IFlashcard> {
        const updated = computeAnswerResult(card, correct, Date.now());
        await this.databaseService.database.flashcards.put(updated);
        return updated;
    }

    public async reset(card: IFlashcard): Promise<void> {
        const updated: IFlashcard = {
            ...card,
            level: 0,
            reviewCount: 0,
            correctCount: 0,
            wrongCount: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
            lastResult: null,
        };
        await this.databaseService.database.flashcards.put(updated);
    }
}
