import { createTestElement, resetDom, MockElement } from '../setup/mockDom.js';

type ElementMap = Record<string, MockElement>;

export async function setupClientDom(): Promise<ElementMap> {
  resetDom();

  const elements: ElementMap = {};
  const register = (tag: string, id: string, options: Record<string, unknown> = {}) => {
    const element = createTestElement(tag, { id, ...(options as any) });
    elements[id] = element;
    return element;
  };

  // Status
  register('div', 'statusIndicator');
  register('span', 'statusText');

  // Album art
  register('div', 'albumArtPlaceholder');
  register('img', 'albumArt');

  // Track info
  register('h1', 'trackTitle');
  register('div', 'trackArtist');
  register('div', 'trackAlbum');
  register('span', 'mediaTypeBadge');

  // Progress
  register('div', 'progressFill');
  register('input', 'progressSlider', { type: 'range', value: '0' });
  register('span', 'currentTime');
  register('span', 'totalTime');

  // Controls
  register('button', 'playPauseBtn', { textContent: 'Play/Pause' });
  register('span', 'playIcon');
  register('span', 'pauseIcon');
  register('button', 'prevBtn', { textContent: 'Prev' });
  register('button', 'nextBtn', { textContent: 'Next' });
  register('button', 'shuffleBtn', { textContent: 'Shuffle' });
  register('button', 'repeatBtn', { textContent: 'Repeat' });
  register('button', 'thumbsUpBtn', { textContent: 'Like' });
  register('button', 'thumbsDownBtn', { textContent: 'Dislike' });

  // Lyrics
  register('button', 'lyricsBtn', { textContent: 'Lyrics' });
  const panel = register('div', 'lyricsPanel');
  register('button', 'lyricsCloseBtn', { textContent: 'Close' });
  register('div', 'lyricsContent');
  register('div', 'lyricsStatus');

  // Volume
  register('button', 'volumeBtn', { textContent: 'Volume' });
  register('span', 'volumeIcon');
  register('span', 'muteIcon');
  register('input', 'volumeSlider', { type: 'range', value: '50' });
  register('span', 'volumeValue');

  // URL playback
  register('input', 'urlInput', { type: 'text', value: '' });
  register('button', 'playUrlBtn', { textContent: 'Play URL' });

  // Playlists
  register('div', 'playlistList');
  register('button', 'refreshPlaylistsBtn', { textContent: 'Refresh' });

  // Queue
  register('div', 'queueList');
  register('div', 'queueStats');

  // Ensure lyrics panel hides by default
  panel.classList.remove('active');

  const { elements: exportedElements } = await import('@client/ui/elements.ts');
  for (const [key, element] of Object.entries(elements)) {
    (exportedElements as Record<string, MockElement>)[key] = element;
  }

  return elements;
}
