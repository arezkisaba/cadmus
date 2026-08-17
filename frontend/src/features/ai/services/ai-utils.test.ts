import { buildCategoryMessages, buildSongTranslationMessages, parseSongTranslation } from './ai-utils';

describe('buildCategoryMessages', () => {
    it('adds vocabulary rules for the default word type', () => {
        const messages = buildCategoryMessages({ prompt: 'les vêtements', sourceLang: 'fr', targetLang: 'en', itemCount: 10 });
        const system = messages[0].content;
        expect(system).toContain('NEVER use articles');
        expect(system).toContain('every entry in the list must be unique');
    });

    it('adds grammar instructions for the grammar type', () => {
        const messages = buildCategoryMessages({ prompt: 'passé composé', sourceLang: 'fr', targetLang: 'en', itemCount: 10, type: 'grammar' });
        const system = messages[0].content;
        expect(system).toContain('Generate grammar points');
        expect(system).toContain('exampleSource');
    });

    it('adds conjugation instructions for the conjugation type', () => {
        const messages = buildCategoryMessages({ prompt: 'verbes', sourceLang: 'fr', targetLang: 'en', itemCount: 10, type: 'conjugation' });
        const system = messages[0].content;
        expect(system).toContain('verb conjugations');
        expect(system).not.toContain('do not prefix words');
    });
});

describe('buildSongTranslationMessages', () => {
    it('builds a system message with the language direction and the lyrics as user message', () => {
        const messages = buildSongTranslationMessages('Hello\nWorld', 'fr', 'en');
        expect(messages).toHaveLength(2);
        expect(messages[0].role).toBe('system');
        expect(messages[0].content).toContain('from Français to English');
        expect(messages[1].role).toBe('user');
        expect(messages[1].content).toBe('Hello\nWorld');
    });
});

describe('parseSongTranslation', () => {
    it('parses an object with a lines array', () => {
        const content = JSON.stringify({ lines: ['Bonjour', 'Le monde'] });
        expect(parseSongTranslation(content)).toEqual(['Bonjour', 'Le monde']);
    });

    it('parses a bare JSON array', () => {
        const content = JSON.stringify(['Bonjour', 'Le monde']);
        expect(parseSongTranslation(content)).toEqual(['Bonjour', 'Le monde']);
    });

    it('parses markdown-wrapped JSON', () => {
        const content = '```json\n{"lines": ["Bonjour"]}\n```';
        expect(parseSongTranslation(content)).toEqual(['Bonjour']);
    });

    it('keeps empty strings for blank lines', () => {
        const content = JSON.stringify({ lines: ['Bonjour', '', 'Le monde'] });
        expect(parseSongTranslation(content)).toEqual(['Bonjour', '', 'Le monde']);
    });

    it('returns an empty array for invalid content', () => {
        expect(parseSongTranslation('no json here')).toEqual([]);
    });
});
