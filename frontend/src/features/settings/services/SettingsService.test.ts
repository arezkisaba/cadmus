import 'reflect-metadata';
import { SettingsService } from './SettingsService';

describe('SettingsService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns default settings when nothing is stored', () => {
        const service = new SettingsService();
        const settings = service.getSettings();
        expect(settings.sourceLang).toBe('fr');
        expect(settings.targetLang).toBe('en');
        expect(settings.useImages).toBe(true);
        expect(settings.deepseekApiKey).toBe('');
        expect(settings.pixabayApiKey).toBe('');
    });

    it('persists updates and reloads them', () => {
        const service = new SettingsService();
        const updated = service.updateSettings({ sourceLang: 'es', targetLang: 'de', deepseekApiKey: 'sk-test' });
        expect(updated.sourceLang).toBe('es');

        const reloaded = new SettingsService().getSettings();
        expect(reloaded.sourceLang).toBe('es');
        expect(reloaded.targetLang).toBe('de');
        expect(reloaded.deepseekApiKey).toBe('sk-test');
    });

    it('keeps unrelated settings unchanged when updating a subset', () => {
        const service = new SettingsService();
        service.updateSettings({ useImages: false });
        const reloaded = new SettingsService().getSettings();
        expect(reloaded.useImages).toBe(false);
        expect(reloaded.sourceLang).toBe('fr');
    });

    it('falls back to defaults when stored data is corrupted', () => {
        localStorage.setItem('cadmus-settings', '{invalid json');
        const service = new SettingsService();
        const settings = service.getSettings();
        expect(settings.sourceLang).toBe('fr');
        expect(settings.targetLang).toBe('en');
    });
});
