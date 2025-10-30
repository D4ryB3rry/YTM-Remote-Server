import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { mkdtemp, rm } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

import { LyricsFetcher } from '../src/server/lyrics/lyricsFetcher.js';
import { LyricsCache } from '../src/server/lyrics/lyricsCache.js';

function createResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

let tempDir: string;
let cache: LyricsCache;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'lyrics-fetcher-test-'));
  cache = new LyricsCache(tempDir, 24);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('LyricsFetcher', () => {
  test('fetches lyrics and parses synced lines', async () => {
    const fetchMock = mock(async () =>
      createResponse({
        plainLyrics: 'Plain lyrics',
        syncedLyrics: '[00:01.00]Line 1\n[00:02.50]Line 2',
      })
    );
    const fetcher = new LyricsFetcher({ cache, fetchFn: fetchMock });

    const result = await fetcher.fetch('Artist', 'Song');

    expect(result).not.toBeNull();
    expect(result?.lyrics).toBe('Plain lyrics');
    expect(result?.hasSynced).toBe(true);
    expect(result?.source).toBe('lrclib.net');
    expect(result?.synced).toEqual([
      { time: 1, text: 'Line 1' },
      { time: 2.5, text: 'Line 2' },
    ]);

    const cached = cache.get('Artist', 'Song');
    expect(cached).not.toBeNull();
    expect(cached?.source).toBe('lrclib.net');
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  test('returns cached result without calling fetch again', async () => {
    const fetchMock = mock(async () =>
      createResponse({
        plainLyrics: 'Plain lyrics',
      })
    );
    const fetcher = new LyricsFetcher({ cache, fetchFn: fetchMock });

    const first = await fetcher.fetch('Artist', 'Song');
    expect(first).not.toBeNull();
    expect(fetchMock.mock.calls.length).toBe(1);

    const second = await fetcher.fetch('Artist', 'Song');
    expect(second?.source).toContain('(cached)');
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  test('avoids repeated fetches after not found response', async () => {
    const fetchMock = mock(async () =>
      createResponse({}, true, 200)
    );
    const fetcher = new LyricsFetcher({ cache, fetchFn: fetchMock, notFoundTtlMs: 60_000 });

    const first = await fetcher.fetch('Artist', 'Missing Song');
    expect(first).toBeNull();
    expect(fetchMock.mock.calls.length).toBe(1);

    const second = await fetcher.fetch('Artist', 'Missing Song');
    expect(second).toBeNull();
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  test('reuses in-flight fetch for duplicate requests', async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = mock(() => fetchPromise);
    const fetcher = new LyricsFetcher({ cache, fetchFn: fetchMock });

    const firstPromise = fetcher.fetch('Artist', 'Song');
    const secondPromise = fetcher.fetch('Artist', 'Song');

    resolveFetch?.(
      createResponse({
        plainLyrics: 'Delayed lyrics',
      })
    );

    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(first).toEqual(second);
  });
});
