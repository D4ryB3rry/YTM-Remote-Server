/**
 * Client state management
 */

import type { PlayerState } from '@shared/types/index.js';

export class StateManager {
  private currentState: PlayerState | null = null;
  private isConnected = false;
  private lastAlbumArtUrl = '';

  /**
   * Get current player state
   */
  getState(): PlayerState | null {
    return this.currentState;
  }

  /**
   * Set current player state
   */
  setState(state: PlayerState): void {
    this.currentState = state;
  }

  /**
   * Check if connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Set connection status
   */
  setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  /**
   * Get last album art URL
   */
  getLastAlbumArtUrl(): string {
    return this.lastAlbumArtUrl;
  }

  /**
   * Set last album art URL
   */
  setLastAlbumArtUrl(url: string): void {
    this.lastAlbumArtUrl = url;
  }
}
