import type { IFlashcardItem, IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';
import { getLanguageLabel } from '@/features/settings/models/languages';

export interface IAiMessage {
    role: string;
    content: string;
}

export function buildCategoryMessages(request: IGenerateCategoryRequest): IAiMessage[] {
    const sourceLabel = getLanguageLabel(request.sourceLang);
    const targetLabel = getLanguageLabel(request.targetLang);
    return [
        {
            role: 'system',
            content: [
                'You are a language learning assistant.',
                `The source language is ${sourceLabel} and the target language is ${targetLabel}.`,
                'Given a theme prompt, generate a vocabulary list of common, everyday items related to the theme.',
                'Avoid words that are spelled the same in both languages (e.g. "bus" is identical in French and English); prefer words that actually differ between the two languages so they are worth learning.',
                'Never repeat the same word: every item in the list must be unique.',
                'Use the bare word form without articles: do not prefix words with "the", "a" or "an".',
                'Respond with a single JSON object in this exact format:',
                `{"categoryName": "short category name", "items": [{"front": "word in ${sourceLabel}", "back": "translation in ${targetLabel}", "frontDefinition": "short definition in ${sourceLabel}", "backDefinition": "short definition in ${targetLabel}"}]}`,
                `Provide exactly ${request.itemCount ?? 20} items. Each item must include a short definition (one or two sentences) in both languages. Return only valid JSON without markdown.`,
            ].join(' '),
        },
        {
            role: 'user',
            content: request.prompt,
        },
    ];
}

export async function callChatCompletions(
    url: string,
    model: string,
    apiKey: string,
    messages: IAiMessage[],
    providerName: string,
    useJsonMode: boolean,
    thinkingDisabled = false
): Promise<string> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 8000,
            ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
            ...(thinkingDisabled ? { thinking: { type: 'disabled' } } : {}),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`${providerName} API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
        choices?: Array<{
            message?: {
                content?: string;
            };
        }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
}

export function parseCategoryResponse(content: string): IGenerateCategoryResponse {
    const parsed = parseJsonContent(content);
    const items = Array.isArray(parsed.items)
        ? parsed.items
              .map((item) => ({
                  front: String(item.front ?? '').trim(),
                  back: String(item.back ?? '').trim(),
                  frontDefinition: item.frontDefinition === undefined ? undefined : String(item.frontDefinition).trim(),
                  backDefinition: item.backDefinition === undefined ? undefined : String(item.backDefinition).trim(),
              }))
              .filter((item) => item.front.length > 0 && item.back.length > 0)
        : [];

    if (items.length === 0) {
        throw new Error('AI returned an invalid or empty response, please try again');
    }

    return {
        categoryName: parsed.categoryName?.trim() || 'New category',
        items,
    };
}

export function buildSongTranslationMessages(lyrics: string, sourceLang: string, targetLang: string): IAiMessage[] {
    const sourceLabel = getLanguageLabel(sourceLang);
    const targetLabel = getLanguageLabel(targetLang);
    return [
        {
            role: 'system',
            content: [
                'You are a professional translator and language teacher.',
                `Translate the song lyrics from ${sourceLabel} to ${targetLabel}.`,
                'Preserve the meaning and, when possible, the tone of each line.',
                'Respond with a single JSON object in this exact format:',
                '{"lines": ["translation of line 1", "translation of line 2", ...]}',
                'Provide exactly one translation per line, in the same order as the lyrics, using an empty string for blank lines. Return only valid JSON without markdown.',
                'Answer directly and concisely. Do not include any reasoning or explanation — output only the JSON object.',
            ].join(' '),
        },
        {
            role: 'user',
            content: lyrics,
        },
    ];
}

export function parseSongTranslation(content: string): string[] {
    const parsed = parseJsonContent(content);
    if (Array.isArray(parsed.lines)) {
        return parsed.lines.map((line) => String(line ?? '').trim());
    }
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch !== null) {
        try {
            const array = JSON.parse(arrayMatch[0]) as unknown;
            if (Array.isArray(array)) {
                return array.map((line) => String(line ?? '').trim());
            }
        } catch {
            // Not a JSON array, fall through.
        }
    }
    return [];
}

interface IParsedCategory {
    categoryName?: string;
    items?: IFlashcardItem[];
    lines?: string[];
}

function parseJsonContent(content: string): IParsedCategory {
    try {
        return JSON.parse(content) as IParsedCategory;
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match === null) {
            return {};
        }
        try {
            return JSON.parse(match[0]) as IParsedCategory;
        } catch {
            return {};
        }
    }
}
