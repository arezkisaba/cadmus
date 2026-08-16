import type { ISongLyrics, ISongSearchResult } from '@shared/models/SongModels';

export interface ISongsService {
    searchSongs(query: string): Promise<ISongSearchResult[]>;
    getSongById(trackId: number): Promise<ISongSearchResult | undefined>;
    cacheSong(song: ISongSearchResult): Promise<void>;
    getCachedSong(trackId: number): Promise<ISongSearchResult | undefined>;
    loadSongLyrics(
        song: ISongSearchResult,
        sourceLang: string,
        targetLang: string,
        onProgress?: (stage: string) => void,
        force?: boolean
    ): Promise<ISongLyrics>;
}
