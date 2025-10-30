/**
 * YTM Remote Client - Main Entry Point
 */

import { StateManager } from './state/stateManager.js';
import { ApiClient } from './api/apiClient.js';
import { SocketClient } from './socket/socketClient.js';
import { StatusUI } from './ui/status.js';
import { ControlsUI } from './ui/controls.js';
import { ProgressUI } from './ui/progress.js';
import { VolumeUI } from './ui/volume.js';
import { QueueUI } from './ui/queue.js';
import { PlaylistUI } from './ui/playlist.js';
import { LyricsUI } from './ui/lyrics.js';

// Initialize state and API
const stateManager = new StateManager();
const apiClient = new ApiClient();

// Initialize Socket.IO
const socketClient = new SocketClient();

// Initialize UI components
const statusUI = new StatusUI();
const controlsUI = new ControlsUI(stateManager, apiClient);
const progressUI = new ProgressUI(stateManager, apiClient);
const volumeUI = new VolumeUI(apiClient);
const queueUI = new QueueUI(apiClient);
const playlistUI = new PlaylistUI(apiClient);
const lyricsUI = new LyricsUI(stateManager, apiClient);

/**
 * Update all UI components with new state
 */
function updateUI(state: ReturnType<StateManager['getState']>): void {
  if (!state || !state.player) return;

  const { player, video } = state;

  // Update track info
  controlsUI.updateTrackInfo(video?.title || '', video?.author || '', video?.album || '');

  // Update media type badge
  controlsUI.updateMediaTypeBadge(video?.isLive || false, video?.videoType);

  // Update album art
  controlsUI.updateAlbumArt(video?.thumbnails);

  // Update progress
  const current = player.videoProgress || 0;
  const total = video?.durationSeconds || 0;
  progressUI.update(current, total);

  // Update play/pause button (trackState: 0=Paused, 1=Playing, 2=Buffering)
  const isPlaying = player.trackState === 1;
  controlsUI.updatePlayPauseButton(!isPlaying);

  // Update repeat button
  controlsUI.updateRepeatButton(player.queue?.repeatMode);

  // Update like buttons
  console.log('[Main] video.likeStatus:', video?.likeStatus);
  controlsUI.updateLikeButtons(video?.likeStatus);

  // Update volume
  if (player.volume !== undefined) {
    volumeUI.update(player.volume);
  }

  // Update queue
  queueUI.update(player.queue);

  // Start/stop progress updates
  if (isPlaying) {
    progressUI.startUpdates();
  } else {
    progressUI.stopUpdates();
  }
}

// Setup socket event handlers
socketClient.onConnect(() => {
  stateManager.setConnected(true);
  statusUI.update(true);
  playlistUI.load();
});

socketClient.onDisconnect(() => {
  stateManager.setConnected(false);
  statusUI.update(false);
  progressUI.stopUpdates();
});

socketClient.onStateUpdate((state) => {
  stateManager.setState(state);
  updateUI(state);
});

// Initialize status display
statusUI.update(stateManager.isClientConnected());

console.log('YTM Remote Client initialized');
