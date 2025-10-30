/**
 * Status indicator UI
 */

import { elements } from './elements.js';

export class StatusUI {
  /**
   * Update connection status
   */
  update(connected: boolean): void {
    if (connected) {
      elements.statusIndicator.classList.add('connected');
      elements.statusText.textContent = 'Verbunden';
    } else {
      elements.statusIndicator.classList.remove('connected');
      elements.statusText.textContent = 'Nicht verbunden';
    }
  }
}
