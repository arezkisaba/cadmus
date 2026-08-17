import type { DifficultyLevel, FlashcardType } from '@shared/models/FlashcardModels';

export const FLASHCARD_TYPES: ReadonlyArray<{ value: FlashcardType; label: string }> = [
    { value: 'word', label: 'Vocabulary' },
    { value: 'expression', label: 'Expressions' },
    { value: 'grammar', label: 'Grammar' },
    { value: 'phrase', label: 'Phrases' },
    { value: 'conjugation', label: 'Conjugation' },
];

export function getFlashcardTypeLabel(type?: FlashcardType): string {
    return FLASHCARD_TYPES.find((item) => item.value === type)?.label ?? 'Vocabulary';
}

export const DIFFICULTY_LEVELS: ReadonlyArray<{ value: DifficultyLevel; label: string }> = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'elementary', label: 'Elementary' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'upper-intermediate', label: 'Upper-Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

export function getDifficultyLabel(level?: DifficultyLevel): string {
    return DIFFICULTY_LEVELS.find((item) => item.value === level)?.label ?? 'Beginner';
}
