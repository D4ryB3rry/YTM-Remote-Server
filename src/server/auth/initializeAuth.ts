import type { AuthManager } from './authManager.js';
import type { YTMClient } from '../api/ytmClient.js';
import type { SocketManager } from '../socket/socketManager.js';

export interface InitializeAuthDependencies {
  authManager: Pick<AuthManager, 'loadToken' | 'clearToken'>;
  ytmClient: Pick<
    YTMClient,
    'getPlayerState' | 'authenticate'
  >;
  socketManager: Pick<SocketManager, 'connectToYTMDesktop'>;
}

export function createInitializeAuth({
  authManager,
  ytmClient,
  socketManager,
}: InitializeAuthDependencies): () => Promise<void> {
  return async function initializeAuth(): Promise<void> {
    console.log('='.repeat(50));
    console.log('🎵 YTM Remote Server starting...');
    console.log('='.repeat(50));

    const savedToken = await authManager.loadToken();
    if (savedToken) {
      console.log('Attempting to use saved auth token...');

      const state = await ytmClient.getPlayerState();
      if (state) {
        console.log('✓ Saved auth token is valid!');
        socketManager.connectToYTMDesktop();
        console.log('='.repeat(50));
        return;
      } else {
        console.log('⚠️  Saved auth token is invalid or expired');
        authManager.clearToken();
      }
    }

    const success = await ytmClient.authenticate();
    if (success) {
      socketManager.connectToYTMDesktop();
    }
    console.log('='.repeat(50));
  };
}

export type InitializeAuth = ReturnType<typeof createInitializeAuth>;
