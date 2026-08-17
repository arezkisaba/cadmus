import { buildSongTranslationMessages, parseSongTranslation } from './ai-utils';

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
