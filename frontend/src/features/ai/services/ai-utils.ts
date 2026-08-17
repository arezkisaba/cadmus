import type {
    DifficultyLevel,
    FlashcardType,
    IFlashcardItem,
    IGenerateCategoryRequest,
    IGenerateCategoryResponse,
} from '@shared/models/FlashcardModels';
import { getLanguageLabel } from '@/features/settings/models/languages';

export interface IAiMessage {
    role: string;
    content: string;
}

function difficultyInstruction(difficulty: DifficultyLevel): string {
    switch (difficulty) {
        case 'elementary':
            return 'Target an elementary level: use common items with a slightly wider range than absolute beginners.';
        case 'intermediate':
            return 'Target an intermediate level: use a mix of common and more specific items.';
        case 'upper-intermediate':
            return 'Target an upper-intermediate level: use fairly varied and detailed items, including some idioms and nuances.';
        case 'advanced':
            return 'Target an advanced level: use less common, more nuanced and richer items, including rare words and idioms.';
        default:
            return 'Target a beginner level: use the most common, simple and everyday items.';
    }
}

function buildCategoryTypeInstructions(type: FlashcardType, sourceLabel: string, targetLabel: string, difficulty: DifficultyLevel): string[] {
    switch (type) {
        case 'expression':
            return [
                'Generate idiomatic expressions and set phrases.',
                `"front" is the expression in ${sourceLabel}, "back" is its translation or equivalent in ${targetLabel}.`,
                '"backDefinition" is a short explanation of the meaning and usage.',
                '"exampleSource" and "exampleTarget" are the same example sentence, respectively in each language.',
            ];
        case 'grammar':
            return [
                'Generate grammar points.',
                '"front" is a short rule title, "back" is a clear explanation of the rule.',
                '"exampleSource" and "exampleTarget" are an example sentence illustrating the rule, respectively in each language.',
            ];
        case 'phrase':
            return [
                'Generate useful everyday sentences.',
                `"front" is the sentence in ${sourceLabel}, "back" is its translation in ${targetLabel}.`,
                '"backDefinition" is a short note about when or how to use it.',
            ];
        case 'conjugation':
            return [
                `Generate verb conjugations in ${conjugationTenses(difficulty)}.`,
                `"front" is the verb infinitive in ${targetLabel} followed by the tense, "back" is the conjugated forms, one per line, in the standard person order (1st, 2nd, 3rd singular, then 1st, 2nd, 3rd plural).`,
            ];
        default:
            return [
                'Generate vocabulary words.',
                `"front" is the word in ${sourceLabel}, "back" is its translation in ${targetLabel}.`,
                '"frontDefinition" and "backDefinition" are short definitions in each language.',
            ];
    }
}

function conjugationTenses(difficulty: DifficultyLevel): string {
    switch (difficulty) {
        case 'elementary':
            return 'the present and past indicative tenses';
        case 'intermediate':
            return 'the present, past and future indicative tenses';
        case 'upper-intermediate':
            return 'the main indicative tenses plus the conditional';
        case 'advanced':
            return 'several tenses (indicative, conditional and subjunctive)';
        default:
            return 'the present indicative tense';
    }
}

export function buildCategoryMessages(request: IGenerateCategoryRequest): IAiMessage[] {
    const sourceLabel = getLanguageLabel(request.sourceLang);
    const targetLabel = getLanguageLabel(request.targetLang);
    const type = request.type ?? 'word';
    const difficulty = request.difficulty ?? 'beginner';
    const content: string[] = [
        'You are a language learning assistant.',
        `The source language is ${sourceLabel} and the target language is ${targetLabel}.`,
        'Given a theme prompt, generate a list of items related to the theme.',
        difficultyInstruction(difficulty),
        ...buildCategoryTypeInstructions(type, sourceLabel, targetLabel, difficulty),
        'Never repeat the same item: every entry in the list must be unique.',
        ...(type === 'word'
            ? [
                  'Avoid words that are spelled the same in both languages (e.g. "bus" is identical in French and English); prefer words that actually differ between the two languages so they are worth learning.',
                  'NEVER use articles: every word must be in the bare form, never preceded by "the", "a", "an" (English), "le", "la", "les", "un", "une" (French), "el", "la", "los", "las" (Spanish), "der", "die", "das" (German), or any other article in either language.',
              ]
            : []),
        'Respond with a single JSON object in this exact format:',
        `{"categoryName": "short category name", "items": [{"front": "...", "back": "...", "frontDefinition": "...", "backDefinition": "...", "exampleSource": "...", "exampleTarget": "..."}]}`,
        `Provide exactly ${request.itemCount ?? 20} items. Use empty strings for fields that do not apply. Return only valid JSON without markdown.`,
    ];
    return [
        {
            role: 'system',
            content: content.join(' '),
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

export async function callAnthropic(url: string, model: string, apiKey: string, messages: IAiMessage[], providerName: string): Promise<string> {
    const system = messages
        .filter((message) => message.role === 'system')
        .map((message) => message.content)
        .join('\n');
    const chatMessages = messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content }));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 8000,
            ...(system.length > 0 ? { system } : {}),
            messages: chatMessages,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`${providerName} API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
        content?: Array<{
            type?: string;
            text?: string;
        }>;
    };
    return data.content?.[0]?.text ?? '';
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
                  exampleSource: item.exampleSource === undefined ? undefined : String(item.exampleSource).trim(),
                  exampleTarget: item.exampleTarget === undefined ? undefined : String(item.exampleTarget).trim(),
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

export function buildChatMessages(history: IAiMessage[], sourceLang: string, targetLang: string): IAiMessage[] {
    const sourceLabel = getLanguageLabel(sourceLang);
    const targetLabel = getLanguageLabel(targetLang);
    const system: IAiMessage = {
        role: 'system',
        content: [
            'You are a friendly and patient language tutor.',
            `The learner's native language is ${sourceLabel} and the language being learned is ${targetLabel}.`,
            'Help with grammar, vocabulary, expressions, conjugation and translations of the target language.',
            `Answer in ${sourceLabel} by default, but always show your examples in ${targetLabel} with a ${sourceLabel} translation.`,
            'Be concise, give clear examples, and correct the learner when they write something in the target language, explaining the mistake.',
            'Use plain text with simple line breaks. Do not use markdown symbols, headings or code blocks.',
        ].join(' '),
    };
    return [system, ...history];
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
