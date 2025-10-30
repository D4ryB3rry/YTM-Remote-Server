/**
 * Socket.IO client connection
 */

import { io, Socket } from 'socket.io-client';
import { debugLog } from '../utils/logger.js';
import type { PlayerState } from '@shared/types/index.js';

type SocketFactory = () => Socket;

const createSocket = (): Socket => {
  const globalFactory = (globalThis as { __YTM_SOCKET_FACTORY__?: SocketFactory }).__YTM_SOCKET_FACTORY__;
  if (globalFactory) {
    return globalFactory();
  }
  return io();
};

export class SocketClient {
  private socket: Socket;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;
  private onStateUpdateCallback?: (state: PlayerState) => void;

  constructor() {
    this.socket = createSocket();
    this.setupListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    this.socket.on('connect', () => {
      debugLog('Connected to server');
      this.onConnectCallback?.();
    });

    this.socket.on('disconnect', () => {
      debugLog('Disconnected from server');
      this.onDisconnectCallback?.();
    });

    this.socket.on('state-update', (state: PlayerState) => {
      debugLog('State update received:', state);
      this.onStateUpdateCallback?.(state);
    });
  }

  /**
   * Set connect callback
   */
  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  /**
   * Set disconnect callback
   */
  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  /**
   * Set state update callback
   */
  onStateUpdate(callback: (state: PlayerState) => void): void {
    this.onStateUpdateCallback = callback;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket.connected;
  }
}
