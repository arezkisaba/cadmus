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
    public async findImages(item: IFlashcardItem): Promise<string[]> {
        const query = item.back ?? item.front;
        const url = new URL(OPENVERSE_API_URL);
        url.searchParams.set('q', query);
        url.searchParams.set('page_size', '5');

        const response = await fetch(url.toString());
        if (!response.ok) {
            return [];
        }
        const data = (await response.json()) as IOpenverseResponse;
        return (data.results ?? [])
            .map((result) => result.thumbnail ?? result.url ?? '')
            .filter((imageUrl): imageUrl is string => imageUrl.length > 0)
            .slice(0, 3);
    }
}
