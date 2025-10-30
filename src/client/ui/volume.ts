/**
 * Volume controls UI
 */

import { elements } from './elements.js';
import type { ApiClient } from '../api/apiClient.js';

export class VolumeUI {
  constructor(private apiClient: ApiClient) {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Mute/Unmute button
    elements.volumeBtn.addEventListener('click', () => {
      const currentVolume = parseInt(elements.volumeSlider.value);
      if (currentVolume > 0) {
        // Currently has volume -> Mute it
        this.setVolume(0);
        this.apiClient.sendCommand('setVolume', 0);
      } else {
        // Currently muted -> Unmute to 50%
        this.setVolume(50);
        this.apiClient.sendCommand('setVolume', 50);
      }
    });

    // Volume slider input (preview)
    elements.volumeSlider.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value);
      elements.volumeValue.textContent = `${volume}%`;
      this.updateIcon(volume);
    });

    // Volume slider change (commit)
    elements.volumeSlider.addEventListener('change', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value);
      this.apiClient.sendCommand('setVolume', volume);
    });
  }

  /**
   * Update volume display
   */
  update(volume: number): void {
    this.setVolume(volume);
  }

  /**
   * Set volume value
   */
  private setVolume(volume: number): void {
    elements.volumeSlider.value = volume.toString();
    elements.volumeValue.textContent = `${volume}%`;
    this.updateIcon(volume);
  }

  /**
   * Update volume icon
   */
  private updateIcon(volume: number): void {
    if (volume === 0) {
      elements.volumeIcon.style.display = 'none';
      elements.muteIcon.style.display = 'block';
    } else {
      elements.volumeIcon.style.display = 'block';
      elements.muteIcon.style.display = 'none';
    }
  }
}
