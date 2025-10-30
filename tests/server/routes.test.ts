import { describe, it, expect, beforeEach, mock } from 'bun:test';
import express from 'express';
import request from 'supertest';
import { setupRoutes } from '../../src/server/routes.js';
import { PlaylistCache } from '../../src/server/cache/playlistCache.js';
import type { PlayerState, Playlist } from '../../src/shared/types/index.js';
import type { LyricsResult } from '../../src/server/lyrics/lyricsFetcher.js';

interface TestContext {
  app: express.Express;
  authManager: {
    isAuthenticated: ReturnType<typeof mock>;
    clearToken: ReturnType<typeof mock>;
    deleteToken: ReturnType<typeof mock>;
  };
  ytmClient: {
    getPlayerState: ReturnType<typeof mock>;
    getPlaylists: ReturnType<typeof mock>;
    sendCommand: ReturnType<typeof mock>;
  };
  socketManager: {
    getCurrentState: ReturnType<typeof mock>;
    disconnectFromYTMDesktop: ReturnType<typeof mock>;
  };
  initializeAuth: ReturnType<typeof mock>;
  lyricsFetcher: {
    fetch: ReturnType<typeof mock>;
  };
}

function createTestApp(overrides: Partial<TestContext> = {}): TestContext {
  const authManager = overrides.authManager ?? {
    isAuthenticated: mock(() => true),
    clearToken: mock(() => {}),
    deleteToken: mock(async () => {}),
  };

  const ytmClient = overrides.ytmClient ?? {
    getPlayerState: mock(async () => null),
    getPlaylists: mock(async () => [] as Playlist[]),
    sendCommand: mock(async () => true),
  };

  const socketManager = overrides.socketManager ?? {
    getCurrentState: mock(() => null as PlayerState | null),
    disconnectFromYTMDesktop: mock(() => {}),
  };

  const initializeAuth = overrides.initializeAuth ?? mock(async () => {});

  const lyricsFetcher = overrides.lyricsFetcher ?? {
    fetch: mock(async () => ({
      lyrics: 'hello world',
      hasSynced: false,
      source: 'test',
    } as LyricsResult)),
  };

  const app = express();
  app.use(express.json());

  setupRoutes(
    app,
    ytmClient as any,
    authManager as any,
    {
      ...socketManager,
      connectToYTMDesktop: mock(() => {}),
    } as any,
    initializeAuth as any,
    lyricsFetcher as any
  );

  return {
    app,
    authManager,
    ytmClient,
    socketManager,
    initializeAuth,
    lyricsFetcher,
  };
}

beforeEach(() => {
  PlaylistCache.getInstance().clear();
});

