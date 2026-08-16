import { CONFIG } from '@shared/config';
import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../../di-constants';
import type { ISettingsService } from '../../../settings/services/ports/ISettingsService';
import type { IImageSearchService } from '../ports/IImageSearchService';

interface IUnsplashImage {
    urls?: {
        small?: string;
    };
}

interface IUnsplashResponse {
    results?: IUnsplashImage[];
}

@injectable()
export class UnsplashImageSearchService implements IImageSearchService {
    public constructor(@inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService) {}

    public async findImages(item: IFlashcardItem): Promise<string[]> {
        const settings = this.settingsService.getSettings();
        if (settings.unsplashApiKey.length === 0) {
            return [];
        }

        const url = new URL(CONFIG.UNSPLASH_API_URL);
        url.searchParams.set('query', item.back ?? item.front);
        url.searchParams.set('per_page', '5');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Client-ID ${settings.unsplashApiKey}`,
            },
        });
        if (!response.ok) {
            return [];
        }
        const data = (await response.json()) as IUnsplashResponse;
        return (data.results ?? [])
            .map((image) => image.urls?.small ?? '')
            .filter((imageUrl): imageUrl is string => imageUrl.length > 0)
            .slice(0, 3);
    }
}
