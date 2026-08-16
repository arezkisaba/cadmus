import { CONFIG } from '@shared/config';
import type { IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../../di-constants';
import type { ISettingsService } from '../../../settings/services/ports/ISettingsService';
import { buildCategoryMessages, buildSongTranslationMessages, callChatCompletions, parseCategoryResponse, parseSongTranslation } from '../ai-utils';
import type { IAiGenerationService } from '../ports/IAiGenerationService';

@injectable()
export class ChatGptAiProvider implements IAiGenerationService {
    public constructor(@inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService) {}

    public isAvailable(): boolean {
        return this.settingsService.getSettings().chatGptApiKey.length > 0;
    }

    public async generateCategory(request: IGenerateCategoryRequest): Promise<IGenerateCategoryResponse> {
        const apiKey = this.settingsService.getSettings().chatGptApiKey;
        const content = await callChatCompletions(
            CONFIG.CHATGPT_API_URL,
            CONFIG.CHATGPT_MODEL,
            apiKey,
            buildCategoryMessages(request),
            'ChatGPT',
            true
        );
        return parseCategoryResponse(content);
    }

    public async translateSongLyrics(lyrics: string, sourceLang: string, targetLang: string): Promise<string[]> {
        const apiKey = this.settingsService.getSettings().chatGptApiKey;
        const content = await callChatCompletions(
            CONFIG.CHATGPT_API_URL,
            CONFIG.CHATGPT_MODEL,
            apiKey,
            buildSongTranslationMessages(lyrics, sourceLang, targetLang),
            'ChatGPT',
            true
        );
        return parseSongTranslation(content);
    }
}
