import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createHash } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

import { LyricsCache } from '../src/server/lyrics/lyricsCache.js';

let tempDir: string;
let cache: LyricsCache;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'lyrics-cache-test-'));
  cache = new LyricsCache(tempDir, 1 / 60); // 1 minute TTL
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('LyricsCache', () => {
  const artist = 'Artist';
  const title = 'Song';

  function cacheFilePath(): string {
    const normalized = `${artist.toLowerCase().trim()}:${title.toLowerCase().trim()}`;
    const key = createHash('md5').update(normalized).digest('hex');
    return path.join(tempDir, `${key}.json`);
  }

  test('returns null when cache file does not exist', () => {
    expect(cache.get(artist, title)).toBeNull();
  });

  test('saves and retrieves lyrics data', () => {
    cache.set(artist, title, {
      lyrics: 'Lyrics',
      hasSynced: false,
      source: 'test',
      cachedAt: 0,
    });

    const cached = cache.get(artist, title);
    expect(cached).not.toBeNull();
    expect(cached?.lyrics).toBe('Lyrics');
    expect(cached?.source).toBe('test');
    expect(typeof cached?.cachedAt).toBe('number');
  });

  test('returns null when cache entry expired', async () => {
    cache.set(artist, title, {
      lyrics: 'Lyrics',
      hasSynced: false,
      source: 'test',
      cachedAt: 0,
    });

    const file = cacheFilePath();
    const contents = JSON.parse(await readFile(file, 'utf-8'));
    contents.cachedAt = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    await writeFile(file, JSON.stringify(contents), 'utf-8');

    expect(cache.get(artist, title)).toBeNull();
  });
});
