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
async function initializeAuth(): Promise<void> {
  console.log('='.repeat(50));
  console.log('🎵 YTM Remote Server starting...');
  console.log('='.repeat(50));

  // Try to load saved auth token
  const savedToken = await authManager.loadToken();
  if (savedToken) {
    console.log('Attempting to use saved auth token...');

    // Test if the saved token still works
    const state = await ytmClient.getPlayerState();
    if (state) {
      console.log('✓ Saved auth token is valid!');
      socketManager.connectToYTMDesktop();
      console.log('='.repeat(50));
      return;
    } else {
      console.log('⚠️  Saved auth token is invalid or expired');
      authManager.clearToken();
    }
  }

  // No valid saved token, need to authenticate
  const success = await ytmClient.authenticate();
  if (success) {
    socketManager.connectToYTMDesktop();
  }
  console.log('='.repeat(50));
}

// Setup API routes
setupRoutes(app, ytmClient, authManager, socketManager, initializeAuth, lyricsFetcher);

// Start server
httpServer.listen(config.port, async () => {
  console.log(`\n🚀 Server running on http://localhost:${config.port}`);
  await initializeAuth();
});
