import { beforeEach, describe, expect, it } from 'bun:test';
import { spyOn, restoreAllSpies } from '../utils/testMocks.js';

const originalConsoleLog = console.log;

describe('utility helpers', () => {
  beforeEach(() => {
    console.log = originalConsoleLog;
    delete (globalThis as any).__YTM_REMOTE_DEBUG_LOGS__;
    try {
      delete (globalThis as any).process;
    } catch {
      (globalThis as any).process = undefined;
    }
    try {
      (globalThis as any).Bun = undefined;
    } catch {
      // Ignore if read-only
    }
    restoreAllSpies();
  });

  it('wraps image URLs with proxy endpoint', async () => {
    const { getProxiedImageUrl } = await import('@client/utils/imageProxy.ts');
    expect(getProxiedImageUrl('')).toBe('');
    expect(getProxiedImageUrl('/api/proxy/image?url=abc')).toBe('/api/proxy/image?url=abc');
    expect(getProxiedImageUrl('https://example.com/img.png')).toBe('/api/proxy/image?url=https%3A%2F%2Fexample.com%2Fimg.png');
  });

  it('logs debug output when enabled via global flag', async () => {
    (globalThis as any).__YTM_REMOTE_DEBUG_LOGS__ = true;
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const logger = await import(`@client/utils/logger.ts?test=${Date.now()}`);
    logger.debugLog('debug', 1);
    expect(logSpy.mock.calls[0]).toEqual(['debug', 1]);
    expect(logger.isDebugLoggingEnabled()).toBeTrue();
  });

  it('suppresses debug output in production mode', async () => {
    (globalThis as any).process = { env: { NODE_ENV: 'production' } };
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const logger = await import(`@client/utils/logger.ts?test=${Date.now()}`);
    logger.debugLog('hidden');
    expect(logSpy.mock.calls.length).toBe(0);
    expect(logger.isDebugLoggingEnabled()).toBeFalse();
  });
});
