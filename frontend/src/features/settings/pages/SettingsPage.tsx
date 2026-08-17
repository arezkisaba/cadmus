import { ImageIcon, KeyRound, LanguagesIcon, SaveIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DI_CONSTANTS } from '@/di-constants';
import { useInjection } from '@/hooks/use-container';
import { LANGUAGES } from '../models/languages';
import type { ISettingsService } from '../services/ports/ISettingsService';

export const SettingsPage: React.FC = () => {
    const settingsService = useInjection<ISettingsService>(DI_CONSTANTS.ISettingsService);
    const initial = settingsService.getSettings();
    const [deepseekApiKey, setDeepseekApiKey] = useState(initial.deepseekApiKey);
    const [qwenApiKey, setQwenApiKey] = useState(initial.qwenApiKey);
    const [chatGptApiKey, setChatGptApiKey] = useState(initial.chatGptApiKey);
    const [claudeApiKey, setClaudeApiKey] = useState(initial.claudeApiKey);
    const [mistralApiKey, setMistralApiKey] = useState(initial.mistralApiKey);
    const [pixabayApiKey, setPixabayApiKey] = useState(initial.pixabayApiKey);
    const [pexelsApiKey, setPexelsApiKey] = useState(initial.pexelsApiKey);
    const [unsplashApiKey, setUnsplashApiKey] = useState(initial.unsplashApiKey);
    const [sourceLang, setSourceLang] = useState(initial.sourceLang);
    const [targetLang, setTargetLang] = useState(initial.targetLang);
    const [useImages, setUseImages] = useState(initial.useImages);

    const handleSave = useCallback((): void => {
        settingsService.updateSettings({
            deepseekApiKey,
            qwenApiKey,
            chatGptApiKey,
            claudeApiKey,
            mistralApiKey,
            pixabayApiKey,
            pexelsApiKey,
            unsplashApiKey,
            sourceLang,
            targetLang,
            useImages,
        });
        toast.success('Settings saved');
    }, [
        settingsService,
        deepseekApiKey,
        qwenApiKey,
        chatGptApiKey,
        claudeApiKey,
        mistralApiKey,
        pixabayApiKey,
        pexelsApiKey,
        unsplashApiKey,
        sourceLang,
        targetLang,
        useImages,
    ]);

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
                <p className="text-muted-foreground text-sm">Configure your AI provider, image search and language pair.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="size-4" />
                        AI providers
                    </CardTitle>
                    <CardDescription>
                        Used to generate flashcards, in priority order: DeepSeek, Qwen, ChatGPT, Claude, Mistral. Keys are stored locally.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="deepseek-key">DeepSeek API key</Label>
                        <Input
                            id="deepseek-key"
                            type="password"
                            value={deepseekApiKey}
                            onChange={(event) => setDeepseekApiKey(event.target.value)}
                            placeholder="sk-..."
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="qwen-key">Qwen API key</Label>
                        <Input
                            id="qwen-key"
                            type="password"
                            value={qwenApiKey}
                            onChange={(event) => setQwenApiKey(event.target.value)}
                            placeholder="sk-..."
                            autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">Used when DeepSeek has no key (DashScope, model qwen-turbo).</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="chatgpt-key">ChatGPT API key</Label>
                        <Input
                            id="chatgpt-key"
                            type="password"
                            value={chatGptApiKey}
                            onChange={(event) => setChatGptApiKey(event.target.value)}
                            placeholder="sk-..."
                            autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">Used when DeepSeek and Qwen have no key (model gpt-4o-mini).</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="claude-key">Claude API key</Label>
                        <Input
                            id="claude-key"
                            type="password"
                            value={claudeApiKey}
                            onChange={(event) => setClaudeApiKey(event.target.value)}
                            placeholder="sk-ant-..."
                            autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">Used when DeepSeek, Qwen and ChatGPT have no key (model claude-sonnet-4-5).</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="mistral-key">Mistral API key</Label>
                        <Input
                            id="mistral-key"
                            type="password"
                            value={mistralApiKey}
                            onChange={(event) => setMistralApiKey(event.target.value)}
                            placeholder="Sk-..."
                            autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">
                            Used when DeepSeek, Qwen, ChatGPT and Claude have no key (model mistral-large-latest).
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="size-4" />
                        Image providers
                    </CardTitle>
                    <CardDescription>
                        Keyed providers are used first when a key is set. Without keys, Openverse and Wikimedia provide free photos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="pixabay-key">Pixabay API key (optional)</Label>
                        <Input
                            id="pixabay-key"
                            type="password"
                            value={pixabayApiKey}
                            onChange={(event) => setPixabayApiKey(event.target.value)}
                            placeholder="Optional"
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="pexels-key">Pexels API key (optional)</Label>
                        <Input
                            id="pexels-key"
                            type="password"
                            value={pexelsApiKey}
                            onChange={(event) => setPexelsApiKey(event.target.value)}
                            placeholder="Optional"
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="unsplash-key">Unsplash API key (optional)</Label>
                        <Input
                            id="unsplash-key"
                            type="password"
                            value={unsplashApiKey}
                            onChange={(event) => setUnsplashApiKey(event.target.value)}
                            placeholder="Optional"
                            autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">
                            Without a key, free photos come from Openverse and Wikimedia (lower relevance).
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LanguagesIcon className="size-4" />
                        Language pair
                    </CardTitle>
                    <CardDescription>Cards show a word in the source language, you find the translation in the target language.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-lang">Source language</Label>
                            <Select id="source-lang" value={sourceLang} onChange={(event) => setSourceLang(event.target.value)}>
                                {LANGUAGES.map((language) => (
                                    <option key={language.code} value={language.code}>
                                        {language.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="target-lang">Target language</Label>
                            <Select id="target-lang" value={targetLang} onChange={(event) => setTargetLang(event.target.value)}>
                                {LANGUAGES.map((language) => (
                                    <option key={language.code} value={language.code}>
                                        {language.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            checked={useImages}
                            onChange={(event) => setUseImages(event.target.checked)}
                            className="border-input size-4 rounded-sm"
                        />
                        <ImageIcon className="size-4" />
                        Add photos to new flashcards
                    </label>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>
                    <SaveIcon />
                    Save settings
                </Button>
            </div>
        </div>
    );
};
