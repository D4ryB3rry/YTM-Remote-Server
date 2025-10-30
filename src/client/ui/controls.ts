/**
 * Playback controls UI
 */

import { elements } from './elements.js';
import type { StateManager } from '../state/stateManager.js';
import type { ApiClient } from '../api/apiClient.js';
import type { Thumbnail } from '@shared/types/index.js';
import { debugLog } from '../utils/logger.js';

export class ControlsUI {
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
    // Play/Pause
    elements.playPauseBtn.addEventListener('click', () => {
      this.apiClient.sendCommand('playPause');
    });

    // Previous
    elements.prevBtn.addEventListener('click', () => {
      this.apiClient.sendCommand('previous');
    });

    // Next
    elements.nextBtn.addEventListener('click', () => {
      this.apiClient.sendCommand('next');
    });

    // Shuffle
    elements.shuffleBtn.addEventListener('click', () => {
      this.apiClient.sendCommand('shuffle');
    });

    // Repeat
    elements.repeatBtn.addEventListener('click', () => {
      const state = this.stateManager.getState();
      const currentMode = state?.player?.queue?.repeatMode;

      // Handle undefined, null, or -1 as 0
      const mode = (currentMode === undefined || currentMode === null || currentMode === -1) ? 0 : currentMode;

      // Cycle: 0 (None) -> 1 (All) -> 2 (One) -> 0
      const nextMode = (mode + 1) % 3;

      debugLog('Repeat mode change:', mode, '->', nextMode);
      this.apiClient.sendCommand('repeatMode', nextMode);
    });

    // Like
    elements.thumbsUpBtn.addEventListener('click', () => {
      this.apiClient.sendCommand('toggleLike');
    });

    // Dislike
    elements.thumbsDownBtn.addEventListener('click', () => {
      this.apiClient.sendCommand('toggleDislike');
    });

    // Direct URL playback
    elements.playUrlBtn.addEventListener('click', () => {
      this.playFromUrl();
    });

