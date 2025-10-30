/**
 * Server configuration
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type BunGlobal = typeof globalThis & {
  Bun?: {
    cwd?: () => string;
  };
};

const bunGlobal = globalThis as BunGlobal;

const ensureWorkingDirectory = (): string => {
  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    return process.cwd();
  }

  const bunCwd = bunGlobal.Bun?.cwd;
  if (typeof bunCwd === 'function') {
    const cwd = bunCwd();
    if (typeof process !== 'undefined') {
      (process as NodeJS.Process & { cwd?: () => string }).cwd = () => cwd;
    }
    return cwd;
  }

  const fallbackCwd = __dirname;
  if (typeof process !== 'undefined') {
    (process as NodeJS.Process & { cwd?: () => string }).cwd = () => fallbackCwd;
  }
  return fallbackCwd;
};

const workingDir = ensureWorkingDirectory();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),

  // YTMDesktop configuration
  ytmDesktop: {
    host: 'localhost',
    port: 9863,
    get baseUrl() {
      return `http://${this.host}:${this.port}`;
    },
    socketUrl: 'http://127.0.0.1:9863/api/v1/realtime',
    progressBroadcastIntervalMs: parseInt(
      process.env.YTM_PROGRESS_BROADCAST_INTERVAL_MS ?? '100',
      10
    ),
  },

  // App configuration
  app: {
    id: 'ytmremoteserver',
    name: 'YTM Remote Server',
    version: '2.1.3',
  },

  // File paths
  paths: {
    authTokenFile: path.join(workingDir, 'authToken.txt'),
    publicDir: path.join(workingDir, 'public'),
  },

  // CORS configuration
  cors: {
    origin: '*',
    methods: ['GET', 'POST'] as string[],
  },
};
