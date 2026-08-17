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
export class DeepSeekAiProvider implements IAiGenerationService {
    public constructor(@inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService) {}

    public isAvailable(): boolean {
        return this.settingsService.getSettings().deepseekApiKey.length > 0;
    }

    public async generateCategory(request: IGenerateCategoryRequest): Promise<IGenerateCategoryResponse> {
        const apiKey = this.settingsService.getSettings().deepseekApiKey;
        const content = await callChatCompletions(
            CONFIG.DEEPSEEK_API_URL,
            CONFIG.DEEPSEEK_MODEL,
            apiKey,
            buildCategoryMessages(request),
            'DeepSeek',
            true,
            true
        );
        return parseCategoryResponse(content);
    }

    public async translateSongLyrics(lyrics: string, sourceLang: string, targetLang: string): Promise<string[]> {
        const apiKey = this.settingsService.getSettings().deepseekApiKey;
        const content = await callChatCompletions(
            CONFIG.DEEPSEEK_API_URL,
            CONFIG.DEEPSEEK_MODEL,
            apiKey,
            buildSongTranslationMessages(lyrics, sourceLang, targetLang),
            'DeepSeek',
            true,
            true
        );
        console.log('[Song translation] raw response:', content);
        const translations = parseSongTranslation(content);
        if (translations.length === 0) {
            console.warn('[Song translation] could not parse response:', content.slice(0, 500));
        }
        return translations;
    }

    public async chat(history: IAiMessage[], sourceLang: string, targetLang: string): Promise<string> {
        const apiKey = this.settingsService.getSettings().deepseekApiKey;
        const content = await callChatCompletions(
            CONFIG.DEEPSEEK_API_URL,
            CONFIG.DEEPSEEK_MODEL,
            apiKey,
            buildChatMessages(history, sourceLang, targetLang),
            'DeepSeek',
            false,
            true
        );
        return content.trim();
    }
}
