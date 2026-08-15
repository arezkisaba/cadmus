import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { injectable } from 'tsyringe';
import type { IImageSearchService } from '../ports/IImageSearchService';

const OPENVERSE_API_URL = 'https://api.openverse.org/v1/images/';

interface IOpenverseResult {
    thumbnail?: string;
    url?: string;
}

interface IOpenverseResponse {
    results?: IOpenverseResult[];
}

@injectable()
export class OpenverseImageSearchService implements IImageSearchService {
    public async findFirstImage(item: IFlashcardItem): Promise<string | null> {
        const query = item.back ?? item.front;
        const url = new URL(OPENVERSE_API_URL);
        url.searchParams.set('q', query);
        url.searchParams.set('page_size', '5');

        const response = await fetch(url.toString());
        if (!response.ok) {
            return null;
        }
        const data = (await response.json()) as IOpenverseResponse;
        const first = data.results?.[0];
        return first?.thumbnail ?? first?.url ?? null;
    }
}
