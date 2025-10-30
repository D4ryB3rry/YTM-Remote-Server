/**
 * Progress bar and time display
 */

import { elements } from './elements.js';
import type { StateManager } from '../state/stateManager.js';
import type { ApiClient } from '../api/apiClient.js';
import { config } from '../config.js';

export class ProgressUI {
  private progressInterval: number | null = null;

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
    // Progress slider input (preview)
    elements.progressSlider.addEventListener('input', (e) => {
      const state = this.stateManager.getState();
      if (!state || !state.video) return;

      const total = state.video.durationSeconds || 0;
      const percent = parseFloat((e.target as HTMLInputElement).value);
      const seekTo = (percent / 100) * total;

      // Update UI immediately
      elements.currentTime.textContent = this.formatTime(seekTo);
      elements.progressFill.style.width = `${percent}%`;
    });

    // Progress slider change (commit)
    elements.progressSlider.addEventListener('change', (e) => {
      const state = this.stateManager.getState();
      if (!state || !state.video) return;

      const total = state.video.durationSeconds || 0;
      const percent = parseFloat((e.target as HTMLInputElement).value);
      const seekTo = (percent / 100) * total;

      this.apiClient.sendCommand('seekTo', seekTo);
    });
  }

  /**
   * Update progress display
   */
  update(currentSeconds: number, totalSeconds: number): void {
    elements.currentTime.textContent = this.formatTime(currentSeconds);
    elements.totalTime.textContent = this.formatTime(totalSeconds);

    if (totalSeconds > 0) {
      const percent = (currentSeconds / totalSeconds) * 100;
      elements.progressFill.style.width = `${percent}%`;
      elements.progressSlider.value = percent.toString();
    }
  }

  /**
   * Start automatic progress updates
   */
  startUpdates(): void {
    this.stopUpdates();

    this.progressInterval = window.setInterval(() => {
      const state = this.stateManager.getState();
      if (state && state.player && state.player.trackState === 1) {
        // Increment current position
        const current = (state.player.videoProgress || 0) + 1;
        const total = state.video?.durationSeconds || 0;

        if (current <= total) {
          state.player.videoProgress = current;
          this.update(current, total);
        }
      }
    }, config.ui.progressUpdateInterval);
  }

  /**
   * Stop automatic progress updates
   */
  stopUpdates(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Format time (seconds to MM:SS)
   */
  private formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
