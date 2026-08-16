import { CONFIG } from '@shared/config';
import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../../di-constants';
import type { ISettingsService } from '../../../settings/services/ports/ISettingsService';
import type { IImageSearchService } from '../ports/IImageSearchService';

interface IPexelsPhoto {
    src?: {
        medium?: string;
    };
}

interface IPexelsResponse {
    photos?: IPexelsPhoto[];
}

@injectable()
export class PexelsImageSearchService implements IImageSearchService {
    public constructor(@inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService) {}

    public async findImages(item: IFlashcardItem): Promise<string[]> {
        const settings = this.settingsService.getSettings();
        if (settings.pexelsApiKey.length === 0) {
            return [];
        }

        const url = new URL(CONFIG.PEXELS_API_URL);
        url.searchParams.set('query', item.back ?? item.front);
        url.searchParams.set('per_page', '5');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: settings.pexelsApiKey,
            },
        });
        if (!response.ok) {
            return [];
        }
        const data = (await response.json()) as IPexelsResponse;
        return (data.photos ?? [])
            .map((photo) => photo.src?.medium ?? '')
            .filter((imageUrl): imageUrl is string => imageUrl.length > 0)
            .slice(0, 3);
    }
}
