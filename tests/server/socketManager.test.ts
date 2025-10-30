import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, test, mock, jest } from 'bun:test';
import type { PlayerState } from '../../src/shared/types/index.js';

type Spy<Args extends unknown[] = unknown[], Return = unknown> = ((
  ...args: Args
) => Return) & {
  calls: Args[];
  results: Return[];
  clear: () => void;
};

const createSpy = <Args extends unknown[] = unknown[], Return = unknown>(
  implementation?: (...args: Args) => Return
): Spy<Args, Return> => {
  const spy = ((...args: Args) => {
    const result = implementation ? implementation(...args) : (undefined as Return);
    spy.calls.push(args);
    spy.results.push(result);
    return result;
  }) as Spy<Args, Return>;

  spy.calls = [];
  spy.results = [];
  spy.clear = () => {
    spy.calls.length = 0;
    spy.results.length = 0;
  };

  return spy;
};

class MockSocketIOServer {
  public readonly emit = createSpy<(event: string, payload: unknown) => void>();
  private readonly handlers = new Map<string, (...args: unknown[]) => void>();

  constructor(public readonly httpServer: unknown, public readonly options: unknown) {
    serverInstances.push(this);
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    this.handlers.set(event, handler);
    return this;
  }

  trigger(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.(...args);
  }

  close(): void {}
}

class MockClientSocket {
  public readonly handlers = new Map<string, (...args: unknown[]) => void>();
  public readonly close = createSpy<() => void>(() => {
    this.connected = false;
  });
  public connected = false;

  constructor(public readonly url: string, public readonly options: unknown) {
    clientSockets.push(this);
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    this.handlers.set(event, handler);
    return this;
  }

  trigger(event: string, ...args: unknown[]): void {
    const handler = this.handlers.get(event);
    if (!handler) {
      return;
    }

    if (event === 'connect') {
      this.connected = true;
    }

    if (event === 'disconnect') {
      this.connected = false;
    }

    handler(...args);
  }
}

class MockAuthManager {
  constructor(private token: string | null = 'token') {}

  readonly getToken = createSpy<() => string | null>(() => this.token);
  readonly clearToken = createSpy<() => void>(() => {
    this.token = null;
  });
  readonly deleteToken = createSpy<() => void>();
}

class MockLyricsFetcher {
  readonly prefetch = createSpy<(artist: string, title: string) => void>();
}

const serverInstances: MockSocketIOServer[] = [];
const clientSockets: MockClientSocket[] = [];

const authManagerModulePath = new URL('../../src/server/auth/authManager.ts', import.meta.url).href;
mock.module(authManagerModulePath, () => ({
  AuthManager: MockAuthManager,
}));

const lyricsFetcherModulePath = new URL('../../src/server/lyrics/lyricsFetcher.ts', import.meta.url).href;
mock.module(lyricsFetcherModulePath, () => ({
  LyricsFetcher: MockLyricsFetcher,
}));

const actualConfigModule = await import('../../src/server/config.ts');
const originalSocketUrl = actualConfigModule.config.ytmDesktop.socketUrl;
actualConfigModule.config.ytmDesktop.socketUrl = 'http://mock-ytm';

const configModulePath = new URL('../../src/server/config.js', import.meta.url).href;
mock.module(configModulePath, () => ({
  config: actualConfigModule.config,
}));

const socketIOModulePath = new URL('../../src/server/socket/socketIO.ts', import.meta.url).href;
const ioMock = createSpy<(url: string, options: unknown) => MockClientSocket>((url, options) =>
  new MockClientSocket(url, options)
);
mock.module(socketIOModulePath, () => ({
  SocketIOServer: class extends MockSocketIOServer {
    constructor(httpServer: unknown, options: unknown) {
      super(httpServer, options);
    }
  },
  SocketIOClient: ioMock,
  ClientSocket: MockClientSocket,
}));

let SocketManager: any;

beforeAll(async () => {
  ({ SocketManager } = await import('../../src/server/socket/socketManager.ts'));
});

beforeEach(() => {
  serverInstances.length = 0;
  clientSockets.length = 0;
  ioMock.clear();
  jest.useFakeTimers();
  jest.setSystemTime(0);
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  actualConfigModule.config.ytmDesktop.socketUrl = originalSocketUrl;
});

const getLatestServer = (): MockSocketIOServer => {
  const server = serverInstances.at(-1);
  if (!server) {
    throw new Error('No Socket.IO server instance created');
  }
  return server;
};

const getLatestClientSocket = (): MockClientSocket => {
  const socket = clientSockets.at(-1);
  if (!socket) {
    throw new Error('No Socket.IO client instance created');
  }
  return socket;
};

const lastCall = <T extends unknown[]>(spy: Spy<T, unknown>): T | undefined => spy.calls.at(-1);

const advanceTime = (ms: number): void => {
  const current = Date.now();
  jest.setSystemTime(current + ms);
};

