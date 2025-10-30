/**
 * Shared types for YTM Remote Server
 */

export interface PlayerState {
  player: {
    trackState: 0 | 1 | 2; // 0 = paused, 1 = playing, 2 = buffering
    videoProgress: number;
    volume: number;
    muted: boolean;
    adPlaying: boolean;
    likeStatus: 'LIKE' | 'DISLIKE' | 'INDIFFERENT';
    queue?: {
      items: QueueItem[];
      selectedItemIndex?: number;
      repeatMode?: number; // 0 = None, 1 = All, 2 = One, -1 = Unknown
    };
    queueAutoplay?: boolean;
    queueAutoplayMode?: string;
  };
  video: {
    author: string;
    channelId: string;
    title: string;
    album: string | null;
    albumId: string | null;
    likeCount: number | null;
    dislikeCount: number | null;
    likeStatus?: 'LIKE' | 'DISLIKE' | 'INDIFFERENT';
    isLive: boolean;
    id: string;
    thumbnails: Thumbnail[];
    durationSeconds: number;
    videoType?: -1 | 0 | 1 | 2 | 3; // -1 = Unknown, 0 = Audio, 1 = Video, 2 = Uploaded, 3 = Podcast
  };
}

export interface QueueItem {
  index?: number;
  selected?: boolean;
  videoId?: string;
  title?: string;
  author?: string;
  duration?: string;
  thumbnails?: Thumbnail[];
}

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface Playlist {
  id: string;
  title: string;
  thumbnails: Thumbnail[];
  author: string;
  videoCount: number;
}

export interface AppInfo {
  name: string;
  version: string;
}

export interface AuthRequest {
  appId: string;
  appName: string;
  appVersion: string;
}

export interface AuthCodeResponse {
  code: string;
}

export interface AuthTokenResponse {
  token: string;
}

export interface CommandRequest {
  command: string;
  data?: unknown;
}

export interface StatusResponse {
  connected: boolean;
  hasState: boolean;
}

export interface CommandResponse {
  success: boolean;
}

export interface ErrorResponse {
  error: string;
}

export interface SyncedLyricLine {
  time: number;
  text: string;
}

export interface LyricsResponse {
  lyrics: string;
  synced?: SyncedLyricLine[];
  hasSynced: boolean;
  source: string;
}

export interface LyricsErrorResponse {
  error: string;
  message: string;
}
