/**
 * Playlist browser UI
 */

import { elements } from './elements.js';
import type { ApiClient } from '../api/apiClient.js';

export class PlaylistUI {
  private lastLoadTime = 0;
  private readonly LOAD_COOLDOWN = 30000; // 30 seconds cooldown to prevent rate limiting
  private isLoading = false;

  // Exponential backoff for rate limiting
  private rateLimitBackoffMs = 0;
  private rateLimitCount = 0;
  private readonly MAX_BACKOFF_MS = 300000; // Max 5 minutes backoff

  // Cache for playlists (fallback when API fails)
  private cachedPlaylists: Array<{
    id: string;
    title: string;
    thumbnails: Array<{ url: string; width: number; height: number }>;
    author: string;
    videoCount: number;
  }> | null = null;

  constructor(private apiClient: ApiClient) {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    elements.refreshPlaylistsBtn.addEventListener('click', () => {
      this.load(true); // Force reload on manual refresh
    });
  }

  /**
   * Load playlists from server
   * @param force - Force reload even if within cooldown period
   */
  async load(force = false): Promise<void> {
    console.log('[PlaylistUI] load() called, force:', force);

    // Check if already loading
    if (this.isLoading) {
      console.log('[PlaylistUI] Already loading, skipping...');
      return;
    }

    // Check cooldown (unless forced)
    if (!force && this.lastLoadTime > 0) {
      const timeSinceLastLoad = Date.now() - this.lastLoadTime;
      if (timeSinceLastLoad < this.LOAD_COOLDOWN) {
        console.log(`[PlaylistUI] Cooldown active (${Math.ceil((this.LOAD_COOLDOWN - timeSinceLastLoad) / 1000)}s remaining)`);
        return;
      }
    }

    this.isLoading = true;
    console.log('[PlaylistUI] Starting playlist load...');
    try {
      elements.playlistList.innerHTML = `
        <div class="playlist-loading">
          <div class="spinner-small"></div>
          <p>Playlists werden geladen...</p>
        </div>
      `;

      const playlists = await this.apiClient.getPlaylists();

      console.log('[PlaylistUI] Received playlists:', playlists ? playlists.length : 'null');

      if (!playlists || playlists.length === 0) {
        // Try to use cached playlists if available
        if (this.cachedPlaylists && this.cachedPlaylists.length > 0) {
          console.log('[PlaylistUI] Using cached playlists as fallback');
          this.displayPlaylists(this.cachedPlaylists, true);
          return;
        }

        elements.playlistList.innerHTML = '<p class="queue-empty">Keine Playlists gefunden</p>';
        this.lastLoadTime = Date.now();
        console.log('[PlaylistUI] No playlists found');
        return;
      }

      // Cache successful result
      this.cachedPlaylists = playlists;
      console.log('[PlaylistUI] Playlists cached for fallback');

      this.displayPlaylists(playlists, false);

      // Update last load time on success
      this.lastLoadTime = Date.now();
      console.log('[PlaylistUI] Playlists loaded successfully, count:', playlists.length);
    } catch (error) {
      console.error('[PlaylistUI] Error loading playlists:', error);

      // Try to use cached playlists as fallback
      if (this.cachedPlaylists && this.cachedPlaylists.length > 0) {
        console.log('[PlaylistUI] Using cached playlists as fallback after error');
        this.displayPlaylists(this.cachedPlaylists, true);
      } else {
        elements.playlistList.innerHTML =
          '<p class="queue-empty">Fehler beim Laden der Playlists</p>';
      }
      // Don't update lastLoadTime on error to allow retry
    } finally {
      this.isLoading = false;
      console.log('[PlaylistUI] Loading finished');
    }
  }

  /**
   * Display playlists in UI
   */
  private displayPlaylists(
    playlists: Array<{
      id: string;
      title: string;
      thumbnails: Array<{ url: string; width: number; height: number }>;
      author: string;
      videoCount: number;
    }>,
    fromCache: boolean
  ): void {
    const cacheIndicator = fromCache
      ? '<span style="opacity: 0.6; font-size: 11px; margin-left: 8px;">(Cached)</span>'
      : '';

    elements.playlistList.innerHTML = playlists
      .map((playlist, index) => {
        // Show song count if available
        const songCount = playlist.videoCount || 0;
        const songCountText = songCount ? `${songCount} Songs` : '';

        // Show author if available
        const author = playlist.author || '';

        return `
          <div class="playlist-item" data-playlist-id="${playlist.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"></path>
            </svg>
            <div class="playlist-info">
              <div class="playlist-name">${playlist.title}${index === 0 ? cacheIndicator : ''}</div>
              <div class="playlist-meta">
                ${author ? `<span class="playlist-author">${author}</span>` : ''}
                ${author && songCountText ? '<span class="playlist-separator">•</span>' : ''}
                ${songCountText ? `<span class="playlist-count">${songCountText}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Add click handlers
    const items = elements.playlistList.querySelectorAll('.playlist-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const playlistId = (item as HTMLElement).dataset.playlistId;
        this.apiClient.sendCommand('changeVideo', {
          playlistId: playlistId,
          videoId: null,
        });
      });
    });
  }
}
