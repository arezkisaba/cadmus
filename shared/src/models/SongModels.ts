export interface ISongSearchResult {
    trackId: number;
    title: string;
    artist: string;
    artworkUrl?: string;
    previewUrl?: string;
}

export interface ISongLyricLine {
    original: string;
    translation: string;
}

export interface ISongLyrics {
    title: string;
    artist: string;
    artworkUrl?: string;
    lines: ISongLyricLine[];
}

export interface ISongCacheEntry {
    id: string;
    kind: 'meta' | 'lyrics';
    trackId: number;
    sourceLang?: string;
    targetLang?: string;
    data: ISongSearchResult | ISongLyrics;
    cachedAt: number;
}
