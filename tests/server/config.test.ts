import { describe, it, expect, afterEach, mock } from 'bun:test';
import { createServer } from 'http';

const trackedEnvKeys = [
  'PORT',
  'YTM_PROGRESS_BROADCAST_INTERVAL_MS',
];

const originalEnv: Record<string, string | undefined> = {};
for (const key of trackedEnvKeys) {
  originalEnv[key] = process.env[key];
}

afterEach(() => {
  for (const key of trackedEnvKeys) {
    const original = originalEnv[key];
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

async function loadConfigWithFreshEnv(): Promise<{ config: any; query: string }> {
  const query = `?test=${Date.now()}-${Math.random()}`;
  const module = await import(`../../src/server/config.ts${query}`);
  return { config: module.config, query };
}

describe('config', () => {
  it('falls back to defaults when environment variables missing', async () => {
    delete process.env.PORT;
    delete process.env.YTM_PROGRESS_BROADCAST_INTERVAL_MS;

    const { config } = await loadConfigWithFreshEnv();
    expect(config.port).toBe(3000);
    expect(config.ytmDesktop.progressBroadcastIntervalMs).toBe(100);
    expect(config.paths.authTokenFile).toContain(process.cwd());
  });

  it('parses configured port and progress interval from environment', async () => {
    process.env.PORT = '4567';
    process.env.YTM_PROGRESS_BROADCAST_INTERVAL_MS = '750';

    const { config } = await loadConfigWithFreshEnv();
    expect(config.port).toBe(4567);
    expect(config.ytmDesktop.progressBroadcastIntervalMs).toBe(750);
  });

  it('propagates progress interval into socket manager instances', async () => {
    process.env.YTM_PROGRESS_BROADCAST_INTERVAL_MS = '333';
    const { config, query } = await loadConfigWithFreshEnv();
    const liveConfigModule = await import('../../src/server/config.ts');
    const previousInterval = liveConfigModule.config.ytmDesktop.progressBroadcastIntervalMs;
    liveConfigModule.config.ytmDesktop.progressBroadcastIntervalMs =
      config.ytmDesktop.progressBroadcastIntervalMs;

    try {
      const { SocketManager } = await import(`../../src/server/socket/socketManager.ts${query}`);

      const httpServer = createServer();
      const authManager = {
        getToken: () => null,
        clearToken: () => {},
        deleteToken: async () => {},
      };
      const lyricsFetcher = {
        prefetch: () => {},
        fetch: async () => null,
      };

      const manager = new SocketManager(httpServer as any, authManager as any, lyricsFetcher as any);

      expect((manager as any).progressBroadcastIntervalMs).toBe(
        config.ytmDesktop.progressBroadcastIntervalMs
      );

      manager.getIO().close();
      httpServer.close();
    } finally {
      liveConfigModule.config.ytmDesktop.progressBroadcastIntervalMs = previousInterval;
    }
  });
});
const socketIOModulePath = new URL('../../src/server/socket/socketIO.ts', import.meta.url).href;

class MockSocketIOServer {
  constructor(public readonly httpServer: unknown, public readonly options: unknown) {}

  on(): this {
    return this;
  }

  close(): void {}
}

class MockClientSocket {
  public connected = false;

  on(): this {
    return this;
  }

  close(): void {
    this.connected = false;
  }
}

mock.module(socketIOModulePath, () => ({
  SocketIOServer: MockSocketIOServer,
  SocketIOClient: () => new MockClientSocket(),
  ClientSocket: MockClientSocket,
}));

