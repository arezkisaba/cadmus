import type { IFlashcard, IFlashcardCategory } from '@shared/models/FlashcardModels';
import type { EntityTable } from 'dexie';
import Dexie from 'dexie';
import { injectable } from 'tsyringe';

class CadmusDatabase extends Dexie {
    public categories!: EntityTable<IFlashcardCategory, 'id'>;
    public flashcards!: EntityTable<IFlashcard, 'id'>;

    public constructor() {
        super('cadmus-db');
        this.version(1).stores({
            categories: 'id, createdAt',
            flashcards: 'id, categoryId, level, nextReviewAt, [categoryId+nextReviewAt]',
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
