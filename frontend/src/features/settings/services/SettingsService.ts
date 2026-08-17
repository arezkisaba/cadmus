import type { IAppSettings } from '@shared/models/FlashcardModels';
import { injectable } from 'tsyringe';
import type { ISettingsService } from './ports/ISettingsService';

const SETTINGS_STORAGE_KEY = 'cadmus-settings';

const DEFAULT_SETTINGS: IAppSettings = {
    deepseekApiKey: '',
    qwenApiKey: '',
    chatGptApiKey: '',
    claudeApiKey: '',
    pixabayApiKey: '',
    pexelsApiKey: '',
    unsplashApiKey: '',
    sourceLang: 'fr',
    targetLang: 'en',
    useImages: true,
};

@injectable()
export class SettingsService implements ISettingsService {
    public getSettings(): IAppSettings {
        const stored = this.readStoredSettings();
        return { ...DEFAULT_SETTINGS, ...stored };
    }

    public updateSettings(settings: Partial<IAppSettings>): IAppSettings {
        const merged = { ...this.getSettings(), ...settings };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
    }

    // #region Private use

    private readStoredSettings(): Partial<IAppSettings> {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw === null) {
            return {};
        }
        try {
            return JSON.parse(raw) as Partial<IAppSettings>;
        } catch {
            return {};
        }
    }

    // #endregion
}
