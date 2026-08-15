import type { IFlashcardItem } from '@shared/models/FlashcardModels';
import { injectable } from 'tsyringe';
import type { IImageSearchService } from '../ports/IImageSearchService';

const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';

interface IWikiImageInfo {
    url?: string;
    thumburl?: string;
}

interface IWikiPage {
    imageinfo?: IWikiImageInfo[];
}

interface IWikiResponse {
    query?: {
        pages?: IWikiPage[];
    };
}

@injectable()
export class WikimediaImageSearchService implements IImageSearchService {
    public async findFirstImage(item: IFlashcardItem): Promise<string | null> {
        const query = item.back ?? item.front;
        const url = new URL(WIKIMEDIA_API_URL);
        url.searchParams.set('action', 'query');
        url.searchParams.set('generator', 'search');
        url.searchParams.set('gsrsearch', query);
        url.searchParams.set('gsrnamespace', '6');
        url.searchParams.set('gsrlimit', '5');
        url.searchParams.set('gsrfiletype', 'bitmap');
        url.searchParams.set('prop', 'imageinfo');
        url.searchParams.set('iiprop', 'url');
        url.searchParams.set('iiurlwidth', '400');
        url.searchParams.set('format', 'json');
        url.searchParams.set('formatversion', '2');
        url.searchParams.set('origin', '*');

        const response = await fetch(url.toString());
        if (!response.ok) {
            return null;
        }
        const data = (await response.json()) as IWikiResponse;
        const page = data.query?.pages?.[0];
        const info = page?.imageinfo?.[0];
        return info?.thumburl ?? info?.url ?? null;
    }
}
