/**
 * Socket.IO management for web clients and YTMDesktop connection
 */

import { Server as SocketIOServer } from 'socket.io';
import { io as SocketIOClient, Socket as ClientSocket } from 'socket.io-client';
import type { Server as HTTPServer } from 'http';
import { config } from '../config.js';
import type { AuthManager } from '../auth/authManager.js';
import type { PlayerState } from '@shared/types/index.js';

export class SocketManager {
  private io: SocketIOServer;
  private ytmSocket: ClientSocket | null = null;
  private currentState: PlayerState | null = null;

  constructor(
    httpServer: HTTPServer,
    private authManager: AuthManager
  ) {
    // Initialize Socket.IO server for web clients
    this.io = new SocketIOServer(httpServer, {
      cors: config.cors,
    });

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
      // Broadcast to all connected web clients
      this.io.emit('state-update', state);
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
}
