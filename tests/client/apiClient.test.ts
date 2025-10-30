import { afterEach, describe, expect, it } from 'bun:test';
import { ApiClient } from '@client/api/apiClient.ts';
import type { CommandResponse, LyricsResponse, Playlist, PlayerState } from '@shared/types/index.ts';
import { createMockFn, MockFn } from '../utils/testMocks.js';

const apiClient = new ApiClient();

declare const Response: typeof globalThis.Response;

describe('ApiClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends commands and returns responses', async () => {
    const response: CommandResponse = { success: true };
    globalThis.fetch = createMockFn().mockResolvedValue(new Response(JSON.stringify(response)));

    const result = await apiClient.sendCommand('playPause');
    expect(result).toEqual(response);
    const calls = (globalThis.fetch as unknown as MockFn<typeof fetch>).mock.calls;
    expect(calls[0][0]).toBe('/api/command');
    expect(calls[0][1]).toMatchObject({ method: 'POST' });
  });

  it('returns failure when sendCommand throws', async () => {
    globalThis.fetch = createMockFn().mockRejectedValue(new Error('network error'));

    const result = await apiClient.sendCommand('playPause');
    expect(result).toEqual({ success: false });
  });

  it('returns null when getStatus fails', async () => {
    globalThis.fetch = createMockFn().mockRejectedValue(new Error('boom'));

    const result = await apiClient.getStatus();
    expect(result).toBeNull();
  });

  it('handles getState non-ok responses', async () => {
    const state: PlayerState = {
      player: {
        trackState: 1,
        videoProgress: 1,
        volume: 1,
        muted: false,
        adPlaying: false,
        likeStatus: 'LIKE',
      },
      video: {
        author: 'a',
        channelId: 'c',
        title: 't',
        album: null,
        albumId: null,
        likeCount: null,
        dislikeCount: null,
        isLive: false,
        id: 'id1234567890',
        thumbnails: [],
        durationSeconds: 100,
      },
    } as PlayerState;

    globalThis.fetch = createMockFn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(state)));

    expect(await apiClient.getState()).toBeNull();
    expect(await apiClient.getState()).toEqual(state);
  });

  it('loads playlists and handles rate limits', async () => {
    const playlists: Playlist[] = [
      { id: '1', title: 'Mix', thumbnails: [], author: 'DJ', videoCount: 10 },
    ];

    globalThis.fetch = createMockFn()
      .mockResolvedValueOnce(new Response(JSON.stringify(playlists)))
      .mockResolvedValueOnce(new Response('rate limited', { status: 429, statusText: 'Too Many Requests' }));

    expect(await apiClient.getPlaylists()).toEqual(playlists);
    await expect(apiClient.getPlaylists()).rejects.toMatchObject({ rateLimited: true, status: 429 });
  });

  it('returns null when playlist loading fails for other reasons', async () => {
    globalThis.fetch = createMockFn().mockResolvedValue(new Response('error', { status: 500 }));
    const result = await apiClient.getPlaylists();
    expect(result).toBeNull();
  });

  it('reauth returns boolean', async () => {
    globalThis.fetch = createMockFn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    expect(await apiClient.reauth()).toBeTrue();

    globalThis.fetch = createMockFn().mockRejectedValue(new Error('fail'));
    expect(await apiClient.reauth()).toBeFalse();
  });

  it('fetches lyrics and handles not found', async () => {
    const lyrics: LyricsResponse = {
      lyrics: 'Line',
      hasSynced: false,
      source: 'test',
    };

    globalThis.fetch = createMockFn().mockResolvedValue(new Response(JSON.stringify(lyrics)));
    expect(await apiClient.getLyrics('artist', 'song')).toEqual(lyrics);

    globalThis.fetch = createMockFn().mockResolvedValue(new Response('not found', { status: 404 }));
    expect(await apiClient.getLyrics('artist', 'song')).toBeNull();
  });
});
