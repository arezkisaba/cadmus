import 'reflect-metadata';
import { container } from 'tsyringe';
import { DI_CONSTANTS } from './di-constants';
import { DatabaseService } from './features/_shared/services/DatabaseService';
import { AiGenerationService } from './features/ai/services/AiGenerationService';
import type { IAiGenerationService } from './features/ai/services/ports/IAiGenerationService';
import { ChatGptAiProvider } from './features/ai/services/providers/ChatGptAiProvider';
import { ClaudeAiProvider } from './features/ai/services/providers/ClaudeAiProvider';
import { DeepSeekAiProvider } from './features/ai/services/providers/DeepSeekAiProvider';
import { MistralAiProvider } from './features/ai/services/providers/MistralAiProvider';
import { QwenAiProvider } from './features/ai/services/providers/QwenAiProvider';
import { CategoriesService } from './features/categories/services/CategoriesService';
import type { ICategoriesService } from './features/categories/services/ports/ICategoriesService';
import { FlashcardsService } from './features/flashcards/services/FlashcardsService';
import type { IFlashcardService } from './features/flashcards/services/ports/IFlashcardService';
import { ImageSearchService } from './features/images/services/ImageSearchService';
import type { IImageSearchService } from './features/images/services/ports/IImageSearchService';
import { OpenverseImageSearchService } from './features/images/services/providers/OpenverseImageSearchService';
import { PexelsImageSearchService } from './features/images/services/providers/PexelsImageSearchService';
import { PixabayImageSearchService } from './features/images/services/providers/PixabayImageSearchService';
import { UnsplashImageSearchService } from './features/images/services/providers/UnsplashImageSearchService';
import { WikimediaImageSearchService } from './features/images/services/providers/WikimediaImageSearchService';
import type { ISettingsService } from './features/settings/services/ports/ISettingsService';
import { SettingsService } from './features/settings/services/SettingsService';
import type { ISongsService } from './features/songs/services/ports/ISongsService';
import { SongsService } from './features/songs/services/SongsService';

container.registerSingleton<DatabaseService>(DI_CONSTANTS.IDatabaseService, DatabaseService);
container.registerSingleton<ISettingsService>(DI_CONSTANTS.ISettingsService, SettingsService);
container.registerSingleton<IAiGenerationService>(DI_CONSTANTS.IDeepSeekAiProvider, DeepSeekAiProvider);
container.registerSingleton<IAiGenerationService>(DI_CONSTANTS.IQwenAiProvider, QwenAiProvider);
container.registerSingleton<IAiGenerationService>(DI_CONSTANTS.IChatGptAiProvider, ChatGptAiProvider);
container.registerSingleton<IAiGenerationService>(DI_CONSTANTS.IClaudeAiProvider, ClaudeAiProvider);
container.registerSingleton<IAiGenerationService>(DI_CONSTANTS.IMistralAiProvider, MistralAiProvider);
container.register<IAiGenerationService[]>(DI_CONSTANTS.IAiProviders, {
    useFactory: (dependencyContainer) => [
        dependencyContainer.resolve<IAiGenerationService>(DI_CONSTANTS.IDeepSeekAiProvider),
        dependencyContainer.resolve<IAiGenerationService>(DI_CONSTANTS.IQwenAiProvider),
        dependencyContainer.resolve<IAiGenerationService>(DI_CONSTANTS.IChatGptAiProvider),
        dependencyContainer.resolve<IAiGenerationService>(DI_CONSTANTS.IClaudeAiProvider),
        dependencyContainer.resolve<IAiGenerationService>(DI_CONSTANTS.IMistralAiProvider),
    ],
});
container.registerSingleton<IAiGenerationService>(DI_CONSTANTS.IAiGenerationService, AiGenerationService);
container.registerSingleton<IImageSearchService>(DI_CONSTANTS.IPixabayImageSearchService, PixabayImageSearchService);
container.registerSingleton<IImageSearchService>(DI_CONSTANTS.IPexelsImageSearchService, PexelsImageSearchService);
container.registerSingleton<IImageSearchService>(DI_CONSTANTS.IUnsplashImageSearchService, UnsplashImageSearchService);
container.registerSingleton<IImageSearchService>(DI_CONSTANTS.IOpenverseImageSearchService, OpenverseImageSearchService);
container.registerSingleton<IImageSearchService>(DI_CONSTANTS.IWikimediaImageSearchService, WikimediaImageSearchService);
container.register<IImageSearchService[]>(DI_CONSTANTS.IImageSearchProviders, {
    useFactory: (dependencyContainer) => [
        dependencyContainer.resolve<IImageSearchService>(DI_CONSTANTS.IPixabayImageSearchService),
        dependencyContainer.resolve<IImageSearchService>(DI_CONSTANTS.IPexelsImageSearchService),
        dependencyContainer.resolve<IImageSearchService>(DI_CONSTANTS.IUnsplashImageSearchService),
        dependencyContainer.resolve<IImageSearchService>(DI_CONSTANTS.IOpenverseImageSearchService),
        dependencyContainer.resolve<IImageSearchService>(DI_CONSTANTS.IWikimediaImageSearchService),
    ],
});
container.registerSingleton<IImageSearchService>(DI_CONSTANTS.IImageSearchService, ImageSearchService);
container.registerSingleton<ICategoriesService>(DI_CONSTANTS.ICategoriesService, CategoriesService);
container.registerSingleton<IFlashcardService>(DI_CONSTANTS.IFlashcardService, FlashcardsService);
container.registerSingleton<ISongsService>(DI_CONSTANTS.ISongsService, SongsService);

export { DI_CONSTANTS };
