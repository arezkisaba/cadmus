import type { IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';

export interface IAiGenerationService {
    isAvailable(): boolean;
    generateCategory(request: IGenerateCategoryRequest): Promise<IGenerateCategoryResponse>;
    translateSongLyrics(lyrics: string, sourceLang: string, targetLang: string): Promise<string[]>;
}
