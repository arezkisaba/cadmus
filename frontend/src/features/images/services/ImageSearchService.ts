import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../di-constants';
import { withTimeout } from '../../_shared/utils/concurrency';
import type { IImageSearchService } from './ports/IImageSearchService';

const PROVIDER_TIMEOUT_MS = 3000;

@injectable()
export class ImageSearchService implements IImageSearchService {
    public constructor(@inject(DI_CONSTANTS.IImageSearchProviders) private readonly providers: IImageSearchService[]) {}

    public async findFirstImage(item: IFlashcardItem): Promise<string | null> {
        const results = await Promise.all(
            this.providers.map((provider) =>
                withTimeout(
                    provider.findFirstImage(item).catch(() => null),
                    PROVIDER_TIMEOUT_MS,
                    null
                )
            )
        );
        return results.find((imageUrl) => imageUrl !== null) ?? null;
    }
}
