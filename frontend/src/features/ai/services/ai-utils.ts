import type { IFlashcardItem, IGenerateCategoryRequest, IGenerateCategoryResponse } from '@shared/models/FlashcardModels';

export interface IAiMessage {
    role: string;
    content: string;
}

export function buildCategoryMessages(request: IGenerateCategoryRequest): IAiMessage[] {
    return [
        {
            role: 'system',
            content: [
                'You are a language learning assistant.',
                `The source language is ${request.sourceLang} and the target language is ${request.targetLang}.`,
                'Given a theme prompt, generate a vocabulary list of common, everyday items related to the theme.',
                'Respond with a single JSON object in this exact format:',
                '{"categoryName": "short category name", "items": [{"front": "word in ' +
                    request.sourceLang +
                    '", "back": "translation in ' +
                    request.targetLang +
                    '", "frontDefinition": "short definition in ' +
                    request.sourceLang +
                    '", "backDefinition": "short definition in ' +
                    request.targetLang +
                    '"}]}',
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
    useJsonMode: boolean
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

interface IParsedCategory {
    categoryName?: string;
    items?: IFlashcardItem[];
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
