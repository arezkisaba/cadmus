import type { IFlashcardCategory } from '@shared/models/FlashcardModels';

export interface ILanguagePair {
    sourceLang: string;
    targetLang: string;
}

export interface ICategoriesService {
    getAll(): Promise<IFlashcardCategory[]>;
    getById(id: string): Promise<IFlashcardCategory | undefined>;
    createFromPrompt(prompt: string, languagePair: ILanguagePair, onProgress?: (stage: string) => void): Promise<IFlashcardCategory>;
    delete(id: string): Promise<void>;
}
