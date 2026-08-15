import type { IFlashcard } from '@shared/models/FlashcardModels';
import { computeAnswerResult, REVIEW_INTERVALS_MS, WRONG_ANSWER_DELAY_MS } from './flashcard-scheduler';

const NOW = 1_700_000_000_000;

function createCard(overrides: Partial<IFlashcard> = {}): IFlashcard {
    return {
        id: 'card-1',
        categoryId: 'cat-1',
        front: 'chien',
        back: 'dog',
        imageUrl: null,
        level: 0,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastReviewedAt: null,
        nextReviewAt: null,
        ...overrides,
    };
}

describe('computeAnswerResult', () => {
    it('promotes a new card to level 1 and schedules the next review on a correct answer', () => {
        const result = computeAnswerResult(createCard(), true, NOW);
        expect(result.level).toBe(1);
        expect(result.reviewCount).toBe(1);
        expect(result.correctCount).toBe(1);
        expect(result.wrongCount).toBe(0);
        expect(result.nextReviewAt).toBe(NOW + REVIEW_INTERVALS_MS[1]);
        expect(result.lastReviewedAt).toBe(NOW);
    });

    it('caps the level at 5', () => {
        const result = computeAnswerResult(createCard({ level: 5 }), true, NOW);
        expect(result.level).toBe(5);
        expect(result.nextReviewAt).toBe(NOW + REVIEW_INTERVALS_MS[5]);
    });

    it('resets the level and requeues soon after a wrong answer', () => {
        const result = computeAnswerResult(createCard({ level: 3 }), false, NOW);
        expect(result.level).toBe(0);
        expect(result.wrongCount).toBe(1);
        expect(result.correctCount).toBe(0);
        expect(result.nextReviewAt).toBe(NOW + WRONG_ANSWER_DELAY_MS);
    });

    it('keeps other card fields intact', () => {
        const card = createCard({ front: 'chat', back: 'cat', imageUrl: 'https://example.com/cat.png' });
        const result = computeAnswerResult(card, true, NOW);
        expect(result.front).toBe('chat');
        expect(result.back).toBe('cat');
        expect(result.imageUrl).toBe('https://example.com/cat.png');
        expect(result.id).toBe('card-1');
        expect(result.categoryId).toBe('cat-1');
    });
});
