/**
 * Fetch lyrics from various sources
 */

import { LyricsCache } from './lyricsCache.js';

export interface LyricsFetcherOptions {
  cache?: LyricsCache;
  fetchFn?: typeof fetch;
  notFoundTtlMs?: number;
}

export interface LyricsResult {
  lyrics: string;
  synced?: Array<{ time: number; text: string }>;
  hasSynced: boolean;
  source: string;
}

export class LyricsFetcher {
  private cache: LyricsCache;
  private pendingFetches = new Map<string, Promise<LyricsResult | null>>();
  private notFoundTimestamps = new Map<string, number>();
  private readonly notFoundTtlMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: LyricsFetcherOptions = {}) {
    this.cache = options.cache ?? new LyricsCache();
    this.fetchFn = options.fetchFn ?? fetch;
    // Avoid hammering providers for tracks without lyrics (default: 1 hour)
    this.notFoundTtlMs = options.notFoundTtlMs ?? 60 * 60 * 1000;
  }

  /**
   * Fetch lyrics for a song
   */
  async fetch(artist: string, title: string): Promise<LyricsResult | null> {
    const key = this.getTrackKey(artist, title);

    // Check cache first
    const cached = this.cache.get(artist, title);
    if (cached) {
      return {
        lyrics: cached.lyrics,
        synced: cached.synced,
        hasSynced: cached.hasSynced,
        source: `${cached.source} (cached)`,
      };
    }

    // Skip if we recently saw a negative result
    const lastNotFound = this.notFoundTimestamps.get(key);
    if (lastNotFound && Date.now() - lastNotFound < this.notFoundTtlMs) {
      return null;
    }

    const pending = this.pendingFetches.get(key);
    if (pending) {
      return pending;
    }

    const fetchPromise = this.fetchAndCache(artist, title, key);
    this.pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Prefetch lyrics without bubbling up errors
   */
  prefetch(artist: string, title: string): void {
    this.fetch(artist, title).catch((error) => {
      console.error('[LyricsFetcher] Prefetch error:', error);
    });
  }

  private async fetchAndCache(
    artist: string,
    title: string,
    key: string
  ): Promise<LyricsResult | null> {
    try {
      console.log(`[LyricsFetcher] Fetching lyrics from lrclib.net: ${artist} - ${title}`);
      const result = await this.fetchFromLRCLib(artist, title);

      if (result) {
        this.cache.set(artist, title, {
          lyrics: result.lyrics,
          synced: result.synced,
          hasSynced: result.hasSynced,
          source: result.source,
          cachedAt: Date.now(),
        });
        this.notFoundTimestamps.delete(key);
      } else {
        this.notFoundTimestamps.set(key, Date.now());
      }

      return result;
    } finally {
      this.pendingFetches.delete(key);
    }
  }

  /**
   * Fetch from lrclib.net
   */
  private async fetchFromLRCLib(artist: string, title: string): Promise<LyricsResult | null> {
    try {
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
      const response = await this.fetchFn(url);

      if (!response.ok) {
        console.log(`[LyricsFetcher] lrclib.net returned status ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.plainLyrics && !data.syncedLyrics) {
        console.log('[LyricsFetcher] No lyrics found in lrclib.net response');
        return null;
      }

      const result: LyricsResult = {
        lyrics: data.plainLyrics || data.syncedLyrics || '',
        hasSynced: !!data.syncedLyrics,
        source: 'lrclib.net',
      };

      // Parse synced lyrics if available
      if (data.syncedLyrics) {
        result.synced = this.parseLRC(data.syncedLyrics);
      }

      console.log(`[LyricsFetcher] Successfully fetched lyrics (synced: ${result.hasSynced})`);
      return result;
    } catch (error) {
      console.error('[LyricsFetcher] Error fetching from lrclib.net:', error);
      return null;
    }
  }

  /**
   * Parse LRC format to array of {time, text}
   */
  private parseLRC(lrc: string): Array<{ time: number; text: string }> {
    const lines = lrc.split('\n');
    const parsed: Array<{ time: number; text: string }> = [];

    for (const line of lines) {
      // Match [mm:ss.xx] or [mm:ss] format
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = parseInt(match[3].padEnd(2, '0').substring(0, 2), 10);
        const text = match[4].trim();

        const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;

        parsed.push({
          time: timeInSeconds,
          text: text || '',
        });
      }
    }

    return parsed;
  }

  private getTrackKey(artist: string, title: string): string {
    return `${artist.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
  }
}
