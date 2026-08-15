import type { IFlashcard } from '@shared/models/FlashcardModels';

export interface ICategoryStats {
    total: number;
    due: number;
    mastered: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number | null;
}

export interface IFlashcardService {
    getDueFlashcards(categoryId: string, limit?: number): Promise<IFlashcard[]>;
    getAllByCategory(categoryId: string): Promise<IFlashcard[]>;
    getCountByCategory(categoryId: string): Promise<number>;
    getDueCount(categoryId: string): Promise<number>;
    getStatsByCategory(categoryId: string): Promise<ICategoryStats>;
    answer(card: IFlashcard, correct: boolean): Promise<void>;
    reset(card: IFlashcard): Promise<void>;
}
