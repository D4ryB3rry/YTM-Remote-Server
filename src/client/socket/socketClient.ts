/**
 * Socket.IO client connection
 */

import { io, Socket } from 'socket.io-client';
import type { PlayerState } from '@shared/types/index.js';

export class SocketClient {
  private socket: Socket;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;
  private onStateUpdateCallback?: (state: PlayerState) => void;

  constructor() {
    this.socket = io();
    this.setupListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.onConnectCallback?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.onDisconnectCallback?.();
    });

    this.socket.on('state-update', (state: PlayerState) => {
      console.log('State update received:', state);
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
