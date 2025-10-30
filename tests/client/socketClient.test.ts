import { describe, expect, it } from 'bun:test';
import type { PlayerState } from '@shared/types/index.ts';
import { createMockFn } from '../utils/testMocks.js';

describe('SocketClient', () => {
  const createSocket = () => {
    const listeners = new Map<string, Array<(payload: any) => void>>();
    const socket = {
      connected: false,
      on: createMockFn((event: string, handler: (payload: any) => void) => {
        const handlers = listeners.get(event) ?? [];
        handlers.push(handler);
        listeners.set(event, handlers);
        return socket;
      }),
      emit(event: string, payload?: any) {
        (listeners.get(event) ?? []).forEach((handler) => handler(payload));
      },
    };
    return { socket, listeners };
  };

  const loadClient = async () => {
    const module = await import(`@client/socket/socketClient.ts?test=${Date.now()}`);
    return module.SocketClient;
  };

  it('invokes connect and disconnect callbacks', async () => {
    const { socket, listeners } = createSocket();
    (globalThis as any).__YTM_SOCKET_FACTORY__ = () => socket as any;
    const SocketClient = await loadClient();
    const client = new SocketClient();
    const onConnect = createMockFn();
    const onDisconnect = createMockFn();

    client.onConnect(onConnect);
    client.onDisconnect(onDisconnect);

    socket.connected = true;
    socket.emit('connect');
    expect(onConnect.mock.calls.length).toBe(1);
    expect(client.isConnected()).toBeTrue();

    socket.connected = false;
    socket.emit('disconnect');
    expect(onDisconnect.mock.calls.length).toBe(1);

    delete (globalThis as any).__YTM_SOCKET_FACTORY__;
  });

  it('delivers state updates', async () => {
    const { socket } = createSocket();
    (globalThis as any).__YTM_SOCKET_FACTORY__ = () => socket as any;
    const SocketClient = await loadClient();
    const client = new SocketClient();
    const onState = createMockFn();
    client.onStateUpdate(onState);

    const state = { player: { trackState: 1, videoProgress: 0, volume: 50, muted: false, adPlaying: false, likeStatus: 'INDIFFERENT' }, video: { author: 'a', channelId: 'c', title: 't', album: null, albumId: null, likeCount: null, dislikeCount: null, isLive: false, id: 'id1234567890', thumbnails: [], durationSeconds: 10 } } as PlayerState;

    socket.emit('state-update', state);
    expect(onState.mock.calls[0]).toEqual([state]);

    delete (globalThis as any).__YTM_SOCKET_FACTORY__;
  });
});