describe('server routes', () => {
  it('returns status based on authentication and socket state', async () => {
    const socketState: PlayerState = {
      player: {
        trackState: 1,
        videoProgress: 0,
        volume: 0,
        muted: false,
        adPlaying: false,
        likeStatus: 'INDIFFERENT',
      },
      video: {
        author: 'Artist',
        channelId: 'channel',
        title: 'Song',
        album: null,
        albumId: null,
        likeCount: null,
        dislikeCount: null,
        isLive: false,
        id: 'id',
        thumbnails: [],
        durationSeconds: 1,
      },
    };

    const ctx = createTestApp({
      socketManager: {
        getCurrentState: mock(() => socketState),
        disconnectFromYTMDesktop: mock(() => {}),
      },
    });

    const res = await request(ctx.app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: true, hasState: true });
  });

  it('returns 401 for /api/state when not authenticated', async () => {
    const ctx = createTestApp({
      authManager: {
        isAuthenticated: mock(() => false),
        clearToken: mock(() => {}),
        deleteToken: mock(async () => {}),
      },
    });

    const res = await request(ctx.app).get('/api/state');
    expect(res.status).toBe(401);
  });

  it('returns state payload when authenticated', async () => {
    const state: PlayerState = {
      player: {
        trackState: 1,
        videoProgress: 0,
        volume: 0,
        muted: false,
        adPlaying: false,
        likeStatus: 'INDIFFERENT',
      },
      video: {
        author: 'Artist',
        channelId: 'channel',
        title: 'Song',
        album: null,
        albumId: null,
        likeCount: null,
        dislikeCount: null,
        isLive: false,
        id: 'id',
        thumbnails: [],
        durationSeconds: 1,
      },
    };

    const ctx = createTestApp({
      ytmClient: {
        getPlayerState: mock(async () => state),
        getPlaylists: mock(async () => []),
        sendCommand: mock(async () => true),
      },
    });

    const res = await request(ctx.app).get('/api/state');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(state);
  });

  it('returns empty playlists response when unauthenticated', async () => {
    const ctx = createTestApp({
      authManager: {
        isAuthenticated: mock(() => false),
        clearToken: mock(() => {}),
        deleteToken: mock(async () => {}),
      },
    });

    const res = await request(ctx.app).get('/api/playlists');
    expect(res.status).toBe(401);
  });

  it('returns playlists and caches them on success', async () => {
    const playlists: Playlist[] = [
      { id: '1', title: 'Hits', thumbnails: [], author: 'me', videoCount: 2 },
    ];

    const ctx = createTestApp({
      ytmClient: {
        getPlayerState: mock(async () => null),
        getPlaylists: mock(async () => playlists),
        sendCommand: mock(async () => true),
      },
    });

    const res = await request(ctx.app).get('/api/playlists');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(playlists);
    expect(PlaylistCache.getInstance().get()).toEqual(playlists);
  });

  it('returns cached playlists when API fails', async () => {
    const playlists: Playlist[] = [
      { id: '1', title: 'Hits', thumbnails: [], author: 'me', videoCount: 2 },
    ];
    PlaylistCache.getInstance().set(playlists);

    const ctx = createTestApp({
      ytmClient: {
        getPlayerState: mock(async () => null),
        getPlaylists: mock(async () => null),
        sendCommand: mock(async () => true),
      },
    });

    const res = await request(ctx.app).get('/api/playlists');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(playlists);
  });

  it('returns 500 when playlists fail and no cache', async () => {
    const ctx = createTestApp({
      ytmClient: {
        getPlayerState: mock(async () => null),
        getPlaylists: mock(async () => null),
        sendCommand: mock(async () => true),
      },
    });

    const res = await request(ctx.app).get('/api/playlists');
    expect(res.status).toBe(500);
  });

  it('passes command body to YTMClient', async () => {
    const commandMock = mock(async () => true);
    const ctx = createTestApp({
      ytmClient: {
        getPlayerState: mock(async () => null),
        getPlaylists: mock(async () => []),
        sendCommand: commandMock,
      },
    });

    const res = await request(ctx.app)
      .post('/api/command')
      .send({ command: 'play', data: { foo: 'bar' } });

    expect(res.status).toBe(200);
    expect(commandMock.mock.calls[0]).toEqual(['play', { foo: 'bar' }]);
  });

  it('propagates command failure state', async () => {
    const ctx = createTestApp({
      ytmClient: {
        getPlayerState: mock(async () => null),
        getPlaylists: mock(async () => []),
        sendCommand: mock(async () => false),
      },
    });

    const res = await request(ctx.app).post('/api/command').send({ command: 'pause' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: false });
  });

  it('handles reauthentication flow', async () => {
    const clearToken = mock(() => {});
    const deleteToken = mock(async () => {});
    const disconnect = mock(() => {});
    const initializeAuth = mock(async () => {});

    const ctx = createTestApp({
      authManager: {
        isAuthenticated: mock(() => true),
        clearToken,
        deleteToken,
      },
      socketManager: {
        getCurrentState: mock(() => null),
        disconnectFromYTMDesktop: disconnect,
      },
      initializeAuth,
    });

    const res = await request(ctx.app).post('/api/reauth').send({});
    expect(res.status).toBe(200);
    expect(clearToken.mock.calls.length).toBe(1);
    expect(deleteToken.mock.calls.length).toBe(1);
    expect(disconnect.mock.calls.length).toBe(1);
    expect(initializeAuth.mock.calls.length).toBe(1);
  });

  it('reports reauthentication failure when auth manager stays unauthenticated', async () => {
    const ctx = createTestApp({
      authManager: {
        isAuthenticated: mock(() => false),
        clearToken: mock(() => {}),
        deleteToken: mock(async () => {}),
      },
      initializeAuth: mock(async () => {}),
    });

    const res = await request(ctx.app).post('/api/reauth').send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: false });
  });

  it('validates lyrics parameters', async () => {
    const ctx = createTestApp();
    const res = await request(ctx.app).get('/api/lyrics');
    expect(res.status).toBe(400);
  });

  it('returns 404 when lyrics not found', async () => {
    const ctx = createTestApp({
      lyricsFetcher: {
        fetch: mock(async () => null),
      },
    });

    const res = await request(ctx.app).get('/api/lyrics?artist=A&title=B');
    expect(res.status).toBe(404);
  });

  it('returns 500 when lyrics fetch fails', async () => {
    const ctx = createTestApp({
      lyricsFetcher: {
        fetch: mock(async () => {
          throw new Error('boom');
        }),
      },
    });

    const res = await request(ctx.app).get('/api/lyrics?artist=A&title=B');
    expect(res.status).toBe(500);
  });

  it('returns lyrics payload on success', async () => {
    const ctx = createTestApp({
      lyricsFetcher: {
        fetch: mock(async () => ({
          lyrics: 'line1',
          hasSynced: false,
          source: 'mock',
        })),
      },
    });

    const res = await request(ctx.app).get('/api/lyrics?artist=A&title=B');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ lyrics: 'line1', hasSynced: false, source: 'mock' });
  });
});
