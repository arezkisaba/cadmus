export type FlashcardType = 'word' | 'expression' | 'grammar' | 'phrase' | 'conjugation';

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced';

export interface IFlashcardCategory {
    id: string;
    name: string;
    prompt: string;
    description: string;
    sourceLang: string;
    targetLang: string;
    createdAt: number;
    sessionCount?: number;
    type?: FlashcardType;
    difficulty?: DifficultyLevel;
}

export interface IFlashcard {
    id: string;
    categoryId: string;
    front: string;
    back: string;
    frontDefinition?: string;
    backDefinition?: string;
    exampleSource?: string;
    exampleTarget?: string;
    imageUrl: string | null;
    imageUrl2?: string | null;
    level: number;
    reviewCount: number;
    correctCount: number;
    wrongCount: number;
    lastReviewedAt: number | null;
    nextReviewAt: number | null;
    lastResult?: boolean | null;
    type?: FlashcardType;
}

export interface IAppSettings {
    deepseekApiKey: string;
    qwenApiKey: string;
    chatGptApiKey: string;
    claudeApiKey: string;
    pixabayApiKey: string;
    pexelsApiKey: string;
    unsplashApiKey: string;
    sourceLang: string;
    targetLang: string;
    useImages: boolean;
}

export interface IFlashcardItem {
    front: string;
    back: string;
    frontDefinition?: string;
    backDefinition?: string;
    exampleSource?: string;
    exampleTarget?: string;
}

export interface IGenerateCategoryRequest {
    prompt: string;
    sourceLang: string;
    targetLang: string;
    categoryName?: string;
    itemCount?: number;
    type?: FlashcardType;
    difficulty?: DifficultyLevel;
}

export interface IGenerateCategoryResponse {
    categoryName: string;
    items: IFlashcardItem[];
}
