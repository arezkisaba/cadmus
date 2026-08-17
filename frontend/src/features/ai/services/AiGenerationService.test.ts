import 'reflect-metadata';
import type { IAppSettings, IGenerateCategoryRequest } from '@shared/models/FlashcardModels';
import type { ISettingsService } from '../../settings/services/ports/ISettingsService';
import { AiGenerationService } from './AiGenerationService';
import type { IAiGenerationService } from './ports/IAiGenerationService';
import { DeepSeekAiProvider } from './providers/DeepSeekAiProvider';

const SETTINGS: IAppSettings = {
    deepseekApiKey: 'sk-test',
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

const REQUEST: IGenerateCategoryRequest = { prompt: 'les vêtements', sourceLang: 'fr', targetLang: 'en' };

describe('AiGenerationService (composite)', () => {
    it('throws when no provider is available', async () => {
        const unavailable = {
            isAvailable: () => false,
            generateCategory: jest.fn(),
            translateSongLyrics: jest.fn(),
        } satisfies IAiGenerationService;
        const service = new AiGenerationService([unavailable]);
        await expect(service.generateCategory(REQUEST)).rejects.toThrow('No AI provider is configured');
    });

    it('uses the first available provider', async () => {
        const first = {
            isAvailable: () => true,
            generateCategory: jest.fn(async () => ({ categoryName: 'A', items: [{ front: 'a', back: 'b' }] })),
            translateSongLyrics: jest.fn(),
        } satisfies IAiGenerationService;
        const second = {
            isAvailable: () => true,
            generateCategory: jest.fn(),
            translateSongLyrics: jest.fn(),
        } satisfies IAiGenerationService;
        const service = new AiGenerationService([first, second]);
        const result = await service.generateCategory(REQUEST);
        expect(result.categoryName).toBe('A');
        expect(second.generateCategory).not.toHaveBeenCalled();
    });

    it('falls back to the next provider when the first fails', async () => {
        const first = {
            isAvailable: () => true,
            generateCategory: jest.fn(async () => {
                throw new Error('first failed');
            }),
            translateSongLyrics: jest.fn(),
        } satisfies IAiGenerationService;
        const second = {
            isAvailable: () => true,
            generateCategory: jest.fn(async () => ({ categoryName: 'B', items: [{ front: 'x', back: 'y' }] })),
            translateSongLyrics: jest.fn(),
        } satisfies IAiGenerationService;
        const service = new AiGenerationService([first, second]);
        await expect(service.generateCategory(REQUEST)).resolves.toMatchObject({ categoryName: 'B' });
    });

    it('propagates the last error when all fail', async () => {
        const failing = {
            isAvailable: () => true,
            generateCategory: jest.fn(async () => {
                throw new Error('boom');
            }),
            translateSongLyrics: jest.fn(),
        } satisfies IAiGenerationService;
        const service = new AiGenerationService([failing]);
        await expect(service.generateCategory(REQUEST)).rejects.toThrow('boom');
    });
});

describe('DeepSeekAiProvider', () => {
    const fetchMock = jest.fn();
    const provider = new DeepSeekAiProvider(settingsService);

    beforeAll(() => {
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    beforeEach(() => {
        fetchMock.mockReset();
    });

    it('is available when an api key is set', () => {
        expect(provider.isAvailable()).toBe(true);
    });

    it('parses a valid JSON response', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({ categoryName: 'Clothes', items: [{ front: 'chemise', back: 'shirt' }] }),
                        },
                    },
                ],
            }),
        });
        const result = await provider.generateCategory(REQUEST);
        expect(result.categoryName).toBe('Clothes');
        expect(result.items).toHaveLength(1);
        expect(result.items[0].front).toBe('chemise');
    });

    it('disables thinking mode in the request body', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: JSON.stringify({ categoryName: 'Clothes', items: [{ front: 'chemise', back: 'shirt' }] }) } }],
            }),
        });
        await provider.generateCategory(REQUEST);
        const init = fetchMock.mock.calls[0][1] as { body?: string };
        const body = JSON.parse(init.body ?? '{}') as { thinking?: { type?: string } };
        expect(body.thinking).toEqual({ type: 'disabled' });
    });

    it('extracts JSON from markdown-wrapped content', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: '```json\n{"categoryName": "Food", "items": [{"front": "pain", "back": "bread"}]}\n```',
                        },
                    },
                ],
            }),
        });
        const result = await provider.generateCategory(REQUEST);
        expect(result.categoryName).toBe('Food');
        expect(result.items[0].front).toBe('pain');
    });

    it('throws when the response contains no items', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: JSON.stringify({ categoryName: 'Empty', items: [] }) } }],
            }),
        });
        await expect(provider.generateCategory(REQUEST)).rejects.toThrow('invalid or empty response');
    });

    it('throws when the response is not ok', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => 'Unauthorized',
        });
        await expect(provider.generateCategory(REQUEST)).rejects.toThrow('DeepSeek API error (401)');
    });
});
