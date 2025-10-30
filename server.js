import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketIOClient } from 'socket.io-client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// YTMDesktop API Configuration
const YTMDESKTOP_HOST = 'localhost';
const YTMDESKTOP_PORT = 9863;
const YTMDESKTOP_BASE_URL = `http://${YTMDESKTOP_HOST}:${YTMDESKTOP_PORT}`;
const AUTH_TOKEN_FILE = path.join(__dirname, 'authToken.txt');

// Store authentication token
let authToken = null;
let ytmDesktopSocket = null;
let currentState = null;

// ============================================
// AUTH TOKEN PERSISTENCE FUNCTIONS
// ============================================

/**
 * Load auth token from authToken.txt file
 */
async function loadAuthToken() {
  try {
    if (existsSync(AUTH_TOKEN_FILE)) {
      const token = await readFile(AUTH_TOKEN_FILE, 'utf-8');
      const trimmedToken = token.trim();
      if (trimmedToken) {
        console.log('✓ Auth token loaded from authToken.txt');
        return trimmedToken;
      }
    }
  } catch (error) {
    console.error('Error loading auth token:', error);
  }
  return null;
}

/**
 * Save auth token to authToken.txt file
 */
async function saveAuthToken(token) {
  try {
    await writeFile(AUTH_TOKEN_FILE, token, 'utf-8');
    console.log('✓ Auth token saved to authToken.txt');
    return true;
  } catch (error) {
    console.error('Error saving auth token:', error);
    return false;
  }
}

/**
 * Delete auth token file
 */
async function deleteAuthToken() {
  try {
    if (existsSync(AUTH_TOKEN_FILE)) {
      await unlink(AUTH_TOKEN_FILE);
      console.log('✓ Auth token deleted');
    }
  } catch (error) {
    console.error('Error deleting auth token:', error);
  }
}

// ============================================
// YTMDesktop API Helper Functions
// ============================================

async function getAppInfo() {
  try {
    const response = await fetch(`${YTMDESKTOP_BASE_URL}/query`);
    return await response.json();
  } catch (error) {
    console.error('Error getting app info:', error);
    return null;
  }
}

async function requestAuthCode() {
  try {
    const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/auth/requestcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'ytmremoteserver',
        appName: 'YTM Remote Server',
        appVersion: '1.0.0'
      })
    });
    const data = await response.json();
    return data.code;
  } catch (error) {
    console.error('Error requesting auth code:', error);
    return null;
  }
}

async function requestAuthToken(code) {
  try {
    const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/auth/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'ytmremoteserver',
        code: code
      })
    });
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error requesting auth token:', error);
    return null;
  }
}

async function getPlayerState() {
  if (!authToken) return null;
  try {
    const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/state`, {
      headers: { 'Authorization': authToken }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('⚠️  Auth token invalid or expired');
        authToken = null;
        await deleteAuthToken();
      }
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting player state:', error);
    return null;
  }
}

async function sendPlayerCommand(command, data = null) {
  if (!authToken) return false;
  try {
    const body = data !== null ? { command, data } : { command };
    console.log('Sending command to YTMDesktop:', body);
    const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/command`, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    console.log('Command response:', response.ok, response.status);
    
    if (!response.ok && response.status === 401) {
      console.log('⚠️  Auth token invalid or expired');
      authToken = null;
      await deleteAuthToken();
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error sending player command:', error);
    return false;
  }
}

function connectToYTMDesktop() {
  if (ytmDesktopSocket) {
    ytmDesktopSocket.close();
  }

  if (!authToken) {
    console.log('No auth token available for Socket.IO connection');
    return;
  }

  // Use IPv4 address as per documentation
  ytmDesktopSocket = SocketIOClient(`http://127.0.0.1:${YTMDESKTOP_PORT}/api/v1/realtime`, {
    transports: ['websocket'],
    auth: {
      token: authToken
    }
  });

  ytmDesktopSocket.on('connect', () => {
    console.log('✓ Connected to YTMDesktop Socket.IO');
  });

  ytmDesktopSocket.on('state-update', (state) => {
    currentState = state;
    // Broadcast to all connected web clients
    io.emit('state-update', state);
  });

  ytmDesktopSocket.on('disconnect', () => {
    console.log('Disconnected from YTMDesktop Socket.IO');
  });

  ytmDesktopSocket.on('connect_error', (error) => {
    console.error('YTMDesktop Socket.IO connection error:', error);
    if (error.message.includes('401')) {
      console.log('⚠️  Auth token invalid for Socket.IO connection');
      authToken = null;
      deleteAuthToken();
    }
  });
}

// Initialize authentication on startup
async function initialize() {
  console.log('='.repeat(50));
  console.log('🎵 YTM Remote Server starting...');
  console.log('='.repeat(50));
  
  // Try to load saved auth token
  const savedToken = await loadAuthToken();
  if (savedToken) {
    authToken = savedToken;
    console.log('Attempting to use saved auth token...');
    
    // Test if the saved token still works
    const state = await getPlayerState();
    if (state) {
      console.log('✓ Saved auth token is valid!');
      connectToYTMDesktop();
      console.log('='.repeat(50));
      return;
    } else {
      console.log('⚠️  Saved auth token is invalid or expired');
      authToken = null;
    }
  }
  
  // No valid saved token, need to authenticate
  console.log('Checking YTMDesktop connection...');
  const appInfo = await getAppInfo();
  
  if (!appInfo) {
    console.log('⚠️  YTMDesktop is not running or not accessible');
    console.log('Please start YouTube Music Desktop App and enable Remote Control in Settings > Integrations');
    console.log('='.repeat(50));
    return;
  }

  console.log('YTMDesktop detected, requesting authentication...');
  console.log('⚠️  Please check YouTube Music Desktop App and ACCEPT the authorization request!');
  
  const code = await requestAuthCode();
  if (!code) {
    console.log('Failed to get auth code');
    console.log('='.repeat(50));
    return;
  }

  const token = await requestAuthToken(code);
  if (!token) {
    console.log('Failed to get auth token (did you accept the request in the app?)');
    console.log('='.repeat(50));
    return;
  }

  authToken = token;
  await saveAuthToken(token); // Save token to file
  console.log('✓ Authentication successful!');
  connectToYTMDesktop();
  console.log('='.repeat(50));
}

// REST API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    connected: authToken !== null,
    hasState: currentState !== null
  });
});

app.get('/api/state', async (req, res) => {
  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated with YTMDesktop' });
  }
  const state = await getPlayerState();
  res.json(state || {});
});

app.get('/api/playlists', async (req, res) => {
  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated with YTMDesktop' });
  }
  
  try {
    const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/playlists`, {
      headers: { 'Authorization': authToken }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        authToken = null;
        await deleteAuthToken();
      }
      throw new Error('Failed to get playlists');
    }
    
    const playlists = await response.json();
    res.json(playlists);
  } catch (error) {
    console.error('Error getting playlists:', error);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

app.post('/api/command', async (req, res) => {
  const { command, data } = req.body;
  const success = await sendPlayerCommand(command, data);
  res.json({ success });
});

app.post('/api/reauth', async (req, res) => {
  console.log('Re-authentication requested...');
  authToken = null;
  await deleteAuthToken();
  await initialize();
  res.json({ success: authToken !== null });
});

// Socket.IO connection from web clients
io.on('connection', (socket) => {
  console.log('Web client connected:', socket.id);
  
  // Send current state to newly connected client
  if (currentState) {
    socket.emit('state-update', currentState);
  }
  
  socket.on('disconnect', () => {
    console.log('Web client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  await initialize();
});

