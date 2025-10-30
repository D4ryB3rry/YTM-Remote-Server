import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createHash } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

import { ImageCache } from '../src/server/cache/imageCache.js';

const imageUrl = 'https://example.com/image.jpg';

let tempDir: string;
let cache: ImageCache;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'image-cache-test-'));
  cache = new ImageCache(tempDir, 1 / 60); // 1 minute TTL
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('ImageCache', () => {
  test('stores and retrieves cached images', async () => {
    const buffer = Buffer.from('image-data');
    await cache.set(imageUrl, buffer, 'image/jpeg', 'max-age=60');

    const cached = await cache.get(imageUrl);
    expect(cached).not.toBeNull();
    expect(cached?.contentType).toBe('image/jpeg');
    expect(cached?.cacheControl).toBe('max-age=60');
    expect(cached?.buffer.equals(buffer)).toBe(true);
  });

  test('returns null when cache metadata is missing', async () => {
    const buffer = Buffer.from('image-data');
    await cache.set(imageUrl, buffer, 'image/jpeg');

    const key = createHash('md5').update(imageUrl.trim().toLowerCase()).digest('hex');
    const metaPath = path.join(tempDir, `${key}.json`);
    await rm(metaPath);

    const cached = await cache.get(imageUrl);
    expect(cached).toBeNull();
  });

  test('returns null when cache entry is expired', async () => {
    const buffer = Buffer.from('image-data');
    await cache.set(imageUrl, buffer, 'image/jpeg');

    const key = createHash('md5').update(imageUrl.trim().toLowerCase()).digest('hex');
    const metaPath = path.join(tempDir, `${key}.json`);
    const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
    meta.cachedAt = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    await writeFile(metaPath, JSON.stringify(meta), 'utf-8');

    const cached = await cache.get(imageUrl);
    expect(cached).toBeNull();
  });
});
