/* eslint-disable @typescript-eslint/no-var-requires */
import type { Socket } from '../../../node_modules/socket.io-client/build/esm/socket.js';

type SocketFactory = () => Socket;

declare function require(name: string): any;
declare const globalThis: { __YTM_SOCKET_FACTORY__?: SocketFactory } & typeof global;

type RealIo = (...args: unknown[]) => Socket;

let realIo: RealIo | null = null;

if (typeof require === 'function') {
  try {
    realIo = require('socket.io-client').io as typeof realIo;
  } catch {
    try {
      realIo = require('../../../node_modules/socket.io-client/build/esm/index.js').io as typeof realIo;
    } catch {
      realIo = null;
    }
  }
}

export const io = (...args: Parameters<RealIo>): Socket => {
  if (typeof globalThis.__YTM_SOCKET_FACTORY__ === 'function') {
    return globalThis.__YTM_SOCKET_FACTORY__();
  }
  if (!realIo) {
    throw new Error('socket.io-client module unavailable');
  }
  return realIo(...args);
};

export type { Socket };
