/**
 * Status indicator UI
 */

import { elements } from './elements.js';
import { t } from '../i18n/index.js';

export class StatusUI {
  /**
   * Update connection status
   */
  update(connected: boolean): void {
    if (connected) {
      elements.statusIndicator.classList.add('connected');
      elements.statusText.textContent = t('status.connected');
    } else {
      elements.statusIndicator.classList.remove('connected');
      elements.statusText.textContent = t('status.disconnected');
    }
  }
}
