import type { IFlashcard, IFlashcardCategory } from '@shared/models/FlashcardModels';
import type { ISongCacheEntry } from '@shared/models/SongModels';
import type { EntityTable } from 'dexie';
import Dexie from 'dexie';
import { injectable } from 'tsyringe';

class CadmusDatabase extends Dexie {
    public categories!: EntityTable<IFlashcardCategory, 'id'>;
    public flashcards!: EntityTable<IFlashcard, 'id'>;
    public songCache!: EntityTable<ISongCacheEntry, 'id'>;

    public constructor() {
        super('cadmus-db');
        this.version(1).stores({
            categories: 'id, createdAt',
            flashcards: 'id, categoryId, level, nextReviewAt, [categoryId+nextReviewAt]',
        });
        this.version(2).stores({
            songCache: 'id, trackId',
        });
    }
}

@injectable()
export class DatabaseService {
    public readonly database: CadmusDatabase;

    public constructor() {
        this.database = new CadmusDatabase();
    }
}
