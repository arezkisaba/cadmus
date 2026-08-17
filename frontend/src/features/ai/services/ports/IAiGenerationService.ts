import type { IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';
import type { IAiMessage } from '../ai-utils';

export interface IAiGenerationService {
    isAvailable(): boolean;
    generateCategory(request: IGenerateCategoryRequest): Promise<IGenerateCategoryResponse>;
    translateSongLyrics(lyrics: string, sourceLang: string, targetLang: string): Promise<string[]>;
    chat(history: IAiMessage[], sourceLang: string, targetLang: string): Promise<string>;
}
