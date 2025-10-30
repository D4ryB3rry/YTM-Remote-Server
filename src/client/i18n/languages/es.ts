import type { TranslationDictionary } from '../types.js';

export const es: TranslationDictionary = {
  app: {
    title: 'YTM Remote Control',
  },
  status: {
    connecting: 'Conectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado',
  },
  nowPlaying: {
    noTrack: 'No hay ninguna pista en reproducción',
  },
  mediaType: {
    live: 'EN VIVO',
    podcast: 'PODCAST',
    video: 'VIDEO',
    song: 'CANCIÓN',
    upload: 'SUBIDO',
  },
  controls: {
    shuffleTooltip: 'Aleatorio',
    prevTooltip: 'Pista anterior',
    playTooltip: 'Reproducir/Pausar',
    nextTooltip: 'Pista siguiente',
    repeatTooltip: 'Modo de repetición',
    likeTooltip: 'Me gusta',
    dislikeTooltip: 'No me gusta',
    lyricsTooltip: 'Mostrar letra',
    volumeTooltip: 'Silenciar',
    directPlayTitle: 'Reproducción directa',
    playUrlPlaceholder: 'Introduce una URL de YouTube Music o ID de video',
    playUrlButtonTitle: 'Reproducir',
  },
  playlists: {
    sectionTitle: 'Listas de reproducción',
    refreshTooltip: 'Actualizar',
    loading: 'Cargando listas de reproducción...',
    noneFound: 'No se encontraron listas de reproducción',
    loadError: 'No se pudieron cargar las listas de reproducción',
    cachedIndicator: '(En caché)',
    songCount: '{{count}} canciones',
  },
  queue: {
    sectionTitle: 'Cola',
    empty: 'No hay pistas en la cola',
    count: '{{count}} canciones',
    unknownTrack: 'Pista desconocida',
    unknownArtist: 'Artista desconocido',
    coverAlt: 'Portada',
  },
  lyrics: {
    panelTitle: 'Letras',
    loading: 'Cargando letras...',
    alertNoSong: 'No hay ninguna pista en reproducción',
    noTrackInfo: 'La información de la pista no está disponible',
    noLyricsFound: 'No se encontraron letras',
    unavailable: 'Las letras están disponibles directamente en YouTube Music.',
    openInYouTubeMusic: '📱 Abrir en YouTube Music',
    syncedStatus: '♪ Letras sincronizadas · {{source}}',
    unsyncedStatus: 'Letras · {{source}}',
  },
};
