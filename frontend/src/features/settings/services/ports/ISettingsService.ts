import type { IAppSettings } from '@shared/models/FlashcardModels';

export interface ISettingsService {
    getSettings(): IAppSettings;
    updateSettings(settings: Partial<IAppSettings>): IAppSettings;
}
