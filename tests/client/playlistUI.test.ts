import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, fireEvent, within } from '@testing-library/dom';
import { setupClientDom } from './testUtils.js';
import { createTestElement } from '../setup/mockDom.js';
import { createMockFn } from '../utils/testMocks.js';

describe('PlaylistUI', () => {
  beforeEach(async () => {
    const refs = await setupClientDom();
    const playlistList = refs['playlistList'];
    playlistList.setInnerHTMLHandler((html, element) => {
      while (element.children.length > 0) {
        element.removeChild(element.children[0]!);
      }
      const itemRegex = /<div class="playlist-item" data-playlist-id="([^"]+)">[\s\S]*?<div class="playlist-name">([^<]+)/g;
      let match: RegExpExecArray | null;
      while ((match = itemRegex.exec(html)) !== null) {
        const [, id, title] = match;
        createTestElement('div', {
          parent: element,
          classNames: ['playlist-item'],
          dataset: { playlistId: id },
          textContent: title.trim(),
        });
      }
    });
  });

  async function createPlaylistUI() {
    const { PlaylistUI } = await import('@client/ui/playlist.ts');
    const { elements } = await import('@client/ui/elements.ts');
    return { PlaylistUI, elements };
  }

  it('loads playlists and sends commands on selection', async () => {
    const { PlaylistUI, elements } = await createPlaylistUI();
    const playlists = [
      { id: 'pl1', title: 'Chill Mix', thumbnails: [], author: 'DJ', videoCount: 10 },
      { id: 'pl2', title: 'Focus', thumbnails: [], author: 'DJ', videoCount: 5 },
    ];
    const sendCommand = createMockFn();
    const apiClient = {
      getPlaylists: createMockFn().mockResolvedValue(playlists),
      sendCommand,
    } as any;

    const ui = new PlaylistUI(apiClient);
    await ui.load(true);

    const list = within(elements.playlistList);
    const item = list.getByText('Chill Mix');
    fireEvent.click(item);

    expect(sendCommand.mock.calls[0]).toEqual(['changeVideo', { playlistId: 'pl1', videoId: null }]);
  });

  it('refresh button triggers reload', async () => {
    const { PlaylistUI, elements } = await createPlaylistUI();
    const playlists = [{ id: 'pl1', title: 'Morning', thumbnails: [], author: 'DJ', videoCount: 3 }];
    const apiClient = {
      getPlaylists: createMockFn().mockResolvedValue(playlists),
      sendCommand: createMockFn(),
    } as any;

    const ui = new PlaylistUI(apiClient);
    await ui.load();
    apiClient.getPlaylists.mockResolvedValue([{ id: 'pl2', title: 'Evening', thumbnails: [], author: 'DJ', videoCount: 4 }]);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiClient.getPlaylists.mock.calls.length).toBe(2);
  });
});
