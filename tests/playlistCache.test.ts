import { describe, expect, test, beforeEach } from 'bun:test';

import { PlaylistCache } from '../src/server/cache/playlistCache.js';

const samplePlaylists = [
  { id: '1', title: 'Playlist One', thumbnails: [], author: 'Tester', videoCount: 10 },
  { id: '2', title: 'Playlist Two', thumbnails: [], author: 'Tester', videoCount: 5 },
];

describe('PlaylistCache', () => {
  let cache: PlaylistCache;

  beforeEach(() => {
    cache = PlaylistCache.getInstance();
    cache.clear();
  });

  test('returns null when cache is empty', () => {
    expect(cache.get()).toBeNull();
    expect(cache.has()).toBe(false);
    expect(cache.getAgeMinutes()).toBe(-1);
  });

  test('stores playlists and reports cache age', () => {
    cache.set(samplePlaylists);

    const cached = cache.get();
    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(2);
    expect(cache.has()).toBe(true);
    expect(cache.getAgeMinutes()).toBeGreaterThanOrEqual(0);
  });

  test('clears cache data', () => {
    cache.set(samplePlaylists);
    cache.clear();

    expect(cache.get()).toBeNull();
    expect(cache.has()).toBe(false);
    expect(cache.getAgeMinutes()).toBe(-1);
  });
});
