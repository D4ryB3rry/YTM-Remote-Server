/**
 * YTM Remote Server - Main Entry Point
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config.js';
import { AuthManager } from './auth/authManager.js';
import { YTMClient } from './api/ytmClient.js';
import { SocketManager } from './socket/socketManager.js';
import { setupRoutes } from './routes.js';
import { LyricsFetcher } from './lyrics/lyricsFetcher.js';
import { createInitializeAuth } from './auth/initializeAuth.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(config.paths.publicDir));

// Initialize components
const authManager = new AuthManager();
const ytmClient = new YTMClient(authManager);
const lyricsFetcher = new LyricsFetcher();
const socketManager = new SocketManager(httpServer, authManager, lyricsFetcher);

/**
 * Initialize authentication on startup
 */
export const initializeAuth = createInitializeAuth({
  authManager,
  ytmClient,
  socketManager,
});

// Setup API routes
setupRoutes(app, ytmClient, authManager, socketManager, initializeAuth, lyricsFetcher);

// Start server
httpServer.listen(config.port, async () => {
  console.log(`\n🚀 Server running on http://localhost:${config.port}`);
  await initializeAuth();
});
