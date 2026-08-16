import type { ISongSearchResult } from '@shared/models/SongModels';
import { Loader2, Music2, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DI_CONSTANTS } from '@/di-constants';
import { useInjection } from '@/hooks/use-container';
import type { ISongsService } from '../services/ports/ISongsService';

export const SongsPage: React.FC = () => {
    const songsService = useInjection<ISongsService>(DI_CONSTANTS.ISongsService);
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ISongSearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = useCallback(async (): Promise<void> => {
        const trimmed = query.trim();
        if (trimmed.length === 0) {
            return;
        }
        setSearching(true);
        setResults([]);
        try {
            setResults(await songsService.searchSongs(trimmed));
        } finally {
            setSearching(false);
        }
    }, [query, songsService]);

    const handleSelectSong = useCallback(
        (song: ISongSearchResult): void => {
            songsService.cacheSong(song).catch(() => undefined);
            navigate(`/songs/${song.trackId}`, { state: { song } });
        },
        [songsService, navigate]
    );

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Songs</h2>
                <p className="text-muted-foreground text-sm">Search a song, then choose the translation direction on its page.</p>
            </div>

            <div className="flex gap-2">
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                    placeholder="Search a song by name..."
                    disabled={searching}
                />
                <Button onClick={handleSearch} disabled={searching || query.trim().length === 0}>
                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search />}
                    Search
                </Button>
            </div>

            {searching && (
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Searching...
                </p>
            )}

            {!searching && results.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {results.map((song) => (
                        <button
                            key={song.trackId}
                            type="button"
                            onClick={() => handleSelectSong(song)}
                            className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent"
                        >
                            {song.artworkUrl ? (
                                <img src={song.artworkUrl} alt={song.title} className="size-12 rounded-md object-cover" loading="lazy" />
                            ) : (
                                <div className="bg-muted flex size-12 items-center justify-center rounded-md">
                                    <Music2 className="size-5" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate font-medium">{song.title}</p>
                                <p className="text-muted-foreground truncate text-sm">{song.artist}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
