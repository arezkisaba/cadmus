import type { IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../di-constants';
import type { IAiGenerationService } from './ports/IAiGenerationService';

@injectable()
export class AiGenerationService implements IAiGenerationService {
    public constructor(@inject(DI_CONSTANTS.IAiProviders) private readonly providers: IAiGenerationService[]) {}

    public isAvailable(): boolean {
        return this.providers.some((provider) => provider.isAvailable());
    }

    public async generateCategory(request: IGenerateCategoryRequest): Promise<IGenerateCategoryResponse> {
        const available = this.providers.filter((provider) => provider.isAvailable());
        if (available.length === 0) {
            throw new Error('No AI provider is configured. Add a DeepSeek, Qwen or ChatGPT API key in Settings.');
        }

        let lastError: unknown = null;
        for (const provider of available) {
            try {
                const response = await provider.generateCategory(request);
                if (request.itemCount !== undefined) {
                    return { ...response, items: response.items.slice(0, request.itemCount) };
                }
                return response;
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError instanceof Error) {
            throw lastError;
        }
        throw new Error('All AI providers failed to generate a response');
    }

    public async translateSongLyrics(lyrics: string, sourceLang: string, targetLang: string): Promise<string[]> {
        const available = this.providers.filter((provider) => provider.isAvailable());
        if (available.length === 0) {
            throw new Error('No AI provider is configured. Add a DeepSeek, Qwen or ChatGPT API key in Settings.');
        }

        let lastError: unknown = null;
        for (const provider of available) {
            try {
                return await provider.translateSongLyrics(lyrics, sourceLang, targetLang);
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError instanceof Error) {
            throw lastError;
        }
        throw new Error('All AI providers failed to translate the lyrics');
    }
}
