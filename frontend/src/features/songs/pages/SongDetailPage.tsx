import type { ISongLyrics, ISongSearchResult } from '@shared/models/SongModels';
import { ArrowLeft, Languages, Loader2, Music2, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DI_CONSTANTS } from '@/di-constants';
import { speak } from '@/features/_shared/utils/speech';
import { LANGUAGES } from '@/features/settings/models/languages';
import type { ISettingsService } from '@/features/settings/services/ports/ISettingsService';
import { useInjection } from '@/hooks/use-container';
import type { ISongsService } from '../services/ports/ISongsService';

export const SongDetailPage: React.FC = () => {
    const { trackId } = useParams<{ trackId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const songsService = useInjection<ISongsService>(DI_CONSTANTS.ISongsService);
    const settingsService = useInjection<ISettingsService>(DI_CONSTANTS.ISettingsService);

    const initialSong = (location.state as { song?: ISongSearchResult } | null)?.song;
    const [song, setSong] = useState<ISongSearchResult | null>(initialSong ?? null);
    const [loadingSong, setLoadingSong] = useState(initialSong === undefined);
    const [sourceLang, setSourceLang] = useState(settingsService.getSettings().sourceLang);
    const [targetLang, setTargetLang] = useState(settingsService.getSettings().targetLang);
    const [lyrics, setLyrics] = useState<ISongLyrics | null>(null);
    const [loadingLyrics, setLoadingLyrics] = useState(false);
    const [progressText, setProgressText] = useState('');
    const loadSeqRef = useRef(0);

    useEffect(() => {
        if (initialSong !== undefined || trackId === undefined) {
            return;
        }
        let cancelled = false;
        const load = async (): Promise<void> => {
            const id = Number(trackId);
            const cached = await songsService.getCachedSong(id);
            const found = cached ?? (await songsService.getSongById(id));
            if (cancelled) {
                return;
            }
            if (found !== undefined) {
                setSong(found);
            }
            setLoadingSong(false);
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [trackId, initialSong, songsService]);

    const loadLyrics = useCallback(
        async (source: string, target: string): Promise<void> => {
            if (song === null) {
                return;
            }
            const seq = ++loadSeqRef.current;
            setLoadingLyrics(true);
            setProgressText('Loading lyrics...');
            try {
                const loaded = await songsService.loadSongLyrics(song, source, target, (stage) => setProgressText(stage));
                if (seq !== loadSeqRef.current) {
                    return;
                }
                setLyrics(loaded);
            } catch (error) {
                if (seq !== loadSeqRef.current) {
                    return;
                }
                const message = error instanceof Error ? error.message : 'Failed to load lyrics';
                toast.error(message);
            } finally {
                if (seq === loadSeqRef.current) {
                    setLoadingLyrics(false);
                }
            }
        },
        [song, songsService]
    );

    const handleBack = useCallback((): void => {
        navigate('/songs');
    }, [navigate]);

    const handleLoad = useCallback((): void => {
        loadLyrics(sourceLang, targetLang);
    }, [loadLyrics, sourceLang, targetLang]);

    if (loadingSong) {
        return (
            <div className="flex flex-col items-center gap-6">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-[20rem] w-full max-w-3xl rounded-3xl" />
            </div>
        );
    }

    if (song === null) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <h2 className="text-xl font-semibold">Song not found</h2>
                <Button onClick={handleBack}>
                    <ArrowLeft />
                    Back to songs
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" onClick={handleBack} aria-label="Back to songs">
                    <ArrowLeft />
                </Button>
                <h2 className="truncate text-lg font-semibold">{song.title}</h2>
            </div>

            <Card className="flex flex-col gap-5 p-6">
                <div className="flex items-center gap-4">
                    {song.artworkUrl ? (
                        <img src={song.artworkUrl} alt={song.title} className="size-16 rounded-xl object-cover" />
                    ) : (
                        <div className="bg-muted flex size-16 items-center justify-center rounded-xl">
                            <Music2 className="size-6" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-semibold">{song.title}</h3>
                        <p className="text-muted-foreground text-sm">{song.artist}</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="song-source-lang">Original language</Label>
                        <Select id="song-source-lang" value={sourceLang} onChange={(event) => setSourceLang(event.target.value)}>
                            {LANGUAGES.map((language) => (
                                <option key={language.code} value={language.code}>
                                    {language.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="song-target-lang">Translation language</Label>
                        <Select id="song-target-lang" value={targetLang} onChange={(event) => setTargetLang(event.target.value)}>
                            {LANGUAGES.map((language) => (
                                <option key={language.code} value={language.code}>
                                    {language.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
                <Button onClick={handleLoad} disabled={loadingLyrics} className="w-full">
                    <Languages />
                    {lyrics === null ? 'Load translation' : 'Re-translate'}
                </Button>
            </Card>

            {loadingLyrics && (
                <div className="flex flex-col gap-2">
                    <Progress value={undefined} />
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        {progressText}
                    </p>
                </div>
            )}

            {lyrics !== null && !loadingLyrics && (
                <Card className="flex flex-col gap-3 p-6">
                    {lyrics.lines.map((line, index) => (
                        <div key={`${index}-${line.original}`} className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-4">
                            <p className="flex items-start gap-2 font-medium">
                                <span className="flex-1">{line.original}</span>
                                <button
                                    type="button"
                                    onClick={() => speak(line.original, sourceLang)}
                                    className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
                                    aria-label={`Listen to line ${index + 1}`}
                                >
                                    <Volume2 className="size-3.5" />
                                </button>
                            </p>
                            <p className="text-muted-foreground">{line.translation}</p>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
};
