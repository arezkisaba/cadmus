import type { IFlashcardItem } from '@shared/models/FlashcardModels';

export interface IImageSearchService {
    findImages(item: IFlashcardItem): Promise<string[]>;
}
