export interface IFlashcardCategory {
    id: string;
    name: string;
    prompt: string;
    description: string;
    sourceLang: string;
    targetLang: string;
    createdAt: number;
}

export interface IFlashcard {
    id: string;
    categoryId: string;
    front: string;
    back: string;
    frontDefinition?: string;
    backDefinition?: string;
    imageUrl: string | null;
    level: number;
    reviewCount: number;
    correctCount: number;
    wrongCount: number;
    lastReviewedAt: number | null;
    nextReviewAt: number | null;
}

export interface IAppSettings {
    deepseekApiKey: string;
    qwenApiKey: string;
    chatGptApiKey: string;
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
}

export interface IGenerateCategoryRequest {
    prompt: string;
    sourceLang: string;
    targetLang: string;
    categoryName?: string;
}

export interface IGenerateCategoryResponse {
    categoryName: string;
    items: IFlashcardItem[];
}
