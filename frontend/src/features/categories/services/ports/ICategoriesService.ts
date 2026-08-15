import type { IFlashcardCategory } from '@shared/models/FlashcardModels';

export interface ILanguagePair {
    sourceLang: string;
    targetLang: string;
}

export interface ICategoriesService {
    getAll(): Promise<IFlashcardCategory[]>;
    getById(id: string): Promise<IFlashcardCategory | undefined>;
    incrementSessionCount(categoryId: string): Promise<void>;
    createFromPrompt(
        prompt: string,
        languagePair: ILanguagePair,
        onProgress?: (stage: string) => void,
        itemCount?: number
    ): Promise<IFlashcardCategory>;
    delete(id: string): Promise<void>;
}
