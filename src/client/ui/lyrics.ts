/**
 * Lyrics panel UI with real API integration
 */

import { elements } from './elements.js';
import type { StateManager } from '../state/stateManager.js';
import type { ApiClient } from '../api/apiClient.js';
import { config } from '../config.js';
import type { LyricsResponse, SyncedLyricLine } from '@shared/types/index.js';
import { debugLog } from '../utils/logger.js';

export class LyricsUI {
  private currentTrackKey: string | null = null;
  private syncedLyricsData: SyncedLyricLine[] | null = null;
  private lyricsUpdateInterval: number | null = null;
  private currentActiveLyricIndex = -1;

  constructor(
    private stateManager: StateManager,
    private apiClient: ApiClient
  ) {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Open lyrics button
    elements.lyricsBtn.addEventListener('click', () => {
      const state = this.stateManager.getState();
      if (!state || !state.video) {
        alert('Kein Song wird abgespielt');
        return;
      }

      const artist = state.video.author;
      const title = state.video.title;
      this.load(artist, title);
    });

    // Close button
    elements.lyricsCloseBtn.addEventListener('click', () => {
      this.close();
    });

    // Close with ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.lyricsPanel.classList.contains('active')) {
        this.close();
      }
    });

    // Click outside to close
    elements.lyricsPanel.addEventListener('click', (e) => {
      if (e.target === elements.lyricsPanel) {
        this.close();
      }
    });
  }

  /**
   * Show YouTube Music fallback link
   */
  private showYouTubeMusicFallback(message: string): void {
    const state = this.stateManager.getState();
    const videoId = state?.video?.id;

    let content = `
      <div class="lyrics-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5; margin-bottom: 16px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <h3 style="margin-bottom: 12px; font-size: 1.1em;">${message}</h3>
        <p style="font-size: 0.95em; opacity: 0.8; line-height: 1.5; margin-bottom: 20px;">
          Lyrics sind direkt in YouTube Music verfügbar.
        </p>`;

    if (videoId) {
      content += `
        <a href="https://music.youtube.com/watch?v=${videoId}"
           target="_blank"
           style="display: inline-block; padding: 10px 20px; background: rgba(255, 0, 0, 0.2); color: #ff5555; border: 1.5px solid rgba(255, 0, 0, 0.4); border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s;">
          📱 In YouTube Music öffnen
        </a>`;
    }

    content += `</div>`;
    elements.lyricsContent.innerHTML = content;
  }

  /**
   * Load lyrics from API
   */
  private async load(artist: string, title: string): Promise<void> {
    if (!artist || !title) {
      this.showError('Keine Track-Informationen verfügbar');
      return;
    }

    // Don't reload if same track
    const trackKey = this.createTrackKey(artist, title);
    if (this.currentTrackKey === trackKey && elements.lyricsPanel.classList.contains('active')) {
      return;
    }
    this.currentTrackKey = trackKey;

    // Clear any existing sync
    this.stopSync();

    // Show panel with loading state
    elements.lyricsPanel.classList.add('active');
    elements.lyricsStatus.textContent = '';
    elements.lyricsStatus.classList.remove('synced');
    elements.lyricsContent.classList.remove('synced');
    elements.lyricsContent.innerHTML = `
      <div class="lyrics-loading">
        <div class="spinner"></div>
        <p>Lyrics werden geladen...</p>
      </div>
    `;

    // Fetch lyrics from API
    debugLog('[LyricsUI] Loading lyrics for:', artist, '-', title);
    let result: LyricsResponse | null = null;
    try {
      result = await this.apiClient.getLyrics(artist, title);
    } catch (error) {
      console.error('[LyricsUI] Failed to fetch lyrics:', error);
    }

    if (!result) {
      debugLog('[LyricsUI] No lyrics found');
      this.showYouTubeMusicFallback('Keine Lyrics gefunden');
      return;
    }

    debugLog('[LyricsUI] Lyrics loaded, synced:', result.hasSynced);

    // Display synced lyrics if available
    if (result.hasSynced && result.synced && result.synced.length > 0) {
      this.syncedLyricsData = result.synced;
      elements.lyricsStatus.textContent = `♪ Synced Lyrics · ${result.source}`;
      elements.lyricsStatus.classList.add('synced');
      elements.lyricsContent.classList.add('synced');
      this.displaySyncedLyrics(result.synced);
      this.startSync();
    } else {
      // Display plain lyrics
      this.syncedLyricsData = null;
      elements.lyricsStatus.textContent = `Lyrics · ${result.source}`;
      elements.lyricsContent.classList.remove('synced');
      elements.lyricsContent.innerHTML = `
        <div class="lyrics-plain">
          ${result.lyrics.split('\n').map((line) => `<p>${line || '&nbsp;'}</p>`).join('')}
        </div>
      `;
    }
  }

  /**
   * Display synced lyrics
   */
  private displaySyncedLyrics(syncedLines: SyncedLyricLine[]): void {
    elements.lyricsContent.innerHTML = syncedLines
      .map(
        (line, index) => `
        <div class="lyrics-line" data-index="${index}" data-time="${line.time}">
          ${line.text || '&nbsp;'}
        </div>
      `
      )
      .join('');

    // Add click-to-seek functionality
    const lines = elements.lyricsContent.querySelectorAll('.lyrics-line');
    lines.forEach((line) => {
      line.addEventListener('click', () => {
        const time = parseFloat((line as HTMLElement).dataset.time || '0');
        if (!isNaN(time)) {
          this.apiClient.sendCommand('seekTo', time);
        }
      });
    });
  }

  /**
   * Start lyrics sync
   */
  private startSync(): void {
    this.stopSync();

    this.lyricsUpdateInterval = window.setInterval(() => {
      const state = this.stateManager.getState();
      if (!this.syncedLyricsData || !state || !state.player) return;

      const currentTime = state.player.videoProgress || 0;
      this.updateActiveLyric(currentTime);
    }, config.ui.lyricsUpdateInterval);
  }

  /**
   * Build consistent cache key for the currently visible track
   */
  private createTrackKey(artist: string, title: string): string {
    return `${artist.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
  }

  /**
   * Stop lyrics sync
   */
  private stopSync(): void {
    if (this.lyricsUpdateInterval !== null) {
      clearInterval(this.lyricsUpdateInterval);
      this.lyricsUpdateInterval = null;
    }
    this.currentActiveLyricIndex = -1;
  }

  /**
   * Update active lyric line
   */
  private updateActiveLyric(currentTime: number): void {
    if (!this.syncedLyricsData) return;

    // Find the current line index
    let activeIndex = -1;
    for (let i = this.syncedLyricsData.length - 1; i >= 0; i--) {
      if (currentTime >= this.syncedLyricsData[i].time) {
        activeIndex = i;
        break;
      }
    }

    // Only update if index changed
    if (activeIndex === this.currentActiveLyricIndex) return;
    this.currentActiveLyricIndex = activeIndex;

    // Update all lines
    const lines = elements.lyricsContent.querySelectorAll('.lyrics-line');
    lines.forEach((line, index) => {
      line.classList.remove('active', 'past');

      if (index === activeIndex) {
        line.classList.add('active');
        // Scroll to active line
        line.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (index < activeIndex) {
        line.classList.add('past');
      }
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.syncedLyricsData = null;
    elements.lyricsContent.classList.remove('synced');
    elements.lyricsStatus.textContent = '';
    elements.lyricsContent.innerHTML = `
      <div class="lyrics-error">
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Close lyrics panel
   */
  close(): void {
    elements.lyricsPanel.classList.remove('active');
    this.stopSync();
  }
}
