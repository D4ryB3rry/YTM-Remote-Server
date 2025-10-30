import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, fireEvent, within } from '@testing-library/dom';
import { setupClientDom } from './testUtils.js';
import { createTestElement } from '../setup/mockDom.js';
import { createMockFn } from '../utils/testMocks.js';

describe('LyricsUI', () => {
  beforeEach(async () => {
    const refs = await setupClientDom();
    const lyricsContent = refs['lyricsContent'];
    lyricsContent.setInnerHTMLHandler((html, element) => {
      while (element.children.length > 0) {
        element.removeChild(element.children[0]!);
      }
      const lineRegex = /<div class="lyrics-line" data-index="(\d+)" data-time="([^"]+)">([\s\S]*?)<\/div>/g;
      let match: RegExpExecArray | null;
      while ((match = lineRegex.exec(html)) !== null) {
        const [, index, time, text] = match;
        createTestElement('div', {
          parent: element,
          classNames: ['lyrics-line'],
          dataset: { index, time },
          textContent: text.trim(),
        });
      }
      if (element.children.length === 0) {
        element.textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    });
  });

  async function createLyricsUI() {
    const { LyricsUI } = await import('@client/ui/lyrics.ts');
    const { elements } = await import('@client/ui/elements.ts');
    return { LyricsUI, elements };
  }

  const baseState = {
    player: {
      trackState: 1,
      videoProgress: 0,
      volume: 50,
      muted: false,
      adPlaying: false,
      likeStatus: 'INDIFFERENT',
    },
    video: {
      author: 'Artist',
      channelId: 'c',
      title: 'Song',
      album: null,
      albumId: null,
      likeCount: null,
      dislikeCount: null,
      isLive: false,
      id: 'abcdefghijk',
      thumbnails: [],
      durationSeconds: 180,
    },
  };

  it('loads lyrics and allows seeking from synced lines', async () => {
    const { LyricsUI, elements } = await createLyricsUI();
    const stateManager = { getState: createMockFn(() => baseState) } as any;
    const sendCommand = createMockFn();
    const apiClient = {
      getLyrics: createMockFn().mockResolvedValue({
        lyrics: 'First line\nSecond line',
        hasSynced: true,
        source: 'Test',
        synced: [
          { time: 12, text: 'First line' },
          { time: 30, text: 'Second line' },
        ],
      }),
      sendCommand,
    } as any;

    new LyricsUI(stateManager, apiClient);

    fireEvent.click(screen.getByRole('button', { name: 'Lyrics' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(elements.lyricsPanel.classList.contains('active')).toBeTrue();
    expect(elements.lyricsStatus.textContent).toContain('Test');

    const line = within(elements.lyricsContent).getByText('First line');
    fireEvent.click(line);
    expect(sendCommand.mock.calls[0]).toEqual(['seekTo', 12]);
  });

  it('shows fallback message when lyrics are missing', async () => {
    const { LyricsUI, elements } = await createLyricsUI();
    const stateManager = { getState: createMockFn(() => baseState) } as any;
    const apiClient = {
      getLyrics: createMockFn().mockResolvedValue(null),
      sendCommand: createMockFn(),
    } as any;

    new LyricsUI(stateManager, apiClient);

    fireEvent.click(screen.getByRole('button', { name: 'Lyrics' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(elements.lyricsContent.textContent).toContain('Open in YouTube Music');
  });
});
