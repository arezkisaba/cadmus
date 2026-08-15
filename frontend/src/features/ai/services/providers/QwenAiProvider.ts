import { CONFIG } from '@shared/config';
import type { IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../../di-constants';
import type { ISettingsService } from '../../../settings/services/ports/ISettingsService';
import { buildCategoryMessages, callChatCompletions, parseCategoryResponse } from '../ai-utils';
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
}
