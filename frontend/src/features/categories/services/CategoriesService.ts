import type {
    DifficultyLevel,
    FlashcardType,
    IFlashcard,
    IFlashcardCategory,
    IFlashcardItem,
    IGenerateCategoryRequest,
} from '@shared/models/FlashcardModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../di-constants';
import type { DatabaseService } from '../../_shared/services/DatabaseService';
import { mapWithConcurrency } from '../../_shared/utils/concurrency';
import { generateId } from '../../_shared/utils/id';
import type { IAiGenerationService } from '../../ai/services/ports/IAiGenerationService';
import type { IImageSearchService } from '../../images/services/ports/IImageSearchService';
import type { ISettingsService } from '../../settings/services/ports/ISettingsService';
import type { ICategoriesService, ILanguagePair } from './ports/ICategoriesService';

const IMAGE_CONCURRENCY = 5;
const IMAGE_TYPES: ReadonlySet<FlashcardType> = new Set(['word']);

const ARTICLE_REGEX =
    /^(?:(?:the|a|an|le|la|les|un|une|des|el|los|las|der|die|das|ein|eine|einen|il|lo|i|gli|uno|una|o|os|as|um|uma|de|het|een|en|ett)\s+)+/i;

export function stripLeadingArticle(text: string): string {
    return text.replace(ARTICLE_REGEX, '').trim();
}

@injectable()
export class CategoriesService implements ICategoriesService {
    public constructor(
        @inject(DI_CONSTANTS.IDatabaseService) private readonly databaseService: DatabaseService,
        @inject(DI_CONSTANTS.IAiGenerationService) private readonly aiGenerationService: IAiGenerationService,
        @inject(DI_CONSTANTS.IImageSearchService) private readonly imageSearchService: IImageSearchService,
        @inject(DI_CONSTANTS.ISettingsService) private readonly settingsService: ISettingsService
    ) {}

    public async getAll(): Promise<IFlashcardCategory[]> {
        return this.databaseService.database.categories.orderBy('createdAt').reverse().toArray();
    }

    public async getById(id: string): Promise<IFlashcardCategory | undefined> {
        return this.databaseService.database.categories.get(id);
    }

    public async incrementSessionCount(categoryId: string): Promise<void> {
        const category = await this.databaseService.database.categories.get(categoryId);
        if (category === undefined) {
            return;
        }
        const updated: IFlashcardCategory = {
            ...category,
            sessionCount: (category.sessionCount ?? 0) + 1,
        };
        await this.databaseService.database.categories.put(updated);
    }

    public async createFromPrompt(
        prompt: string,
        languagePair: ILanguagePair,
        onProgress?: (stage: string) => void,
        itemCount?: number,
        type: FlashcardType = 'word',
        difficulty: DifficultyLevel = 'beginner'
    ): Promise<IFlashcardCategory> {
        const settings = this.settingsService.getSettings();
        const request: IGenerateCategoryRequest = {
            prompt,
            sourceLang: languagePair.sourceLang,
            targetLang: languagePair.targetLang,
            ...(itemCount !== undefined ? { itemCount } : {}),
            type,
            difficulty,
        };
        onProgress?.(`Generating ${type} cards with AI...`);
        const result = await this.aiGenerationService.generateCategory(request);

        const categoryId = generateId();
        const now = Date.now();
        const category: IFlashcardCategory = {
            id: categoryId,
            name: result.categoryName,
            prompt,
            description: '',
            sourceLang: languagePair.sourceLang,
            targetLang: languagePair.targetLang,
            createdAt: now,
            sessionCount: 0,
            type,
            difficulty,
        };

        const useImages = settings.useImages;
        const cards = await this.buildCards(categoryId, result.items, useImages, onProgress, type);

        await this.databaseService.database.transaction(
            'rw',
            [this.databaseService.database.categories, this.databaseService.database.flashcards],
            async () => {
                await this.databaseService.database.categories.add(category);
                if (cards.length > 0) {
                    await this.databaseService.database.flashcards.bulkAdd(cards);
                }
            }
        );

        return category;
    }

    public async resetCategory(categoryId: string, itemCount: number, onProgress?: (stage: string) => void): Promise<void> {
        const category = await this.databaseService.database.categories.get(categoryId);
        if (category === undefined) {
            return;
        }
        const type = category.type ?? 'word';
        const difficulty = category.difficulty ?? 'beginner';
        const request: IGenerateCategoryRequest = {
            prompt: category.prompt,
            sourceLang: category.sourceLang,
            targetLang: category.targetLang,
            itemCount,
            type,
            difficulty,
        };
        onProgress?.(`Generating ${type} cards with AI...`);
        const result = await this.aiGenerationService.generateCategory(request);
        const settings = this.settingsService.getSettings();
        const cards = await this.buildCards(categoryId, result.items, settings.useImages, onProgress, type);
        const updatedCategory: IFlashcardCategory = {
            ...category,
            type,
            difficulty,
            sessionCount: 0,
        };
        await this.databaseService.database.transaction(
            'rw',
            [this.databaseService.database.categories, this.databaseService.database.flashcards],
            async () => {
                await this.databaseService.database.flashcards.where('categoryId').equals(categoryId).delete();
                if (cards.length > 0) {
                    await this.databaseService.database.flashcards.bulkAdd(cards);
                }
                await this.databaseService.database.categories.put(updatedCategory);
            }
        );
    }

    public async delete(id: string): Promise<void> {
        await this.databaseService.database.transaction(
            'rw',
            [this.databaseService.database.categories, this.databaseService.database.flashcards],
            async () => {
                await this.databaseService.database.flashcards.where('categoryId').equals(id).delete();
                await this.databaseService.database.categories.delete(id);
            }
        );
    }

    private async buildCards(
        categoryId: string,
        items: IFlashcardItem[],
        useImages: boolean,
        onProgress?: (stage: string) => void,
        type: FlashcardType = 'word'
    ): Promise<IFlashcard[]> {
        const cards: IFlashcard[] = [];
        const total = items.length;
        let completedImages = 0;
        const wantsImages = useImages && IMAGE_TYPES.has(type);
        const imageUrls = await mapWithConcurrency(items, IMAGE_CONCURRENCY, async (item) => {
            if (!wantsImages) {
                return [];
            }
            let urls: string[] = [];
            try {
                urls = await this.imageSearchService.findImages(item);
            } catch {
                urls = [];
            }
            completedImages += 1;
            onProgress?.(`Searching images (${completedImages}/${total})...`);
            return urls;
        });
        for (const [index, item] of items.entries()) {
            const isWord = type === 'word';
            const clean = (text: string): string => {
                if (!isWord) {
                    return text;
                }
                const stripped = stripLeadingArticle(text);
                return stripped.length > 0 ? stripped : text;
            };
            cards.push({
                id: generateId(),
                categoryId,
                front: clean(item.front),
                back: clean(item.back),
                frontDefinition: item.frontDefinition,
                backDefinition: item.backDefinition,
                exampleSource: item.exampleSource,
                exampleTarget: item.exampleTarget,
                imageUrl: imageUrls[index]?.[0] ?? null,
                imageUrl2: imageUrls[index]?.[1] ?? null,
                level: 0,
                reviewCount: 0,
                correctCount: 0,
                wrongCount: 0,
                lastReviewedAt: null,
                nextReviewAt: null,
                lastResult: null,
                type,
            });
        }
        return cards;
    }
}
