import type { TranslationDictionary } from '../types.js';

export const en: TranslationDictionary = {
  app: {
    title: 'YTM Remote Control',
  },
  status: {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  nowPlaying: {
    noTrack: 'No track is playing',
  },
  mediaType: {
    live: 'LIVE',
    podcast: 'PODCAST',
    video: 'VIDEO',
    song: 'SONG',
    upload: 'UPLOAD',
  },
  controls: {
    shuffleTooltip: 'Shuffle',
    prevTooltip: 'Previous track',
    playTooltip: 'Play/Pause',
    nextTooltip: 'Next track',
    repeatTooltip: 'Repeat mode',
    likeTooltip: 'Like',
    dislikeTooltip: 'Dislike',
    lyricsTooltip: 'Show lyrics',
    volumeTooltip: 'Mute',
    directPlayTitle: 'Play directly',
    playUrlPlaceholder: 'Enter a YouTube Music URL or video ID',
    playUrlButtonTitle: 'Play',
  },
  playlists: {
    sectionTitle: 'Playlists',
    refreshTooltip: 'Refresh',
    loading: 'Loading playlists...',
    noneFound: 'No playlists found',
    loadError: 'Unable to load playlists',
    cachedIndicator: '(Cached)',
    songCount: '{{count}} songs',
  },
  queue: {
    sectionTitle: 'Queue',
    empty: 'No tracks in the queue',
    count: '{{count}} songs',
    unknownTrack: 'Unknown track',
    unknownArtist: 'Unknown artist',
    coverAlt: 'Cover art',
  },
  lyrics: {
    panelTitle: 'Lyrics',
    loading: 'Loading lyrics...',
    alertNoSong: 'No track is playing',
    noTrackInfo: 'Track information is unavailable',
    noLyricsFound: 'No lyrics found',
    unavailable: 'Lyrics are available directly in YouTube Music.',
    openInYouTubeMusic: '📱 Open in YouTube Music',
    syncedStatus: '♪ Synced Lyrics · {{source}}',
    unsyncedStatus: 'Lyrics · {{source}}',
  },
};
