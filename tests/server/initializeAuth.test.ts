import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { createInitializeAuth } from '../../src/server/auth/initializeAuth.js';
import type { PlayerState } from '../../src/shared/types/index.js';

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
    id: 'song',
    thumbnails: [],
    durationSeconds: 1,
  },
};

let logSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  logSpy = spyOn(console, 'log');
  logSpy.mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('initializeAuth', () => {
  it('connects immediately when saved token is valid', async () => {
    const authManager = {
      loadToken: mock(async () => 'token'),
      clearToken: mock(() => {}),
    };
    const ytmClient = {
      getPlayerState: mock(async () => state),
      authenticate: mock(async () => true),
    };
    const socketManager = {
      connectToYTMDesktop: mock(() => {}),
    };

    const initializeAuth = createInitializeAuth({ authManager: authManager as any, ytmClient: ytmClient as any, socketManager: socketManager as any });
    await initializeAuth();

    expect(ytmClient.getPlayerState.mock.calls.length).toBe(1);
    expect(ytmClient.authenticate.mock.calls.length).toBe(0);
    expect(socketManager.connectToYTMDesktop.mock.calls.length).toBe(1);

    const messages = logSpy.mock.calls.map((call) => call[0]);
    expect(messages).toContain('Attempting to use saved auth token...');
    expect(messages).toContain('✓ Saved auth token is valid!');
  });

  it('clears token and reauthenticates when saved token invalid', async () => {
    const authManager = {
      loadToken: mock(async () => 'token'),
      clearToken: mock(() => {}),
    };
    const ytmClient = {
      getPlayerState: mock(async () => null),
      authenticate: mock(async () => true),
    };
    const socketManager = {
      connectToYTMDesktop: mock(() => {}),
    };

    const initializeAuth = createInitializeAuth({ authManager: authManager as any, ytmClient: ytmClient as any, socketManager: socketManager as any });
    await initializeAuth();

    expect(authManager.clearToken.mock.calls.length).toBe(1);
    expect(ytmClient.authenticate.mock.calls.length).toBe(1);
    expect(socketManager.connectToYTMDesktop.mock.calls.length).toBe(1);

    const messages = logSpy.mock.calls.map((call) => call[0]);
    expect(messages).toContain('⚠️  Saved auth token is invalid or expired');
  });

  it('logs banner and handles authentication failure gracefully', async () => {
    const authManager = {
      loadToken: mock(async () => null),
      clearToken: mock(() => {}),
    };
    const ytmClient = {
      getPlayerState: mock(async () => null),
      authenticate: mock(async () => false),
    };
    const socketManager = {
      connectToYTMDesktop: mock(() => {}),
    };

    const initializeAuth = createInitializeAuth({ authManager: authManager as any, ytmClient: ytmClient as any, socketManager: socketManager as any });
    await initializeAuth();

    expect(socketManager.connectToYTMDesktop.mock.calls.length).toBe(0);

    const messages = logSpy.mock.calls.map((call) => call[0]);
    expect(messages[0]).toBe('==================================================');
    expect(messages[1]).toBe('🎵 YTM Remote Server starting...');
    expect(messages.at(-1)).toBe('==================================================');
  });
});
