import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../di-constants';
import { withTimeout } from '../../_shared/utils/concurrency';
import type { IImageSearchService } from './ports/IImageSearchService';

const PROVIDER_TIMEOUT_MS = 3000;
const DEFAULT_IMAGE_COUNT = 2;

@injectable()
export class ImageSearchService implements IImageSearchService {
    public constructor(@inject(DI_CONSTANTS.IImageSearchProviders) private readonly providers: IImageSearchService[]) {}

    public async findImages(item: IFlashcardItem, count = DEFAULT_IMAGE_COUNT): Promise<string[]> {
        const results = await Promise.all(
            this.providers.map((provider) =>
                withTimeout(
                    provider.findImages(item).catch(() => [] as string[]),
                    PROVIDER_TIMEOUT_MS,
                    [] as string[]
                )
            )
        );
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const urls of results) {
            for (const url of urls) {
                if (url.length > 0 && !seen.has(url)) {
                    seen.add(url);
                    unique.push(url);
                }
            }
        }
        return unique.slice(0, count);
    }
}
