import { beforeAll, afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'fs';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

import { AuthManager } from '../src/server/auth/authManager.js';
import { config } from '../src/server/config.js';

const originalAuthTokenPath = config.paths.authTokenFile;
let tempDir: string;
let authManager: AuthManager;

beforeAll(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'auth-manager-test-'));
  config.paths.authTokenFile = path.join(tempDir, 'authToken.txt');
});

afterAll(async () => {
  config.paths.authTokenFile = originalAuthTokenPath;
  await rm(tempDir, { recursive: true, force: true });
});

beforeEach(async () => {
  authManager = new AuthManager();
  await authManager.deleteToken();
});

describe('AuthManager', () => {
  test('returns null when no token is stored', async () => {
    const loaded = await authManager.loadToken();
    expect(loaded).toBeNull();
    expect(authManager.getToken()).toBeNull();
    expect(authManager.isAuthenticated()).toBe(false);
  });

  test('saves token to disk and updates memory', async () => {
    const result = await authManager.saveToken('secret-token');
    expect(result).toBe(true);
    expect(authManager.getToken()).toBe('secret-token');
    expect(authManager.isAuthenticated()).toBe(true);

    const saved = await readFile(config.paths.authTokenFile, 'utf-8');
    expect(saved).toBe('secret-token');
  });

  test('loads token from disk', async () => {
    await writeFile(config.paths.authTokenFile, 'stored-token', 'utf-8');

    const loaded = await authManager.loadToken();
    expect(loaded).toBe('stored-token');
    expect(authManager.getToken()).toBe('stored-token');
    expect(authManager.isAuthenticated()).toBe(true);
  });

  test('deletes token file and clears memory', async () => {
    await authManager.saveToken('to-delete');
    expect(existsSync(config.paths.authTokenFile)).toBe(true);

    await authManager.deleteToken();
    expect(authManager.getToken()).toBeNull();
    expect(authManager.isAuthenticated()).toBe(false);
    expect(existsSync(config.paths.authTokenFile)).toBe(false);
  });
});
