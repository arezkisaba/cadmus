import type { IFlashcardItem } from '@shared/models/FlashcardModels';

export interface IImageSearchService {
    findFirstImage(item: IFlashcardItem): Promise<string | null>;
}
