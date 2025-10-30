import { describe, it, expect, beforeEach, afterEach, mock, type Mock } from 'bun:test';
import { YTMClient } from '../../src/server/api/ytmClient.js';
import type { AuthManager } from '../../src/server/auth/authManager.js';
import type { PlayerState, Playlist } from '../../src/shared/types/index.js';

const originalFetch = globalThis.fetch;

const fetchMock = mock<(url: string, init?: RequestInit) => Promise<any>>();

type AuthManagerMethods = Pick<
  AuthManager,
  'getToken' | 'clearToken' | 'deleteToken' | 'saveToken' | 'loadToken' | 'setToken' | 'isAuthenticated'
>;

type MockedAuthManager = {
  [K in keyof AuthManagerMethods]: AuthManagerMethods[K];
} & {
  getToken: Mock<() => string | null>;
  clearToken: Mock<() => void>;
  deleteToken: Mock<() => Promise<void>>;
  saveToken: Mock<(token: string) => Promise<boolean>>;
  loadToken: Mock<() => Promise<string | null>>;
  setToken: Mock<(token: string | null) => void>;
  isAuthenticated: Mock<() => boolean>;
};

function createAuthManager(initialToken: string | null = 'token'): MockedAuthManager {
  let token = initialToken;

  const manager = {
    getToken: mock(() => token),
    clearToken: mock(() => {
      token = null;
    }),
    deleteToken: mock(async () => {
      token = null;
    }),
    saveToken: mock(async (value: string) => {
      token = value;
      return true;
    }),
    loadToken: mock(async () => token),
    setToken: mock((value: string | null) => {
      token = value;
    }),
    isAuthenticated: mock(() => token !== null),
  } as MockedAuthManager;

  return manager;
}

beforeEach(() => {
  fetchMock.mockReset();
  // @ts-expect-error assign test double
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('YTMClient', () => {
  it('returns app info when fetch succeeds', async () => {
    fetchMock.mockImplementation(async () => ({
      json: async () => ({ name: 'YTMDesktop', version: '1.0.0' }),
    }));

    const authManager = createAuthManager();
    const client = new YTMClient(authManager);

    await expect(client.getAppInfo()).resolves.toEqual({ name: 'YTMDesktop', version: '1.0.0' });
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('returns null when app info fetch fails', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('network error');
    });

    const client = new YTMClient(createAuthManager());
    await expect(client.getAppInfo()).resolves.toBeNull();
  });

  it('returns auth code when request succeeds', async () => {
    fetchMock.mockImplementation(async () => ({
      json: async () => ({ code: 'abc123' }),
    }));

    const client = new YTMClient(createAuthManager());
    await expect(client.requestAuthCode()).resolves.toBe('abc123');
  });

  it('returns null when auth code request fails', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('fail');
    });

    const client = new YTMClient(createAuthManager());
    await expect(client.requestAuthCode()).resolves.toBeNull();
  });

  it('returns token when auth token request succeeds', async () => {
    fetchMock.mockImplementation(async () => ({
      json: async () => ({ token: 'new-token' }),
    }));

    const client = new YTMClient(createAuthManager());
    await expect(client.requestAuthToken('code')).resolves.toBe('new-token');
  });

  it('returns null when auth token request fails', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('fail');
    });

    const client = new YTMClient(createAuthManager());
    await expect(client.requestAuthToken('code')).resolves.toBeNull();
  });

  it('returns null for player state when token missing', async () => {
    const authManager = createAuthManager(null);
    const client = new YTMClient(authManager);

    await expect(client.getPlayerState()).resolves.toBeNull();
    expect(fetchMock.mock.calls.length).toBe(0);
  });

  it('returns player state when fetch succeeds', async () => {
    const state: PlayerState = {
      player: {
        trackState: 1,
        videoProgress: 10,
        volume: 50,
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
        id: 'song123',
        thumbnails: [],
        durationSeconds: 120,
      },
    };

    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => state,
    }));

    const client = new YTMClient(createAuthManager('token'));
    await expect(client.getPlayerState()).resolves.toEqual(state);
  });

  it('clears token when player state returns 401', async () => {
    const authManager = createAuthManager('token');

    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));

    const client = new YTMClient(authManager);
    await expect(client.getPlayerState()).resolves.toBeNull();
    expect(authManager.clearToken.mock.calls.length).toBe(1);
    expect(authManager.deleteToken.mock.calls.length).toBe(1);
  });

  it('returns false when sending command without token', async () => {
    const client = new YTMClient(createAuthManager(null));
    await expect(client.sendCommand('play')).resolves.toBe(false);
    expect(fetchMock.mock.calls.length).toBe(0);
  });

  it('sends command payload and returns success status', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    }));

    const authManager = createAuthManager('token');
    const client = new YTMClient(authManager);

    await expect(client.sendCommand('play', { foo: 'bar' })).resolves.toBe(true);

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ command: 'play', data: { foo: 'bar' } })
    );
  });

  it('clears token when sendCommand returns 401', async () => {
    const authManager = createAuthManager('token');

    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 401,
    }));

    const client = new YTMClient(authManager);
    await expect(client.sendCommand('pause')).resolves.toBe(false);
    expect(authManager.clearToken.mock.calls.length).toBe(1);
    expect(authManager.deleteToken.mock.calls.length).toBe(1);
  });

  it('returns playlists when fetch succeeds', async () => {
    const playlists: Playlist[] = [
      { id: '1', title: 'Playlist', thumbnails: [], author: 'me', videoCount: 1 },
    ];

    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => playlists,
      statusText: 'OK',
    }));

    const client = new YTMClient(createAuthManager('token'));
    await expect(client.getPlaylists()).resolves.toEqual(playlists);
  });

  it('returns null and clears token when playlists fetch returns 401', async () => {
    const authManager = createAuthManager('token');

    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    }));

    const client = new YTMClient(authManager);
    await expect(client.getPlaylists()).resolves.toBeNull();
    expect(authManager.clearToken.mock.calls.length).toBe(1);
    expect(authManager.deleteToken.mock.calls.length).toBe(1);
  });

  it('performs full authentication flow', async () => {
    const authManager = createAuthManager(null);

    let call = 0;
    fetchMock.mockImplementation(async () => {
      call += 1;
      if (call === 1) {
        return { json: async () => ({ name: 'YTMDesktop', version: '1.0.0' }) };
      }
      if (call === 2) {
        return { json: async () => ({ code: 'abc123' }) };
      }
      return { json: async () => ({ token: 'new-token' }) };
    });

    const client = new YTMClient(authManager);
    await expect(client.authenticate()).resolves.toBe(true);
    expect(authManager.saveToken.mock.calls.length).toBe(1);
  });

  it('fails authentication when app info missing', async () => {
    fetchMock.mockImplementation(async () => ({
      json: async () => {
        throw new Error('bad json');
      },
    }));

    const client = new YTMClient(createAuthManager());
    await expect(client.authenticate()).resolves.toBe(false);
  });
});
