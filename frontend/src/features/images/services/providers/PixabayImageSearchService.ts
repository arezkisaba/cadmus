import { CONFIG } from '@shared/config';
import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../../di-constants';
import type { ISettingsService } from '../../../settings/services/ports/ISettingsService';
import type { IImageSearchService } from '../ports/IImageSearchService';

interface IPixabayHit {
    webformatURL?: string;
}

interface IPixabayResponse {
    hits?: IPixabayHit[];
}

@injectable()
export class PixabayImageSearchService implements IImageSearchService {
    public constructor(@inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService) {}

    public async findImages(item: IFlashcardItem): Promise<string[]> {
        const settings = this.settingsService.getSettings();
        if (settings.pixabayApiKey.length === 0) {
            return [];
        }

        const url = new URL(CONFIG.PIXABAY_API_URL);
        url.searchParams.set('key', settings.pixabayApiKey);
        url.searchParams.set('q', item.front);
        url.searchParams.set('lang', settings.sourceLang);
        url.searchParams.set('per_page', '5');
        url.searchParams.set('image_type', 'photo');
        url.searchParams.set('safesearch', 'true');

        const response = await fetch(url.toString());
        if (!response.ok) {
            return [];
        }
        const data = (await response.json()) as IPixabayResponse;
        return (data.hits ?? [])
            .map((hit) => hit.webformatURL)
            .filter((imageUrl): imageUrl is string => typeof imageUrl === 'string' && imageUrl.length > 0)
            .slice(0, 3);
    }
}
