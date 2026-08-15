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

function createProvider(result: string | null): IImageSearchService {
    return { findFirstImage: jest.fn(async () => result) };
}

function createThrowingProvider(): IImageSearchService {
    return {
        findFirstImage: jest.fn(async () => {
            throw new Error('network error');
        }),
    };
}

describe('ImageSearchService (composite)', () => {
    it('returns the highest priority non-null result', async () => {
        const first = createProvider('https://a.example/img.png');
        const second = createProvider('https://b.example/img.png');
        const service = new ImageSearchService([first, second]);

        await expect(service.findFirstImage(ITEM)).resolves.toBe('https://a.example/img.png');
        expect(first.findFirstImage).toHaveBeenCalled();
        expect(second.findFirstImage).toHaveBeenCalled();
    });

    it('skips providers that return null', async () => {
        const first = createProvider(null);
        const second = createProvider('https://b.example/img.png');
        const service = new ImageSearchService([first, second]);

        await expect(service.findFirstImage(ITEM)).resolves.toBe('https://b.example/img.png');
    });

    it('continues when a provider throws', async () => {
        const first = createThrowingProvider();
        const second = createProvider('https://b.example/img.png');
        const service = new ImageSearchService([first, second]);

        await expect(service.findFirstImage(ITEM)).resolves.toBe('https://b.example/img.png');
    });

    it('returns null when every provider fails', async () => {
        const service = new ImageSearchService([createProvider(null), createThrowingProvider()]);

        await expect(service.findFirstImage(ITEM)).resolves.toBeNull();
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

        await expect(service.findFirstImage(ITEM)).resolves.toBe('https://openverse.example/img.png');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const openverseUrl = String(fetchMock.mock.calls[0][0]);
        expect(openverseUrl).toContain('api.openverse.org');
        expect(openverseUrl).toContain('q=shirt');
    });
});