const flushImmediate = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const createState = (overrides?: Partial<PlayerState>): PlayerState => {
  const state: PlayerState = {
    player: {
      trackState: 1,
      videoProgress: 12,
      volume: 50,
      muted: false,
      adPlaying: false,
      likeStatus: 'INDIFFERENT',
      queue: {
        items: [
          { videoId: 'video-1' },
          { videoId: 'video-2' },
        ],
        selectedItemIndex: 0,
        repeatMode: 0,
      },
      queueAutoplay: false,
      queueAutoplayMode: 'OFF',
    },
    video: {
      author: 'Test Artist',
      channelId: 'channel-1',
      title: 'Track One',
      album: null,
      albumId: null,
      likeCount: null,
      dislikeCount: null,
      likeStatus: 'INDIFFERENT',
      isLive: false,
      id: 'video-1',
      thumbnails: [],
      durationSeconds: 200,
      videoType: 0,
    },
  };

  if (overrides?.player) {
    state.player = {
      ...state.player,
      ...overrides.player,
      queue:
        overrides.player.queue === undefined
          ? state.player.queue && {
              ...state.player.queue,
              items: state.player.queue.items?.map((item) => ({ ...item })) ?? [],
            }
          : overrides.player.queue
          ? {
              ...overrides.player.queue,
              items:
                overrides.player.queue.items?.map((item) => ({ ...item })) ??
                state.player.queue?.items?.map((item) => ({ ...item })) ??
                [],
            }
          : undefined,
    };
  }

  if (overrides?.video) {
    state.video = {
      ...state.video,
      ...overrides.video,
    };
  }

  return state;
};

const setupManager = (options?: {
  authManager?: MockAuthManager;
  lyricsFetcher?: MockLyricsFetcher;
}) => {
  const authManager = options?.authManager ?? new MockAuthManager('valid-token');
  const lyricsFetcher = options?.lyricsFetcher ?? new MockLyricsFetcher();
  const manager = new SocketManager({} as any, authManager as any, lyricsFetcher as any);
  return { manager, authManager, lyricsFetcher, server: getLatestServer() };
};

describe('SocketManager', () => {
  test('emits state-update only on relevant changes or interval expiry', async () => {
    const { manager, server } = setupManager();
    manager.connectToYTMDesktop();
    const client = getLatestClientSocket();

    const initialState = createState();
    client.trigger('state-update', initialState);
    await flushImmediate();
    expect(server.emit.calls.length).toBe(1);
    expect(lastCall(server.emit)).toEqual(['state-update', initialState]);
    expect(manager.getCurrentState()).toEqual(initialState);

    const progressUpdate = createState({
      player: { videoProgress: 15 },
    });
    advanceTime(50);
    client.trigger('state-update', progressUpdate);
    await flushImmediate();
    expect(server.emit.calls.length).toBe(1);

    const intervalElapsed = createState({
      player: { videoProgress: 25 },
    });
    advanceTime(50);
    client.trigger('state-update', intervalElapsed);
    await flushImmediate();
    expect(server.emit.calls.length).toBe(2);

    const trackStateChange = createState({
      player: { trackState: 0 },
    });
    client.trigger('state-update', trackStateChange);
    await flushImmediate();
    expect(server.emit.calls.length).toBe(3);
    expect(lastCall(server.emit)).toEqual(['state-update', trackStateChange]);
  });

  test('prefetches lyrics only when the track changes', async () => {
    const lyricsFetcher = new MockLyricsFetcher();
    const { manager } = setupManager({ lyricsFetcher });
    manager.connectToYTMDesktop();
    const client = getLatestClientSocket();

    const firstState = createState();
    client.trigger('state-update', firstState);
    await flushImmediate();
    expect(lyricsFetcher.prefetch.calls.length).toBe(1);
    expect(lastCall(lyricsFetcher.prefetch)).toEqual(['Test Artist', 'Track One']);

    const sameTrack = createState({
      player: { videoProgress: 30 },
    });
    advanceTime(10);
    client.trigger('state-update', sameTrack);
    await flushImmediate();
    expect(lyricsFetcher.prefetch.calls.length).toBe(1);

    const newTrack = createState({
      video: { id: 'video-2', title: 'Track Two' },
    });
    advanceTime(10);
    client.trigger('state-update', newTrack);
    await flushImmediate();
    expect(lyricsFetcher.prefetch.calls.length).toBe(2);
    expect(lastCall(lyricsFetcher.prefetch)).toEqual(['Test Artist', 'Track Two']);
  });

  test('handles auth errors, disconnects, and exposes connection state', async () => {
    const authManager = new MockAuthManager('secure-token');
    const { manager } = setupManager({ authManager });

    expect(manager.isConnectedToYTM()).toBe(false);

    manager.connectToYTMDesktop();
    const client = getLatestClientSocket();

    client.connected = true;
    expect(manager.isConnectedToYTM()).toBe(true);

    const state = createState();
    client.trigger('state-update', state);
    await flushImmediate();
    expect(manager.getCurrentState()).toEqual(state);

    client.trigger('connect_error', { message: '401 unauthorized' });
    expect(authManager.clearToken.calls.length).toBe(1);
    expect(authManager.deleteToken.calls.length).toBe(1);

    manager.disconnectFromYTMDesktop();
    expect(client.close.calls.length).toBe(1);
    expect(manager.isConnectedToYTM()).toBe(false);
  });
});
