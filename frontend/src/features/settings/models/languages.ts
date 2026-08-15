export interface ILanguageOption {
    code: string;
    label: string;
}

export const LANGUAGES: ILanguageOption[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'pl', label: 'Polski' },
    { code: 'sv', label: 'Svenska' },
    { code: 'da', label: 'Dansk' },
    { code: 'no', label: 'Norsk' },
    { code: 'fi', label: 'Suomi' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'zh', label: '中文' },
    { code: 'ru', label: 'Русский' },
    { code: 'ar', label: 'العربية' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'hi', label: 'हिन्दी' },
];

export function getLanguageLabel(code: string): string {
    const language = LANGUAGES.find((item) => item.code === code);
    return language?.label ?? code;
}
