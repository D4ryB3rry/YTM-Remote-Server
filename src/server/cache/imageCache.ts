/**
 * File-based cache for album art and thumbnails
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface CachedImage {
  buffer: Buffer;
  contentType: string;
  cacheControl?: string;
  cachedAt: number;
}

interface CachedImageMeta {
  contentType: string;
  cacheControl?: string;
  cachedAt: number;
}

export class ImageCache {
  private cacheDir: string;
  private maxAge: number;

  constructor(cacheDir: string = '.cache/images', maxAgeHours: number = 168) {
    this.cacheDir = cacheDir;
    this.maxAge = maxAgeHours * 60 * 60 * 1000;

    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
      console.log(`Created image cache directory: ${this.cacheDir}`);
    }
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    return createHash('md5').update(url.trim().toLowerCase()).digest('hex');
  }

  private getDataPath(key: string): string {
    return join(this.cacheDir, `${key}.bin`);
  }

  private getMetaPath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  /**
   * Load image from cache (if valid)
   */
  async get(url: string): Promise<CachedImage | null> {
    const key = this.getCacheKey(url);
    const dataPath = this.getDataPath(key);
    const metaPath = this.getMetaPath(key);

    if (!existsSync(dataPath) || !existsSync(metaPath)) {
      return null;
    }

    try {
      const [buffer, metaRaw] = await Promise.all([
        fs.readFile(dataPath),
        fs.readFile(metaPath, 'utf-8'),
      ]);

      const meta = JSON.parse(metaRaw) as CachedImageMeta;
      const age = Date.now() - meta.cachedAt;

      if (age > this.maxAge) {
        console.log(`[ImageCache] Cache expired for: ${url}`);
        return null;
      }

      console.log(`[ImageCache] Cache hit for: ${url}`);
      return {
        buffer,
        contentType: meta.contentType,
        cacheControl: meta.cacheControl,
        cachedAt: meta.cachedAt,
      };
    } catch (error) {
      console.error('[ImageCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Save image to cache
   */
  async set(
    url: string,
    buffer: Buffer,
    contentType: string,
    cacheControl?: string
  ): Promise<void> {
    const key = this.getCacheKey(url);
    const dataPath = this.getDataPath(key);
    const metaPath = this.getMetaPath(key);

    const meta: CachedImageMeta = {
      contentType,
      cacheControl,
      cachedAt: Date.now(),
    };

    try {
      await Promise.all([
        fs.writeFile(dataPath, buffer),
        fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8'),
      ]);
      console.log(`[ImageCache] Cached image for: ${url}`);
    } catch (error) {
      console.error('[ImageCache] Error writing cache:', error);
    }
  }
}
