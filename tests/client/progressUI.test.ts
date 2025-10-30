import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, fireEvent } from '@testing-library/dom';
import { setupClientDom } from './testUtils.js';
import { createMockFn } from '../utils/testMocks.js';

describe('ProgressUI', () => {
  beforeEach(async () => {
    await setupClientDom();
  });

  async function createProgress() {
    const { ProgressUI } = await import('@client/ui/progress.ts');
    const { elements } = await import('@client/ui/elements.ts');
    return { ProgressUI, elements };
  }

  it('previews and submits seek events', async () => {
    const { ProgressUI, elements } = await createProgress();
    const sendCommand = createMockFn();
    const playerState = {
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
        durationSeconds: 120,
      },
    };
    const stateManager = { getState: createMockFn(() => playerState) } as any;

    new ProgressUI(stateManager, { sendCommand } as any);

    const slider = elements.progressSlider;
    fireEvent.input(slider, { target: { value: '50' } });

    expect(elements.currentTime.textContent).toBe('1:00');
    expect(elements.progressFill.style.width).toBe('50%');

    fireEvent.change(slider, { target: { value: '50' } });
    expect(sendCommand.mock.calls[0]).toEqual(['seekTo', 60]);
  });

  it('updates progress display directly', async () => {
    const { ProgressUI, elements } = await createProgress();
    const stateManager = { getState: createMockFn(() => null) } as any;
    const sendCommand = createMockFn();

    const ui = new ProgressUI(stateManager, { sendCommand } as any);
    ui.update(30, 120);

    expect(elements.currentTime.textContent).toBe('0:30');
    expect(elements.totalTime.textContent).toBe('2:00');
    expect(elements.progressFill.style.width).toBe('25%');
  });
});
