/**
 * YTMDesktop API Client
 */

import { config } from '../config.js';
import type { AuthManager } from '../auth/authManager.js';
import type {
  AppInfo,
  AuthCodeResponse,
  AuthTokenResponse,
  PlayerState,
  Playlist,
} from '@shared/types/index.js';

export class YTMClient {
  constructor(private authManager: AuthManager) {}

  /**
   * Get YTMDesktop app info
   */
  async getAppInfo(): Promise<AppInfo | null> {
    try {
      const response = await fetch(`${config.ytmDesktop.baseUrl}/query`);
      return (await response.json()) as AppInfo;
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  }

  /**
   * Request authentication code
   */
  async requestAuthCode(): Promise<string | null> {
    try {
      const response = await fetch(`${config.ytmDesktop.baseUrl}/api/v1/auth/requestcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: config.app.id,
          appName: config.app.name,
          appVersion: config.app.version,
        }),
      });
      const data = (await response.json()) as AuthCodeResponse;
      return data.code;
    } catch (error) {
      console.error('Error requesting auth code:', error);
      return null;
    }
  }

  /**
   * Request authentication token
   */
  async requestAuthToken(code: string): Promise<string | null> {
    try {
      const response = await fetch(`${config.ytmDesktop.baseUrl}/api/v1/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: config.app.id,
          code: code,
        }),
      });
      const data = (await response.json()) as AuthTokenResponse;
      return data.token;
    } catch (error) {
      console.error('Error requesting auth token:', error);
      return null;
    }
  }

  /**
   * Get current player state
   */
  async getPlayerState(): Promise<PlayerState | null> {
    const token = this.authManager.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${config.ytmDesktop.baseUrl}/api/v1/state`, {
        headers: { Authorization: token },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️  Auth token invalid or expired');
          this.authManager.clearToken();
          await this.authManager.deleteToken();
        }
        return null;
      }

      return (await response.json()) as PlayerState;
    } catch (error) {
      console.error('Error getting player state:', error);
      return null;
    }
  }

  /**
   * Send command to player
   */
  async sendCommand(command: string, data?: unknown): Promise<boolean> {
    const token = this.authManager.getToken();
    if (!token) return false;

    try {
      const body = data !== undefined ? { command, data } : { command };
      console.log('Sending command to YTMDesktop:', body);

      const response = await fetch(`${config.ytmDesktop.baseUrl}/api/v1/command`, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Command response:', response.ok, response.status);

      if (!response.ok && response.status === 401) {
        console.log('⚠️  Auth token invalid or expired');
        this.authManager.clearToken();
        await this.authManager.deleteToken();
      }

      return response.ok;
    } catch (error) {
      console.error('Error sending player command:', error);
      return false;
    }
  }

  /**
   * Get user playlists
   */
  async getPlaylists(): Promise<Playlist[] | null> {
    const token = this.authManager.getToken();
    if (!token) {
      console.log('[YTMClient] No auth token available for playlists');
      return null;
    }

    console.log('[YTMClient] Fetching playlists from YTMDesktop...');
    try {
      const response = await fetch(`${config.ytmDesktop.baseUrl}/api/v1/playlists`, {
        headers: { Authorization: token },
      });

      console.log('[YTMClient] YTMDesktop response:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[YTMClient] Auth token invalid, clearing...');
          this.authManager.clearToken();
          await this.authManager.deleteToken();
        }
        console.error('[YTMClient] Failed to get playlists:', response.status, response.statusText);
        return null;
      }

      const playlists = (await response.json()) as Playlist[];
      console.log('[YTMClient] Successfully fetched', playlists.length, 'playlists');
      return playlists;
    } catch (error) {
      console.error('[YTMClient] Error getting playlists:', error);
      return null;
    }
  }

  /**
   * Perform authentication flow
   */
  async authenticate(): Promise<boolean> {
    console.log('Checking YTMDesktop connection...');
    const appInfo = await this.getAppInfo();

    if (!appInfo) {
      console.log('⚠️  YTMDesktop is not running or not accessible');
      console.log('Please start YouTube Music Desktop App and enable Remote Control in Settings > Integrations');
      return false;
    }

    console.log('YTMDesktop detected, requesting authentication...');
    console.log('⚠️  Please check YouTube Music Desktop App and ACCEPT the authorization request!');

    const code = await this.requestAuthCode();
    if (!code) {
      console.log('Failed to get auth code');
      return false;
    }

    const token = await this.requestAuthToken(code);
    if (!token) {
      console.log('Failed to get auth token (did you accept the request in the app?)');
      return false;
    }

    await this.authManager.saveToken(token);
    console.log('✓ Authentication successful!');
    return true;
  }
}
