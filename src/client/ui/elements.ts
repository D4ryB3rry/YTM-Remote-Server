/**
 * DOM element references
 */

export const elements = {
  // Status
  statusIndicator: document.getElementById('statusIndicator') as HTMLElement,
  statusText: document.getElementById('statusText') as HTMLElement,

  // Album Art
  albumArtPlaceholder: document.getElementById('albumArtPlaceholder') as HTMLElement,
  albumArt: document.getElementById('albumArt') as HTMLImageElement,

  // Track Info
  trackTitle: document.getElementById('trackTitle') as HTMLElement,
  trackArtist: document.getElementById('trackArtist') as HTMLElement,
  trackAlbum: document.getElementById('trackAlbum') as HTMLElement,
  mediaTypeBadge: document.getElementById('mediaTypeBadge') as HTMLElement,

  // Progress
  progressFill: document.getElementById('progressFill') as HTMLElement,
  progressSlider: document.getElementById('progressSlider') as HTMLInputElement,
  currentTime: document.getElementById('currentTime') as HTMLElement,
  totalTime: document.getElementById('totalTime') as HTMLElement,

  // Playback Controls
  playPauseBtn: document.getElementById('playPauseBtn') as HTMLButtonElement,
  playIcon: document.getElementById('playIcon') as HTMLElement,
  pauseIcon: document.getElementById('pauseIcon') as HTMLElement,
  prevBtn: document.getElementById('prevBtn') as HTMLButtonElement,
  nextBtn: document.getElementById('nextBtn') as HTMLButtonElement,
  shuffleBtn: document.getElementById('shuffleBtn') as HTMLButtonElement,
  repeatBtn: document.getElementById('repeatBtn') as HTMLButtonElement,
  thumbsUpBtn: document.getElementById('thumbsUpBtn') as HTMLButtonElement,
  thumbsDownBtn: document.getElementById('thumbsDownBtn') as HTMLButtonElement,

  // Lyrics
  lyricsBtn: document.getElementById('lyricsBtn') as HTMLButtonElement,
  lyricsPanel: document.getElementById('lyricsPanel') as HTMLElement,
  lyricsCloseBtn: document.getElementById('lyricsCloseBtn') as HTMLButtonElement,
  lyricsContent: document.getElementById('lyricsContent') as HTMLElement,
  lyricsStatus: document.getElementById('lyricsStatus') as HTMLElement,

  // Volume
  volumeBtn: document.getElementById('volumeBtn') as HTMLButtonElement,
  volumeIcon: document.getElementById('volumeIcon') as HTMLElement,
  muteIcon: document.getElementById('muteIcon') as HTMLElement,
  volumeSlider: document.getElementById('volumeSlider') as HTMLInputElement,
  volumeValue: document.getElementById('volumeValue') as HTMLElement,

  // Direct Playback
  urlInput: document.getElementById('urlInput') as HTMLInputElement,
  playUrlBtn: document.getElementById('playUrlBtn') as HTMLButtonElement,

  // Playlists
  playlistList: document.getElementById('playlistList') as HTMLElement,
  refreshPlaylistsBtn: document.getElementById('refreshPlaylistsBtn') as HTMLButtonElement,

  // Queue
  queueList: document.getElementById('queueList') as HTMLElement,
  queueStats: document.getElementById('queueStats') as HTMLElement,
};
