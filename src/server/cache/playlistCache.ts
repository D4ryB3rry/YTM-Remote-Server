/**
 * In-memory cache for playlists
 * Survives server restarts via singleton pattern
 */

import type { Playlist } from '@shared/types/index.js';

export class PlaylistCache {
  private static instance: PlaylistCache;
  private cache: Playlist[] | null = null;
  private lastUpdate: number = 0;

  private constructor() {}

  static getInstance(): PlaylistCache {
    if (!PlaylistCache.instance) {
      PlaylistCache.instance = new PlaylistCache();
    }
    return PlaylistCache.instance;
  }

  /**
   * Set playlists cache
   */
  set(playlists: Playlist[]): void {
    this.cache = playlists;
    this.lastUpdate = Date.now();
    console.log(`[PlaylistCache] Cached ${playlists.length} playlists`);
  }

  /**
   * Get cached playlists
   */
  get(): Playlist[] | null {
    if (!this.cache) {
      console.log('[PlaylistCache] No cache available');
      return null;
    }

    const age = Date.now() - this.lastUpdate;
    const ageMinutes = Math.floor(age / 60000);
    console.log(`[PlaylistCache] Returning cache (age: ${ageMinutes} minutes)`);

    return this.cache;
  }

  /**
   * Check if cache exists
   */
  has(): boolean {
    return this.cache !== null && this.cache.length > 0;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache = null;
    this.lastUpdate = 0;
    console.log('[PlaylistCache] Cache cleared');
  }

  /**
   * Get cache age in minutes
   */
  getAgeMinutes(): number {
    if (!this.cache) return -1;
    return Math.floor((Date.now() - this.lastUpdate) / 60000);
  }
}
