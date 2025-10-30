import type { TranslationDictionary } from '../types.js';

export const de: TranslationDictionary = {
  app: {
    title: 'YTM Remote Control',
  },
  status: {
    connecting: 'Verbindung wird hergestellt...',
    connected: 'Verbunden',
    disconnected: 'Nicht verbunden',
  },
  nowPlaying: {
    noTrack: 'Kein Titel wird abgespielt',
  },
  mediaType: {
    live: 'LIVE',
    podcast: 'PODCAST',
    video: 'VIDEO',
    song: 'LIED',
    upload: 'UPLOAD',
  },
  controls: {
    shuffleTooltip: 'Zufallswiedergabe',
    prevTooltip: 'Vorheriger Titel',
    playTooltip: 'Play/Pause',
    nextTooltip: 'Nächster Titel',
    repeatTooltip: 'Wiederholmodus',
    likeTooltip: 'Gefällt mir',
    dislikeTooltip: 'Gefällt mir nicht',
    lyricsTooltip: 'Songtext anzeigen',
    volumeTooltip: 'Stummschalten',
    directPlayTitle: 'Direkt abspielen',
    playUrlPlaceholder: 'YouTube Music URL oder Video-ID eingeben',
    playUrlButtonTitle: 'Abspielen',
  },
  playlists: {
    sectionTitle: 'Playlists',
    refreshTooltip: 'Aktualisieren',
    loading: 'Playlists werden geladen...',
    noneFound: 'Keine Playlists gefunden',
    loadError: 'Playlists konnten nicht geladen werden',
    cachedIndicator: '(Aus Cache)',
    songCount: '{{count}} Titel',
  },
  queue: {
    sectionTitle: 'Warteschlange',
    empty: 'Keine Titel in der Warteschlange',
    count: '{{count}} Titel',
    unknownTrack: 'Unbekannter Titel',
    unknownArtist: 'Unbekannter Künstler',
    coverAlt: 'Cover',
  },
  lyrics: {
    panelTitle: 'Songtexte',
    loading: 'Songtexte werden geladen...',
    alertNoSong: 'Kein Titel wird abgespielt',
    noTrackInfo: 'Titelinformationen sind nicht verfügbar',
    noLyricsFound: 'Keine Songtexte gefunden',
    unavailable: 'Songtexte sind direkt in YouTube Music verfügbar.',
    openInYouTubeMusic: '📱 In YouTube Music öffnen',
    syncedStatus: '♪ Synchrone Songtexte · {{source}}',
    unsyncedStatus: 'Songtexte · {{source}}',
  },
};
