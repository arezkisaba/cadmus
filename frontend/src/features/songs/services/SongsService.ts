import type { ISongCacheEntry, ISongLyrics, ISongSearchResult } from '@shared/models/SongModels';
import { inject, injectable } from 'tsyringe';
import { DI_CONSTANTS } from '../../../di-constants';
import type { DatabaseService } from '../../_shared/services/DatabaseService';
import type { IAiGenerationService } from '../../ai/services/ports/IAiGenerationService';
import type { ISongsService } from './ports/ISongsService';

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';
const LYRICS_API_URL = 'https://api.lyrics.ovh/v1';

interface IItunesTrack {
    trackId?: number;
    trackName?: string;
    artistName?: string;
    artworkUrl100?: string;
    previewUrl?: string;
}

interface IItunesResponse {
    results?: IItunesTrack[];
}

@injectable()
export class SongsService implements ISongsService {
    public constructor(
        @inject(DI_CONSTANTS.IDatabaseService) private readonly databaseService: DatabaseService,
        @inject(DI_CONSTANTS.IAiGenerationService) private readonly aiGenerationService: IAiGenerationService
    ) {}

    public async searchSongs(query: string): Promise<ISongSearchResult[]> {
        const url = new URL(ITUNES_SEARCH_URL);
        url.searchParams.set('term', query);
        url.searchParams.set('entity', 'song');
        url.searchParams.set('limit', '10');

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Search failed (${response.status})`);
        }
        const data = (await response.json()) as IItunesResponse;
        return (data.results ?? []).map((track) => this.toSong(track)).filter((song) => song.title.length > 0 && song.artist.length > 0);
    }

    public async getSongById(trackId: number): Promise<ISongSearchResult | undefined> {
        const url = new URL(ITUNES_LOOKUP_URL);
        url.searchParams.set('id', String(trackId));
        url.searchParams.set('entity', 'song');

        const response = await fetch(url.toString());
        if (!response.ok) {
            return undefined;
        }
        const data = (await response.json()) as IItunesResponse;
        const track = data.results?.[0];
        if (track === undefined) {
            return undefined;
        }
        const song = this.toSong(track);
        if (song.title.length === 0 || song.artist.length === 0) {
            return undefined;
        }
        await this.cacheSong(song);
        return song;
    }

    public async cacheSong(song: ISongSearchResult): Promise<void> {
        const entry: ISongCacheEntry = {
            id: `meta:${song.trackId}`,
            kind: 'meta',
            trackId: song.trackId,
            data: song,
            cachedAt: Date.now(),
        };
        await this.databaseService.database.songCache.put(entry);
    }

    public async getCachedSong(trackId: number): Promise<ISongSearchResult | undefined> {
        const entry = await this.databaseService.database.songCache.get(`meta:${trackId}`);
        return entry !== undefined && entry.kind === 'meta' ? (entry.data as ISongSearchResult) : undefined;
    }

    public async loadSongLyrics(
        song: ISongSearchResult,
        sourceLang: string,
        targetLang: string,
        onProgress?: (stage: string) => void,
        force = false
    ): Promise<ISongLyrics> {
        const cacheId = `lyrics:${song.trackId}:${sourceLang}:${targetLang}`;
        if (!force) {
            const cached = await this.databaseService.database.songCache.get(cacheId);
            if (cached !== undefined && cached.kind === 'lyrics') {
                return cached.data as ISongLyrics;
            }
        }

        onProgress?.('Fetching lyrics...');
        let lyrics = '';
        try {
            const url = `${LYRICS_API_URL}/${encodeURIComponent(song.artist)}/${encodeURIComponent(song.title)}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = (await response.json()) as { lyrics?: string };
                lyrics = data.lyrics ?? '';
            }
        } catch {
            lyrics = '';
        }
        if (lyrics.trim().length === 0) {
            throw new Error('Could not find lyrics for this song');
        }

        onProgress?.('Translating lyrics with AI...');
        const translations = await this.aiGenerationService.translateSongLyrics(lyrics, sourceLang, targetLang);

        const originalLines = lyrics.split('\n');
        const lines = originalLines
            .map((original, index) => ({
                original: original.trim(),
                translation: translations[index] ?? '',
            }))
            .filter((line) => line.original.length > 0);

        const result: ISongLyrics = {
            title: song.title,
            artist: song.artist,
            artworkUrl: song.artworkUrl,
            lines,
        };

        const entry: ISongCacheEntry = {
            id: cacheId,
            kind: 'lyrics',
            trackId: song.trackId,
            sourceLang,
            targetLang,
            data: result,
            cachedAt: Date.now(),
        };
        await this.databaseService.database.songCache.put(entry);

        return result;
    }

    private toSong(track: IItunesTrack): ISongSearchResult {
        return {
            trackId: track.trackId ?? 0,
            title: track.trackName ?? '',
            artist: track.artistName ?? '',
            artworkUrl: track.artworkUrl100,
            previewUrl: track.previewUrl,
        };
    }
}
