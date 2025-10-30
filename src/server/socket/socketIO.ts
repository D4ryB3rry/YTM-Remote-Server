/**
 * Socket.IO exports consolidated for easier testing and mocking.
 */

export { Server as SocketIOServer } from 'socket.io';
export { io as SocketIOClient } from 'socket.io-client';
export type { Socket as ClientSocket } from 'socket.io-client';
