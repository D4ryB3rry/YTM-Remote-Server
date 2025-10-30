/**
 * Queue display UI
 */

import { elements } from './elements.js';
import type { ApiClient } from '../api/apiClient.js';
import { getProxiedImageUrl } from '../utils/imageProxy.js';

interface Queue {
  items?: Array<{
    title?: string;
    author?: string;
    duration?: string;
    videoId?: string;
    thumbnails?: Array<{ url: string; width: number; height: number }>;
  }>;
  selectedItemIndex?: number;
  repeatMode?: number;
}

export class QueueUI {
  constructor(private apiClient: ApiClient) {}

  /**
   * Update queue display
   */
  update(queue?: Queue): void {
    if (!queue || !queue.items || queue.items.length === 0) {
      elements.queueList.innerHTML = '<p class="queue-empty">Keine Songs in der Warteschlange</p>';
      elements.queueStats.textContent = '';
      return;
    }

    elements.queueStats.textContent = `${queue.items.length} Songs`;

    elements.queueList.innerHTML = queue.items
      .map((item, index) => {
        // Get thumbnail URL (use smallest one for queue)
        const thumbnail =
          item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0].url : '';
        const proxiedThumbnail = thumbnail ? getProxiedImageUrl(thumbnail) : '';

        return `
          <div class="queue-item ${index === queue.selectedItemIndex ? 'active' : ''}" data-video-id="${item.videoId || ''}" data-index="${index}">
            ${
              proxiedThumbnail
                ? `<img src="${proxiedThumbnail}" alt="Cover" class="queue-item-thumbnail">`
                : '<div class="queue-item-thumbnail-placeholder">🎵</div>'
            }
            <div class="queue-item-info">
              <div class="queue-item-title">${item.title || 'Unbekannt'}</div>
              <div class="queue-item-artist">${item.author || 'Unbekannt'}</div>
            </div>
            <div class="queue-item-duration">${item.duration || ''}</div>
          </div>
        `;
      })
      .join('');

    // Add click handlers to queue items
    const queueItems = elements.queueList.querySelectorAll('.queue-item');
    queueItems.forEach((item) => {
      item.addEventListener('click', () => {
        const index = (item as HTMLElement).dataset.index;
        if (index !== undefined) {
          // Play the selected queue item by index
          this.apiClient.sendCommand('playQueueIndex', parseInt(index, 10));
        }
      });
    });
  }
}
