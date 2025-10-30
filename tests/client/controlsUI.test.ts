import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, fireEvent } from '@testing-library/dom';
import { setupClientDom } from './testUtils.js';
import { createMockFn } from '../utils/testMocks.js';

const mockState = {
  player: {
    trackState: 1,
    videoProgress: 0,
    volume: 50,
    muted: false,
    adPlaying: false,
    likeStatus: 'INDIFFERENT',
    queue: {
      items: [],
      repeatMode: 0,
    },
  },
  video: {
    author: 'Artist',
    channelId: 'channel',
    title: 'Song',
    album: 'Album',
    albumId: null,
    likeCount: null,
    dislikeCount: null,
    isLive: false,
    id: 'abcdefghijk',
    thumbnails: [],
    durationSeconds: 120,
  },
};

describe('ControlsUI', () => {
  beforeEach(async () => {
    await setupClientDom();
  });

  async function createControls() {
    const { ControlsUI } = await import('@client/ui/controls.ts');
    const { elements } = await import('@client/ui/elements.ts');
    return { ControlsUI, elements };
  }

  it('sends playback commands for primary buttons', async () => {
    const { ControlsUI } = await createControls();
    const sendCommand = createMockFn();
    const stateManager = { getState: createMockFn(() => mockState) } as any;

    new ControlsUI(stateManager, { sendCommand } as any);

    fireEvent.click(screen.getByRole('button', { name: 'Play/Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prev' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Like' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dislike' }));

    expect(sendCommand.mock.calls.map((call) => call[0])).toEqual([
      'playPause',
      'previous',
      'next',
      'shuffle',
      'toggleLike',
      'toggleDislike',
    ]);
  });

  it('cycles repeat mode and clears URL playback input', async () => {
    const { ControlsUI } = await createControls();
    const sendCommand = createMockFn();
    const repeatStates = [
      { player: { ...mockState.player, queue: { items: [], repeatMode: 0 } }, video: mockState.video },
      { player: { ...mockState.player, queue: { items: [], repeatMode: 1 } }, video: mockState.video },
      { player: { ...mockState.player, queue: { items: [], repeatMode: 2 } }, video: mockState.video },
    ];
    const stateManager = { getState: createMockFn(() => repeatStates.shift() ?? mockState) } as any;

    new ControlsUI(stateManager, { sendCommand } as any);

    const repeatButton = screen.getByRole('button', { name: 'Repeat' });
    fireEvent.click(repeatButton);
    fireEvent.click(repeatButton);

    expect(sendCommand.mock.calls[0]).toEqual(['repeatMode', 1]);
    expect(sendCommand.mock.calls[1]).toEqual(['repeatMode', 2]);

    const urlInput = screen.getByRole('textbox');
    urlInput.value = 'https://youtu.be/abcd1234xyz';
    fireEvent.click(screen.getByRole('button', { name: 'Play URL' }));

    const changeCall = sendCommand.mock.calls.at(-1);
    expect(changeCall).toEqual(['changeVideo', { videoId: 'abcd1234xyz', playlistId: null }]);
    expect(urlInput.value).toBe('');

    urlInput.value = 'abc12345678';
    fireEvent.keyPress(urlInput, { key: 'Enter', target: { value: 'abc12345678' } });
    const lastCall = sendCommand.mock.calls.at(-1);
    expect(lastCall).toEqual(['changeVideo', { videoId: 'abc12345678', playlistId: null }]);
  });

  it('updates track information and badge display', async () => {
    const { ControlsUI, elements } = await createControls();
    const sendCommand = createMockFn();
    const stateManager = { getState: createMockFn(() => mockState) } as any;

    const ui = new ControlsUI(stateManager, { sendCommand } as any);

    ui.updateTrackInfo('Track', 'Artist', 'Album');
    expect(elements.trackTitle.textContent).toBe('Track');
    expect(elements.trackArtist.textContent).toBe('Artist');
    expect(elements.trackAlbum.textContent).toBe('Album');

    ui.updateMediaTypeBadge(true, undefined);
    expect(elements.mediaTypeBadge.textContent).not.toBe('');
    expect(elements.mediaTypeBadge.style.display).toBe('inline-flex');
  });
});