    elements.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.playFromUrl();
      }
    });
  }

  /**
   * Update track info display
   */
  updateTrackInfo(title: string, artist: string, album: string): void {
    elements.trackTitle.textContent = title || 'Kein Song wird abgespielt';
    elements.trackArtist.textContent = artist || '-';
    elements.trackAlbum.textContent = album || '-';
  }

  /**
   * Update media type badge
   */
  updateMediaTypeBadge(isLive: boolean, videoType?: number): void {
    // Debug logging
    debugLog('[Badge] isLive:', isLive, 'videoType:', videoType);

    // Hide badge if no type information
    if (videoType === undefined && !isLive) {
      elements.mediaTypeBadge.style.display = 'none';
      return;
    }

    // Determine badge type and text
    let badgeClass = '';
    let badgeText = '';

    if (isLive) {
      badgeClass = 'type-live';
      badgeText = 'LIVE';
      debugLog('[Badge] Setting LIVE badge');
    } else {
      switch (videoType) {
        case 3: // Podcast
          badgeClass = 'type-podcast';
          badgeText = 'PODCAST';
          debugLog('[Badge] Setting PODCAST badge');
          break;
        case 1: // Video
          badgeClass = 'type-video';
          badgeText = 'VIDEO';
          debugLog('[Badge] Setting VIDEO badge');
          break;
        case 0: // Audio
          badgeClass = 'type-audio';
          badgeText = 'SONG';
          debugLog('[Badge] Setting SONG badge');
          break;
        case 2: // Uploaded
          badgeClass = 'type-video';
          badgeText = 'UPLOAD';
          debugLog('[Badge] Setting UPLOAD badge');
          break;
        default: // Unknown (-1) or undefined
          debugLog('[Badge] Unknown type, hiding badge');
          elements.mediaTypeBadge.style.display = 'none';
          return;
      }
    }

    // Update badge
    elements.mediaTypeBadge.className = `media-type-badge ${badgeClass}`;
    elements.mediaTypeBadge.textContent = badgeText;
    elements.mediaTypeBadge.style.display = 'inline-flex';
    debugLog('[Badge] Badge updated:', badgeClass, badgeText);
  }

  /**
   * Update album art
   */
  updateAlbumArt(thumbnails?: Thumbnail[]): void {
    const lastUrl = this.stateManager.getLastAlbumArtUrl();

    if (!thumbnails || thumbnails.length === 0) {
      // No thumbnails, show placeholder
      elements.albumArt.style.display = 'none';
      elements.albumArtPlaceholder.style.opacity = '1';
      this.stateManager.setLastAlbumArtUrl('');
      return;
    }

    // Get the best quality thumbnail
    const bestThumbnail = thumbnails.reduce((best, current) => {
      return current.width > best.width ? current : best;
    }, thumbnails[0]);

    const newUrl = bestThumbnail.url;

    // Don't reload if it's the same image
    if (newUrl === lastUrl) {
      return;
    }

    this.stateManager.setLastAlbumArtUrl(newUrl);

    // Show placeholder while loading
    elements.albumArtPlaceholder.style.opacity = '1';
    elements.albumArt.style.display = 'none';

    // Load new image
    const img = new Image();
    img.onload = () => {
      elements.albumArt.src = newUrl;
      elements.albumArt.style.display = 'block';
      elements.albumArtPlaceholder.style.opacity = '0';
    };
    img.onerror = () => {
      // If image fails to load, keep placeholder
      console.error('Failed to load album art:', newUrl);
      elements.albumArt.style.display = 'none';
      elements.albumArtPlaceholder.style.opacity = '1';
      this.stateManager.setLastAlbumArtUrl('');
    };
    img.src = newUrl;
  }

  /**
   * Update play/pause button
   */
  updatePlayPauseButton(isPaused: boolean): void {
    if (isPaused) {
      elements.playIcon.style.display = 'block';
      elements.pauseIcon.style.display = 'none';
    } else {
      elements.playIcon.style.display = 'none';
      elements.pauseIcon.style.display = 'block';
    }
  }

  /**
   * Update shuffle button
   */
  updateShuffleButton(isShuffled: boolean): void {
    if (isShuffled) {
      elements.shuffleBtn.classList.add('active');
    } else {
      elements.shuffleBtn.classList.remove('active');
    }
  }

  /**
   * Update repeat button
   */
  updateRepeatButton(repeatMode?: number): void {
    // Handle undefined, null, or -1 (Unknown) as mode 0 (None)
    const mode = (repeatMode === undefined || repeatMode === null || repeatMode === -1) ? 0 : repeatMode;

    elements.repeatBtn.classList.remove('active', 'repeat-one');

    if (mode === 1) {
      // Repeat All
      elements.repeatBtn.classList.add('active');
    } else if (mode === 2) {
      // Repeat One
      elements.repeatBtn.classList.add('active', 'repeat-one');
    }
    // mode 0 = None, no classes
  }

  /**
   * Update like buttons
   */
  updateLikeButtons(likeStatus?: 'LIKE' | 'DISLIKE' | 'INDIFFERENT'): void {
    debugLog('[ControlsUI] updateLikeButtons called with:', likeStatus);

    elements.thumbsUpBtn.classList.remove('active');
    elements.thumbsDownBtn.classList.remove('active');

    if (likeStatus === 'LIKE') {
      elements.thumbsUpBtn.classList.add('active');
      debugLog('[ControlsUI] Set thumbs up as active');
    } else if (likeStatus === 'DISLIKE') {
      elements.thumbsDownBtn.classList.add('active');
      debugLog('[ControlsUI] Set thumbs down as active');
    } else {
      debugLog('[ControlsUI] No like/dislike status or INDIFFERENT');
    }
  }

  /**
   * Play from URL or video ID
   */
  private playFromUrl(): void {
    const url = elements.urlInput.value.trim();
    if (!url) return;

    // Extract video ID from URL or use as-is if it's already an ID
    let videoId = url;

    // Handle different YouTube/YouTube Music URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    this.apiClient.sendCommand('changeVideo', { videoId: videoId, playlistId: null });
    elements.urlInput.value = '';
  }
}
