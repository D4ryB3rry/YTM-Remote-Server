/**
 * Lightweight client-side logging helper that only emits debug logs when
 * running in a non-production build. This keeps verbose console output out of
 * production bundles while still allowing rich logs during development.
 */

type AnyFunction = (...args: unknown[]) => void;

const resolveDebugFlag = (): boolean => {
  // Allow overriding via a dedicated global for ad-hoc debugging.
  if (typeof globalThis !== 'undefined') {
    const override = (globalThis as Record<string, unknown>).__YTM_REMOTE_DEBUG_LOGS__;
    if (override !== undefined) {
      return Boolean(override);
    }
  }

  // Attempt to read build-time flags (supported by most modern bundlers).
  try {
    const metaEnv = (import.meta as { env?: Record<string, unknown> }).env;
    if (metaEnv) {
      if (typeof metaEnv.YTM_REMOTE_DEBUG_LOGS === 'string') {
        return metaEnv.YTM_REMOTE_DEBUG_LOGS !== 'false';
      }
      if (typeof metaEnv.YTM_REMOTE_DEBUG_LOGS === 'boolean') {
        return metaEnv.YTM_REMOTE_DEBUG_LOGS;
      }
      if (typeof metaEnv.DEV === 'boolean') {
        return metaEnv.DEV;
      }
      if (typeof metaEnv.MODE === 'string') {
        return metaEnv.MODE !== 'production';
      }
    }
  } catch {
    // Ignore environments where import.meta is not supported.
  }

  // Fall back to conventional environment variables when available.
  if (typeof globalThis !== 'undefined') {
    const globalRecord = globalThis as Record<string, unknown>;
    const processEnv = (globalRecord.process as { env?: Record<string, string | undefined> } | undefined)?.env;
    const bunEnv = (globalRecord.Bun as { env?: Record<string, string | undefined> } | undefined)?.env;
    const nodeEnv = processEnv?.NODE_ENV ?? bunEnv?.NODE_ENV;

    if (typeof nodeEnv === 'string') {
      return nodeEnv !== 'production';
    }
  }

  return false;
};

const DEBUG_ENABLED = resolveDebugFlag();

/**
 * Emit a debug log if debug logging is enabled for the current build.
 */
export const debugLog: AnyFunction = (...args) => {
  if (!DEBUG_ENABLED) return;
  console.log(...args);
};

/**
 * Allow consumers to branch on the resolved debug flag.
 */
export const isDebugLoggingEnabled = (): boolean => DEBUG_ENABLED;
