/**
 * Socket.IO management for web clients and YTMDesktop connection
 */

import { Server as SocketIOServer } from 'socket.io';
import { io as SocketIOClient, Socket as ClientSocket } from 'socket.io-client';
import type { Server as HTTPServer } from 'http';
import { config } from '../config.js';
import type { AuthManager } from '../auth/authManager.js';
import type { LyricsFetcher } from '../lyrics/lyricsFetcher.js';
import type { PlayerState } from '@shared/types/index.js';

export class SocketManager {
  private io: SocketIOServer;
  private ytmSocket: ClientSocket | null = null;
  private currentState: PlayerState | null = null;
  private lastBroadcastState: PlayerState | null = null;
  private lastBroadcastAt = 0;
  private readonly progressBroadcastIntervalMs: number;
  private lastPrefetchedTrackKey: string | null = null;

  constructor(
    httpServer: HTTPServer,
    private authManager: AuthManager,
    private lyricsFetcher: LyricsFetcher
  ) {
    // Initialize Socket.IO server for web clients
    this.io = new SocketIOServer(httpServer, {
      cors: config.cors,
    });

    this.progressBroadcastIntervalMs =
      config.ytmDesktop.progressBroadcastIntervalMs ?? 100;

    this.setupWebClientHandlers();
  }

  /**
   * Setup handlers for web client connections
   */
  private setupWebClientHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('Web client connected:', socket.id);

      // Send current state to newly connected client
      if (this.currentState) {
        socket.emit('state-update', this.currentState);
      }

      socket.on('disconnect', () => {
        console.log('Web client disconnected:', socket.id);
      });
    });
  }

  /**
   * Connect to YTMDesktop Socket.IO
   */
  connectToYTMDesktop(): void {
    if (this.ytmSocket) {
      this.ytmSocket.close();
    }

    const token = this.authManager.getToken();
    if (!token) {
      console.log('No auth token available for Socket.IO connection');
      return;
    }

    // Use IPv4 address as per documentation
    this.ytmSocket = SocketIOClient(config.ytmDesktop.socketUrl, {
      transports: ['websocket'],
      auth: {
        token: token,
      },
    });

    this.ytmSocket.on('connect', () => {
      console.log('✓ Connected to YTMDesktop Socket.IO');
    });

    this.ytmSocket.on('state-update', (state: PlayerState) => {
      this.currentState = state;
      this.handleLyricsPrefetch(state);
      const now = Date.now();
      if (this.shouldBroadcastImmediately(state)) {
        this.emitStateUpdate(state, now);
        return;
      }

      if (now - this.lastBroadcastAt >= this.progressBroadcastIntervalMs) {
        this.emitStateUpdate(state, now);
      }
    });

    this.ytmSocket.on('disconnect', () => {
      console.log('Disconnected from YTMDesktop Socket.IO');
    });

    this.ytmSocket.on('connect_error', (error) => {
      console.error('YTMDesktop Socket.IO connection error:', error);
      if (error.message.includes('401')) {
        console.log('⚠️  Auth token invalid for Socket.IO connection');
        this.authManager.clearToken();
        this.authManager.deleteToken();
      }
    });
  }

  private handleLyricsPrefetch(state: PlayerState): void {
    const artist = state.video?.author;
    const title = state.video?.title;

    if (!artist || !title) {
      return;
    }

    const trackKey = this.getTrackKey(artist, title);
    if (this.lastPrefetchedTrackKey === trackKey) {
      return;
    }

    this.lastPrefetchedTrackKey = trackKey;
    const expectedKey = trackKey;

    setImmediate(() => {
      if (this.lastPrefetchedTrackKey !== expectedKey) {
        return;
      }

      this.lyricsFetcher.prefetch(artist, title);
    });
  }

  private getTrackKey(artist: string, title: string): string {
    return `${artist.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
  }

  /**
   * Disconnect from YTMDesktop
   */
  disconnectFromYTMDesktop(): void {
    if (this.ytmSocket) {
      this.ytmSocket.close();
      this.ytmSocket = null;
    }
  }

  /**
   * Get current player state
   */
  getCurrentState(): PlayerState | null {
    return this.currentState;
  }

  /**
   * Check if connected to YTMDesktop
   */
  isConnectedToYTM(): boolean {
    return this.ytmSocket?.connected ?? false;
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  private shouldBroadcastImmediately(state: PlayerState): boolean {
    const previous = this.lastBroadcastState;
    if (!previous) {
      return true;
    }

    if (previous.player.trackState !== state.player.trackState) {
      return true;
    }

    if (previous.video.id !== state.video.id) {
      return true;
    }

    if (this.hasQueueMetadataChanged(previous, state)) {
      return true;
    }

    return false;
  }

  private hasQueueMetadataChanged(
    previous: PlayerState,
    current: PlayerState
  ): boolean {
    const prevQueue = previous.player.queue;
    const currQueue = current.player.queue;

    if (!prevQueue && !currQueue) {
      return false;
    }

    if (!prevQueue || !currQueue) {
      return true;
    }

    const prevLength = prevQueue.items?.length ?? 0;
    const currLength = currQueue.items?.length ?? 0;

    if (prevLength !== currLength) {
      return true;
    }

    const prevSelectedIndex = prevQueue.selectedItemIndex ?? -1;
    const currSelectedIndex = currQueue.selectedItemIndex ?? -1;

    if (prevSelectedIndex !== currSelectedIndex) {
      return true;
    }

    const prevSelectedId =
      prevSelectedIndex >= 0
        ? prevQueue.items?.[prevSelectedIndex]?.videoId ?? null
        : null;
    const currSelectedId =
      currSelectedIndex >= 0
        ? currQueue.items?.[currSelectedIndex]?.videoId ?? null
        : null;

    if (prevSelectedId !== currSelectedId) {
      return true;
    }

    const prevRepeatMode = prevQueue.repeatMode ?? -1;
    const currRepeatMode = currQueue.repeatMode ?? -1;

    if (prevRepeatMode !== currRepeatMode) {
      return true;
    }

    const prevAutoplay = previous.player.queueAutoplay ?? false;
    const currAutoplay = current.player.queueAutoplay ?? false;

    if (prevAutoplay !== currAutoplay) {
      return true;
    }

    const prevAutoplayMode = previous.player.queueAutoplayMode ?? '';
    const currAutoplayMode = current.player.queueAutoplayMode ?? '';

    if (prevAutoplayMode !== currAutoplayMode) {
      return true;
    }

    return false;
  }

  private emitStateUpdate(state: PlayerState, timestamp: number): void {
    this.lastBroadcastState = state;
    this.lastBroadcastAt = timestamp;
    this.io.emit('state-update', state);
  }
}
