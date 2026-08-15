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

    public async findFirstImage(item: IFlashcardItem): Promise<string | null> {
        const settings = this.settingsService.getSettings();
        if (settings.pixabayApiKey.length === 0) {
            return null;
        }

        const url = new URL(CONFIG.PIXABAY_API_URL);
        url.searchParams.set('key', settings.pixabayApiKey);
        url.searchParams.set('q', item.front);
        url.searchParams.set('lang', settings.sourceLang);
        url.searchParams.set('per_page', '3');
        url.searchParams.set('image_type', 'photo');
        url.searchParams.set('safesearch', 'true');

        const response = await fetch(url.toString());
        if (!response.ok) {
            return null;
        }
        const data = (await response.json()) as IPixabayResponse;
        return data.hits?.[0]?.webformatURL ?? null;
    }
}
