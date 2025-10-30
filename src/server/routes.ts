/**
 * Express API routes
 */

import type { Express, Request, Response } from 'express';
import { URL } from 'url';
import type { YTMClient } from './api/ytmClient.js';
import type { AuthManager } from './auth/authManager.js';
import type { SocketManager } from './socket/socketManager.js';
import type { CommandRequest } from '@shared/types/index.js';
import type { LyricsFetcher } from './lyrics/lyricsFetcher.js';
import { PlaylistCache } from './cache/playlistCache.js';
import { ImageCache } from './cache/imageCache.js';

// Initialize singletons
const playlistCache = PlaylistCache.getInstance();
const imageCache = new ImageCache();

export function setupRoutes(
  app: Express,
  ytmClient: YTMClient,
  authManager: AuthManager,
  socketManager: SocketManager,
  initializeAuth: () => Promise<void>,
  lyricsFetcher: LyricsFetcher
): void {
  /**
   * GET /api/status
   * Check server connection status
   */
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      connected: authManager.isAuthenticated(),
      hasState: socketManager.getCurrentState() !== null,
    });
  });

  /**
   * GET /api/proxy/image
   * Proxy image requests through the backend to avoid mixed content/CORS issues
   */
  app.get('/api/proxy/image', async (req: Request, res: Response) => {
    const rawUrl = req.query.url;
    const targetUrl = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

    if (typeof targetUrl !== 'string' || targetUrl.trim().length === 0) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid url parameter' });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Unsupported protocol' });
    }

    try {
      const cachedImage = await imageCache.get(targetUrl);

      if (cachedImage) {
        res.setHeader('Content-Type', cachedImage.contentType);
        res.setHeader(
          'Cache-Control',
          cachedImage.cacheControl || 'public, max-age=86400'
        );
        return res.send(cachedImage.buffer);
      }

      const upstreamResponse = await fetch(parsedUrl);

      if (!upstreamResponse.ok || !upstreamResponse.body) {
        return res
          .status(upstreamResponse.status || 502)
          .json({ error: 'Failed to fetch image' });
      }

      const contentType =
        upstreamResponse.headers.get('content-type') || 'application/octet-stream';
      const cacheControlHeader = upstreamResponse.headers.get('cache-control');
      const cacheControl = cacheControlHeader || 'public, max-age=86400';

      const buffer = Buffer.from(await upstreamResponse.arrayBuffer());

      await imageCache.set(targetUrl, buffer, contentType, cacheControl);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', cacheControl);

      res.send(buffer);
    } catch (error) {
      console.error('[Proxy] Error fetching image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/state
   * Get current player state
   */
  app.get('/api/state', async (req: Request, res: Response) => {
    if (!authManager.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated with YTMDesktop' });
    }

    const state = await ytmClient.getPlayerState();
    res.json(state || {});
  });

  /**
   * GET /api/playlists
   * Get user playlists (with caching for rate limit handling)
   */
  app.get('/api/playlists', async (req: Request, res: Response) => {
    console.log('[Route] GET /api/playlists requested');

    if (!authManager.isAuthenticated()) {
      console.log('[Route] Not authenticated, returning 401');
      return res.status(401).json({ error: 'Not authenticated with YTMDesktop' });
    }

    console.log('[Route] Calling ytmClient.getPlaylists()...');
    const playlists = await ytmClient.getPlaylists();

    if (playlists === null) {
      console.log('[Route] API returned null, checking cache...');

      // Try to use cached playlists
      const cachedPlaylists = playlistCache.get();
      if (cachedPlaylists) {
        console.log(
          `[Route] Returning ${cachedPlaylists.length} cached playlists (fallback)`
        );
        return res.json(cachedPlaylists);
      }

      console.log('[Route] No cache available, returning 500');
      return res.status(500).json({ error: 'Failed to get playlists' });
    }

    // Cache successful result
    playlistCache.set(playlists);

    console.log('[Route] Returning', playlists.length, 'playlists (fresh)');
    res.json(playlists);
  });

  /**
   * POST /api/command
   * Send command to YTMDesktop
   */
  app.post('/api/command', async (req: Request, res: Response) => {
    const { command, data } = req.body as CommandRequest;
    const success = await ytmClient.sendCommand(command, data);
    res.json({ success });
  });

  /**
   * POST /api/reauth
   * Force re-authentication
   */
  app.post('/api/reauth', async (req: Request, res: Response) => {
    console.log('Re-authentication requested...');
    authManager.clearToken();
    await authManager.deleteToken();
    socketManager.disconnectFromYTMDesktop();
    await initializeAuth();
    res.json({ success: authManager.isAuthenticated() });
  });

  /**
   * GET /api/lyrics
   * Get lyrics for a song (with file cache)
   */
  app.get('/api/lyrics', async (req: Request, res: Response) => {
    const { artist, title } = req.query;

    if (!artist || !title) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Please provide both artist and title',
      });
    }

    console.log(`[Lyrics] Fetching lyrics for: ${artist} - ${title}`);

    try {
      const result = await lyricsFetcher.fetch(artist as string, title as string);

      if (!result) {
        return res.status(404).json({
          error: 'Lyrics not found',
          message: 'No lyrics found for this song',
        });
      }

      console.log(`[Lyrics] Successfully fetched from ${result.source}`);
      res.json(result);
    } catch (error) {
      console.error('[Lyrics] Error:', error);
      res.status(500).json({
        error: 'Failed to fetch lyrics',
        message: 'Error loading lyrics',
      });
    }
  });
}
