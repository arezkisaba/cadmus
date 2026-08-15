import type { IFlashcard } from '@shared/models/FlashcardModels';

export const REVIEW_INTERVALS_MS = [
    0,
    1 * 24 * 60 * 60 * 1000,
    2 * 24 * 60 * 60 * 1000,
    4 * 24 * 60 * 60 * 1000,
    7 * 24 * 60 * 60 * 1000,
    15 * 24 * 60 * 60 * 1000,
] as const;

export const MASTERY_LEVEL = 3;

export const WRONG_ANSWER_DELAY_MS = 10 * 60 * 1000;

export function computeAnswerResult(card: IFlashcard, correct: boolean, now: number): IFlashcard {
    const updated: IFlashcard = {
        ...card,
        reviewCount: card.reviewCount + 1,
        correctCount: card.correctCount + (correct ? 1 : 0),
        wrongCount: card.wrongCount + (correct ? 0 : 1),
        lastReviewedAt: now,
        lastResult: correct,
    };

    if (correct) {
        updated.level = Math.min(card.level + 1, 5);
        updated.nextReviewAt = now + REVIEW_INTERVALS_MS[updated.level];
    } else {
        updated.level = 0;
        updated.nextReviewAt = now + WRONG_ANSWER_DELAY_MS;
    }

    return updated;
}
