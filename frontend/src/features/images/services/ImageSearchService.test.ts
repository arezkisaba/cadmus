import 'reflect-metadata';
import type { IAppSettings, IFlashcardItem } from '@shared/models/FlashcardModels';
import type { ISettingsService } from '../../settings/services/ports/ISettingsService';
import { ImageSearchService } from './ImageSearchService';
import type { IImageSearchService } from './ports/IImageSearchService';
import { OpenverseImageSearchService } from './providers/OpenverseImageSearchService';
import { PixabayImageSearchService } from './providers/PixabayImageSearchService';

const SETTINGS: IAppSettings = {
    deepseekApiKey: '',
    qwenApiKey: '',
    chatGptApiKey: '',
    claudeApiKey: '',
    mistralApiKey: '',
    pixabayApiKey: '',
    pexelsApiKey: '',
    unsplashApiKey: '',
    sourceLang: 'fr',
    targetLang: 'en',
    useImages: true,
};

const settingsService: ISettingsService = {
    getSettings: () => SETTINGS,
    updateSettings: (next) => ({ ...SETTINGS, ...next }),
};

const ITEM: IFlashcardItem = { front: 'chemise', back: 'shirt' };

function createProvider(result: string[]): IImageSearchService {
    return { findImages: jest.fn(async () => result) };
}

function createThrowingProvider(): IImageSearchService {
    return {
        findImages: jest.fn(async () => {
            throw new Error('network error');
        }),
    };
}

describe('ImageSearchService (composite)', () => {
    it('returns the first two unique urls in priority order', async () => {
        const first = createProvider(['https://a.example/img.png', 'https://b.example/img.png', 'https://c.example/img.png']);
        const second = createProvider(['https://d.example/img.png']);
        const service = new ImageSearchService([first, second]);

        await expect(service.findImages(ITEM)).resolves.toEqual(['https://a.example/img.png', 'https://b.example/img.png']);
        expect(first.findImages).toHaveBeenCalled();
        expect(second.findImages).toHaveBeenCalled();
    });

    it('skips providers that return an empty list', async () => {
        const first = createProvider([]);
        const second = createProvider(['https://b.example/img.png']);
        const service = new ImageSearchService([first, second]);

        await expect(service.findImages(ITEM)).resolves.toEqual(['https://b.example/img.png']);
    });

    it('continues when a provider throws', async () => {
        const first = createThrowingProvider();
        const second = createProvider(['https://b.example/img.png']);
        const service = new ImageSearchService([first, second]);

        await expect(service.findImages(ITEM)).resolves.toEqual(['https://b.example/img.png']);
    });

    it('deduplicates urls coming from several providers', async () => {
        const first = createProvider(['https://a.example/img.png']);
        const second = createProvider(['https://a.example/img.png', 'https://b.example/img.png']);
        const service = new ImageSearchService([first, second]);

        await expect(service.findImages(ITEM)).resolves.toEqual(['https://a.example/img.png', 'https://b.example/img.png']);
    });

    it('returns an empty list when every provider fails', async () => {
        const service = new ImageSearchService([createProvider([]), createThrowingProvider()]);

        await expect(service.findImages(ITEM)).resolves.toEqual([]);
    });
});

describe('image providers chain', () => {
    const fetchMock = jest.fn();

    beforeAll(() => {
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    beforeEach(() => {
        fetchMock.mockReset();
    });

    it('falls back to Openverse when Pixabay has no api key and searches the translated word', async () => {
        const pixabay = new PixabayImageSearchService(settingsService);
        const openverse = new OpenverseImageSearchService();
        const service = new ImageSearchService([pixabay, openverse]);

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ results: [{ thumbnail: 'https://openverse.example/img.png' }] }),
        });

        await expect(service.findImages(ITEM)).resolves.toEqual(['https://openverse.example/img.png']);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const openverseUrl = String(fetchMock.mock.calls[0][0]);
        expect(openverseUrl).toContain('api.openverse.org');
        expect(openverseUrl).toContain('q=shirt');
    });
});
