import { CONFIG } from '@shared/config';
import type { IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../../di-constants';
import type { ISettingsService } from '../../../settings/services/ports/ISettingsService';
import type { IAiMessage } from '../ai-utils';
import {
    buildCategoryMessages,
    buildChatMessages,
    buildSongTranslationMessages,
    callChatCompletions,
    parseCategoryResponse,
    parseSongTranslation,
} from '../ai-utils';
import type { IAiGenerationService } from '../ports/IAiGenerationService';

@injectable()
export class QwenAiProvider implements IAiGenerationService {
    public constructor(@inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService) {}

    public isAvailable(): boolean {
        return this.settingsService.getSettings().qwenApiKey.length > 0;
    }

    public async generateCategory(request: IGenerateCategoryRequest): Promise<IGenerateCategoryResponse> {
        const apiKey = this.settingsService.getSettings().qwenApiKey;
        const content = await callChatCompletions(CONFIG.QWEN_API_URL, CONFIG.QWEN_MODEL, apiKey, buildCategoryMessages(request), 'Qwen', false);
        return parseCategoryResponse(content);
    }

    public async translateSongLyrics(lyrics: string, sourceLang: string, targetLang: string): Promise<string[]> {
        const apiKey = this.settingsService.getSettings().qwenApiKey;
        const content = await callChatCompletions(
            CONFIG.QWEN_API_URL,
            CONFIG.QWEN_MODEL,
            apiKey,
            buildSongTranslationMessages(lyrics, sourceLang, targetLang),
            'Qwen',
            false
        );
        console.log('[Song translation] raw response:', content);
        const translations = parseSongTranslation(content);
        if (translations.length === 0) {
            console.warn('[Song translation] could not parse response:', content.slice(0, 500));
        }
        return translations;
    }

    public async chat(history: IAiMessage[], sourceLang: string, targetLang: string): Promise<string> {
        const apiKey = this.settingsService.getSettings().qwenApiKey;
        const content = await callChatCompletions(
            CONFIG.QWEN_API_URL,
            CONFIG.QWEN_MODEL,
            apiKey,
            buildChatMessages(history, sourceLang, targetLang),
            'Qwen',
            false
        );
        return content.trim();
    }
}
