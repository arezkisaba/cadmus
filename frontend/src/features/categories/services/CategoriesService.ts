import type { IFlashcard, IFlashcardCategory, IGenerateCategoryRequest } from '@shared/models/FlashcardModels';
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

    public async createFromPrompt(prompt: string, languagePair: ILanguagePair, onProgress?: (stage: string) => void): Promise<IFlashcardCategory> {
        const settings = this.settingsService.getSettings();
        const request: IGenerateCategoryRequest = {
            prompt,
            sourceLang: languagePair.sourceLang,
            targetLang: languagePair.targetLang,
        };
        onProgress?.('Generating vocabulary with AI...');
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
        };

        const useImages = settings.useImages;
        const cards: IFlashcard[] = [];
        const total = result.items.length;
        let completedImages = 0;
        const imageUrls = await mapWithConcurrency(result.items, IMAGE_CONCURRENCY, async (item) => {
            if (!useImages) {
                return null;
            }
            let imageUrl: string | null = null;
            try {
                imageUrl = await this.imageSearchService.findFirstImage(item);
            } catch {
                imageUrl = null;
            }
            completedImages += 1;
            onProgress?.(`Searching images (${completedImages}/${total})...`);
            return imageUrl;
        });
        for (const [index, item] of result.items.entries()) {
            cards.push({
                id: generateId(),
                categoryId,
                front: item.front,
                back: item.back,
                frontDefinition: item.frontDefinition,
                backDefinition: item.backDefinition,
                imageUrl: imageUrls[index],
                level: 0,
                reviewCount: 0,
                correctCount: 0,
                wrongCount: 0,
                lastReviewedAt: null,
                nextReviewAt: null,
            });
        }

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
}
