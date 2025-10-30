/**
 * API client for server communication
 */

import { config } from '../config.js';
import type {
  StatusResponse,
  PlayerState,
  Playlist,
  CommandResponse,
  LyricsResponse,
  LyricsErrorResponse,
} from '@shared/types/index.js';

export class ApiClient {
  /**
   * Send command to server
   */
  async sendCommand(command: string, data?: unknown): Promise<CommandResponse> {
    try {
      const response = await fetch(config.api.endpoints.command, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, data }),
      });
      return (await response.json()) as CommandResponse;
    } catch (error) {
      console.error('Error sending command:', error);
      return { success: false };
    }
  }

  /**
   * Get server status
   */
  async getStatus(): Promise<StatusResponse | null> {
    try {
      const response = await fetch(config.api.endpoints.status);
      return (await response.json()) as StatusResponse;
    } catch (error) {
      console.error('Error getting status:', error);
      return null;
    }
  }

  /**
   * Get player state
   */
  async getState(): Promise<PlayerState | null> {
    try {
      const response = await fetch(config.api.endpoints.state);
      if (!response.ok) return null;
      return (await response.json()) as PlayerState;
    } catch (error) {
      console.error('Error getting state:', error);
      return null;
    }
  }

  /**
   * Get playlists
   */
  async getPlaylists(): Promise<Playlist[] | null> {
    console.log('[ApiClient] Fetching playlists from', config.api.endpoints.playlists);
    try {
      const response = await fetch(config.api.endpoints.playlists);
      console.log('[ApiClient] Response status:', response.status, response.statusText);

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          console.error('[ApiClient] Rate limited (429) - Too many requests. Backing off...');
          const error = new Error('Rate limited') as Error & { status: number; rateLimited: boolean };
          error.status = 429;
          error.rateLimited = true;
          throw error;
        }

        const errorText = await response.text();
        console.error('[ApiClient] Error response:', errorText);
        const error = new Error(`Failed to load playlists: ${response.status}`) as Error & { status: number };
        error.status = response.status;
        throw error;
      }

      const data = (await response.json()) as Playlist[];
      console.log('[ApiClient] Received', data.length, 'playlists');
      return data;
    } catch (error) {
      console.error('[ApiClient] Error loading playlists:', error);
      // Re-throw if it's a rate limit error so the UI can handle it
      if ((error as Error & { rateLimited?: boolean }).rateLimited) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Request re-authentication
   */
  async reauth(): Promise<boolean> {
    try {
      const response = await fetch(config.api.endpoints.reauth, {
        method: 'POST',
      });
      const data = (await response.json()) as { success: boolean };
      return data.success;
    } catch (error) {
      console.error('Error requesting reauth:', error);
      return false;
    }
  }

  /**
   * Get lyrics for a song
   */
  async getLyrics(artist: string, title: string): Promise<LyricsResponse | null> {
    try {
      const url = `${config.api.baseUrl}/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
      console.log('[ApiClient] Fetching lyrics from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('[ApiClient] Lyrics not found (404)');
          return null;
        }
        const errorData = (await response.json()) as LyricsErrorResponse;
        console.error('[ApiClient] Lyrics error:', errorData);
        return null;
      }

      const data = (await response.json()) as LyricsResponse;
      console.log('[ApiClient] Lyrics received:', {
        hasSynced: data.hasSynced,
        source: data.source,
        linesCount: data.synced?.length || 0,
      });
      return data;
    } catch (error) {
      console.error('[ApiClient] Error fetching lyrics:', error);
      return null;
    }
  }
}
