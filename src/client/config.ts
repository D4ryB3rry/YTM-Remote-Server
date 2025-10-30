/**
 * Client configuration
 */

export const config = {
  api: {
    baseUrl: '',
    endpoints: {
      status: '/api/status',
      state: '/api/state',
      playlists: '/api/playlists',
      command: '/api/command',
      reauth: '/api/reauth',
    },
  },

  ui: {
    progressUpdateInterval: 1000, // ms
    lyricsUpdateInterval: 100, // ms
  },
} as const;
