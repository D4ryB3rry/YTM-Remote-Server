import { describe, expect, it } from 'bun:test';
import { StateManager } from '@client/state/stateManager.ts';
import type { PlayerState } from '@shared/types/index.ts';

describe('StateManager', () => {
  const sampleState: PlayerState = {
    player: {
      trackState: 1,
      videoProgress: 42,
      volume: 75,
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
      albumId: 'albumId',
      likeCount: null,
      dislikeCount: null,
      likeStatus: 'LIKE',
      isLive: false,
      id: 'video1234567',
      thumbnails: [],
      durationSeconds: 200,
      videoType: 0,
    },
  };

  it('stores and returns the current state', () => {
    const manager = new StateManager();
    expect(manager.getState()).toBeNull();

    manager.setState(sampleState);
    expect(manager.getState()).toEqual(sampleState);
  });

  it('tracks connection state and album art url', () => {
    const manager = new StateManager();

    expect(manager.isClientConnected()).toBeFalse();
    manager.setConnected(true);
    expect(manager.isClientConnected()).toBeTrue();

    expect(manager.getLastAlbumArtUrl()).toBe('');
    manager.setLastAlbumArtUrl('https://img');
    expect(manager.getLastAlbumArtUrl()).toBe('https://img');
  });
});
