/**
 * File-based cache for lyrics
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface CachedLyrics {
  lyrics: string;
  synced?: Array<{ time: number; text: string }>;
  hasSynced: boolean;
  source: string;
  cachedAt: number;
}

export class LyricsCache {
  private cacheDir: string;
  private maxAge: number;

  constructor(cacheDir: string = '.cache/lyrics', maxAgeHours: number = 168) {
    // 168 hours = 7 days
    this.cacheDir = cacheDir;
    this.maxAge = maxAgeHours * 60 * 60 * 1000;

    // Ensure cache directory exists
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
      console.log(`Created lyrics cache directory: ${this.cacheDir}`);
    }
  }

  /**
   * Generate cache key from artist and title
   */
  private getCacheKey(artist: string, title: string): string {
    const normalized = `${artist.toLowerCase().trim()}:${title.toLowerCase().trim()}`;
    return createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Get cache file path
   */
  private getCacheFilePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  /**
   * Get lyrics from cache
   */
  get(artist: string, title: string): CachedLyrics | null {
    const key = this.getCacheKey(artist, title);
    const filePath = this.getCacheFilePath(key);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const data = readFileSync(filePath, 'utf-8');
      const cached: CachedLyrics = JSON.parse(data);

      // Check if cache is still valid
      const age = Date.now() - cached.cachedAt;
      if (age > this.maxAge) {
        console.log(`[LyricsCache] Cache expired for: ${artist} - ${title}`);
        return null;
      }

      console.log(`[LyricsCache] Cache hit for: ${artist} - ${title}`);
      return cached;
    } catch (error) {
      console.error('[LyricsCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Save lyrics to cache
   */
  set(artist: string, title: string, lyrics: CachedLyrics): void {
    const key = this.getCacheKey(artist, title);
    const filePath = this.getCacheFilePath(key);

    try {
      const data: CachedLyrics = {
        ...lyrics,
        cachedAt: Date.now(),
      };

      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`[LyricsCache] Cached lyrics for: ${artist} - ${title}`);
    } catch (error) {
      console.error('[LyricsCache] Error writing cache:', error);
    }
  }
}
