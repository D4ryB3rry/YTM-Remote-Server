#!/usr/bin/env bun

/**
 * YTMDesktop CLI Debug Tool
 * Interactive command-line interface for testing YTMDesktop API
 */

import { readFileSync, existsSync } from 'fs';
import * as readline from 'readline';

const YTMDESKTOP_BASE_URL = 'http://localhost:9863';
const AUTH_TOKEN_FILE = './authToken.txt';

interface Command {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<void>;
}

class YTMDebugCLI {
  private authToken: string | null = null;
  private rl: readline.Interface;
  private commands: Map<string, Command>;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'ytm> ',
    });

    this.commands = new Map();
    this.registerCommands();
    this.loadAuthToken();
  }

  /**
   * Load auth token from file
   */
  private loadAuthToken(): void {
    try {
      if (existsSync(AUTH_TOKEN_FILE)) {
        this.authToken = readFileSync(AUTH_TOKEN_FILE, 'utf-8').trim();
        // Don't log here, will be shown in start()
      } else {
        // Don't log here, will be shown in start()
      }
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  /**
   * Register all available commands
   */
  private registerCommands(): void {
    this.commands.set('help', {
      name: 'help',
      description: 'Show all available commands',
      handler: async () => this.showHelp(),
    });

    this.commands.set('status', {
      name: 'status',
      description: 'Get YTMDesktop app info',
      handler: async () => this.getStatus(),
    });

    this.commands.set('state', {
      name: 'state',
      description: 'Get current player state',
      handler: async () => this.getState(),
    });

    this.commands.set('playlists', {
      name: 'playlists',
      description: 'Get user playlists',
      handler: async () => this.getPlaylists(),
    });

    this.commands.set('play', {
      name: 'play',
      description: 'Send playPause command',
      handler: async () => this.sendCommand('playPause'),
    });

    this.commands.set('pause', {
      name: 'pause',
      description: 'Send playPause command',
      handler: async () => this.sendCommand('playPause'),
    });

    this.commands.set('next', {
      name: 'next',
      description: 'Skip to next track',
      handler: async () => this.sendCommand('next'),
    });

    this.commands.set('prev', {
      name: 'prev',
      description: 'Go to previous track',
      handler: async () => this.sendCommand('previous'),
    });

    this.commands.set('shuffle', {
      name: 'shuffle',
      description: 'Toggle shuffle mode',
      handler: async () => this.sendCommand('shuffle'),
    });

    this.commands.set('repeat', {
      name: 'repeat [mode]',
      description: 'Set repeat mode (0=None, 1=All, 2=One)',
      handler: async (args) => {
        const mode = parseInt(args[0] || '0', 10);
        await this.sendCommand('repeatMode', mode);
      },
    });

    this.commands.set('volume', {
      name: 'volume <0-100>',
      description: 'Set volume level',
      handler: async (args) => {
        const volume = parseInt(args[0] || '50', 10);
        await this.sendCommand('setVolume', volume);
      },
    });

    this.commands.set('seek', {
      name: 'seek <seconds>',
      description: 'Seek to position in seconds',
      handler: async (args) => {
        const seconds = parseInt(args[0] || '0', 10);
        await this.sendCommand('seekTo', seconds);
      },
    });

    this.commands.set('like', {
      name: 'like',
      description: 'Toggle like',
      handler: async () => this.sendCommand('toggleLike'),
    });

    this.commands.set('dislike', {
      name: 'dislike',
      description: 'Toggle dislike',
      handler: async () => this.sendCommand('toggleDislike'),
    });

    this.commands.set('queue', {
      name: 'queue <index>',
      description: 'Play queue item at index',
      handler: async (args) => {
        const index = parseInt(args[0] || '0', 10);
        await this.sendCommand('playQueueIndex', index);
      },
    });

    this.commands.set('video', {
      name: 'video <videoId>',
      description: 'Play video by ID',
      handler: async (args) => {
        const videoId = args[0];
        if (!videoId) {
          console.log('[ERROR] Please provide a video ID');
          return;
        }
        await this.sendCommand('changeVideo', { videoId, playlistId: null });
      },
    });

    this.commands.set('raw', {
      name: 'raw <command> [data]',
      description: 'Send raw command with optional JSON data',
      handler: async (args) => {
        const command = args[0];
        if (!command) {
          console.log('[ERROR] Please provide a command');
          return;
        }
        let data = undefined;
        if (args[1]) {
          try {
            data = JSON.parse(args.slice(1).join(' '));
          } catch (e) {
            console.log('[ERROR] Invalid JSON data');
            return;
          }
        }
        await this.sendCommand(command, data);
      },
    });

    this.commands.set('clear', {
      name: 'clear',
      description: 'Clear the screen',
      handler: async () => {
        console.clear();
      },
    });

    this.commands.set('exit', {
      name: 'exit',
      description: 'Exit the CLI',
      handler: async () => {
        console.log('Goodbye!');
        process.exit(0);
      },
    });
  }

  /**
   * Show help message
   */
  private showHelp(): void {
    console.log('\n=== YTMDesktop CLI Debug Tool - Available Commands ===\n');

    const categories = {
      'Information': ['help', 'status', 'state', 'playlists'],
      'Playback': ['play', 'pause', 'next', 'prev', 'shuffle', 'repeat'],
      'Controls': ['volume', 'seek', 'like', 'dislike'],
      'Queue & Video': ['queue', 'video'],
      'Advanced': ['raw'],
      'Utility': ['clear', 'exit'],
    };

    for (const [category, cmdNames] of Object.entries(categories)) {
      console.log(`\n${category}:`);
      for (const cmdName of cmdNames) {
        const cmd = this.commands.get(cmdName);
        if (cmd) {
          console.log(`  ${cmd.name.padEnd(25)} - ${cmd.description}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\nExamples:');
    console.log('  ytm> state              # Show current player state');
    console.log('  ytm> volume 80          # Set volume to 80%');
    console.log('  ytm> repeat 1           # Enable repeat all');
    console.log('  ytm> queue 5            # Play 6th item in queue');
    console.log('  ytm> raw trackInfo      # Send raw command');
    console.log('');
  }

  /**
   * Get YTMDesktop status
   */
  private async getStatus(): Promise<void> {
    console.log('\nFetching YTMDesktop status...\n');
    try {
      const response = await fetch(`${YTMDESKTOP_BASE_URL}/state`);
      const data = await response.json();
      console.log('[OK] YTMDesktop Response:');
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[ERROR]', error);
      console.log('\nTip: Make sure YTMDesktop is running and Remote Control is enabled');
    }
    console.log('');
  }

  /**
   * Get current player state
   */
  private async getState(): Promise<void> {
    if (!this.authToken) {
      console.log('[ERROR] No auth token available');
      return;
    }

    console.log('\nFetching player state...\n');
    try {
      const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/state`, {
        headers: { Authorization: this.authToken },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[ERROR] Auth token invalid (401 Unauthorized)');
          return;
        }
        console.log(`[ERROR] ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      // Pretty print the state
      console.log('[OK] Current State:');
      console.log('='.repeat(60));

      if (data.video) {
        console.log('\nNow Playing:');
        console.log(`   Title:    ${data.video.title}`);
        console.log(`   Artist:   ${data.video.author}`);
        console.log(`   Album:    ${data.video.album || 'N/A'}`);
        console.log(`   Duration: ${this.formatTime(data.video.durationSeconds)}`);
      }

      if (data.player) {
        console.log('\nPlayer:');
        console.log(`   State:    ${['Paused', 'Playing', 'Buffering'][data.player.trackState]}`);
        console.log(`   Progress: ${this.formatTime(data.player.videoProgress)} / ${this.formatTime(data.video?.durationSeconds || 0)}`);
        console.log(`   Volume:   ${data.player.volume}%`);
        console.log(`   Muted:    ${data.player.muted ? 'Yes' : 'No'}`);

        if (data.player.queue) {
          console.log(`\nQueue:`);
          console.log(`   Items:    ${data.player.queue.items?.length || 0}`);
          console.log(`   Selected: ${data.player.queue.selectedItemIndex ?? 'N/A'}`);
          console.log(`   Repeat:   ${['None', 'All', 'One'][data.player.queue.repeatMode ?? 0]}`);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('\nTip: Use "raw" command to see full JSON response');
    } catch (error) {
      console.error('[ERROR]', error);
    }
    console.log('');
  }

  /**
   * Get playlists
   */
  private async getPlaylists(): Promise<void> {
    if (!this.authToken) {
      console.log('[ERROR] No auth token available');
      return;
    }

    console.log('\nFetching playlists...\n');
    try {
      const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/playlists`, {
        headers: { Authorization: this.authToken },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[ERROR] Auth token invalid (401 Unauthorized)');
          return;
        }
        if (response.status === 429) {
          console.log('[ERROR] Too many requests (429) - Wait a moment and try again');
          return;
        }
        console.log(`[ERROR] ${response.status} ${response.statusText}`);
        return;
      }

      const playlists = await response.json();

      if (!playlists || playlists.length === 0) {
        console.log('No playlists found');
        return;
      }

      console.log(`[OK] Found ${playlists.length} playlists:\n`);
      playlists.forEach((playlist: any, index: number) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${playlist.title}`);
        if (playlist.author) {
          console.log(`     by ${playlist.author}`);
        }
        if (playlist.videoCount) {
          console.log(`     ${playlist.videoCount} videos`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('[ERROR]', error);
    }
    console.log('');
  }

  /**
   * Send command to YTMDesktop
   */
  private async sendCommand(command: string, data?: unknown): Promise<void> {
    if (!this.authToken) {
      console.log('[ERROR] No auth token available');
      return;
    }

    console.log(`\n[SEND] Command: ${command}${data !== undefined ? ` (data: ${JSON.stringify(data)})` : ''}\n`);

    try {
      const body = data !== undefined ? { command, data } : { command };

      const response = await fetch(`${YTMDESKTOP_BASE_URL}/api/v1/command`, {
        method: 'POST',
        headers: {
          Authorization: this.authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[ERROR] Auth token invalid (401 Unauthorized)');
          return;
        }
        console.log(`[ERROR] ${response.status} ${response.statusText}`);

        // Try to get error body
        try {
          const errorData = await response.text();
          if (errorData) {
            console.log(`   Response: ${errorData}`);
          }
        } catch (e) {
          // Ignore
        }
        return;
      }

      console.log('[OK] Command sent successfully');

      // Try to parse response
      try {
        const responseText = await response.text();
        if (responseText) {
          const responseData = JSON.parse(responseText);
          console.log('     Response:', JSON.stringify(responseData, null, 2));
        }
      } catch (e) {
        // No response body or not JSON, that's fine
      }
    } catch (error) {
      console.error('[ERROR]', error);
    }
    console.log('');
  }

  /**
   * Format seconds to MM:SS
   */
  private formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Process user input
   */
  private async processInput(line: string): Promise<void> {
    const trimmed = line.trim();
    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    const parts = trimmed.split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (command) {
      try {
        await command.handler(args);
      } catch (error) {
        console.error('[ERROR] Error executing command:', error);
      }
    } else {
      console.log(`[ERROR] Unknown command: ${commandName}`);
      console.log('        Type "help" to see available commands\n');
    }

    this.rl.prompt();
  }

  /**
   * Start the CLI
   */
  start(): void {
    console.clear();
    console.log('='.repeat(60));
    console.log('YTMDesktop CLI Debug Tool');
    console.log('='.repeat(60));
    console.log('\nType "help" to see available commands');
    console.log('Type "exit" to quit\n');

    if (!this.authToken) {
      console.log('WARNING: No auth token found!');
      console.log('Start your server first to generate authToken.txt\n');
    } else {
      console.log('✓ Auth token loaded\n');
    }

    this.rl.prompt();

    this.rl.on('line', (line) => {
      this.processInput(line);
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye!');
      process.exit(0);
    });
  }
}

// Start the CLI
const cli = new YTMDebugCLI();
cli.start();
