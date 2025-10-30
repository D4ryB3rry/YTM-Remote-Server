# 🎵 YTM Remote Server

Modern TypeScript-powered web service for controlling [YTMDesktop](https://github.com/ytmdesktop/ytmdesktop) from your phone or any browser.

**New in v3.0:** completely migrated to TypeScript, fully modular architecture, and Bun-optimized builds.

## ✨ Features

- 🎮 Full playback control (play, pause, next, previous)
- 🔊 Volume management
- 🔀 Shuffle & repeat modes
- 🎵 Album artwork and track details in real time
- 📱 Responsive layout for desktop and mobile
- 🔄 Live updates over WebSocket
- 💾 **Automatic AuthToken persistence**
- 🎨 Modern, intuitive interface with internationalisation (EN, DE, ES)
- 📦 **Modularised TypeScript architecture**
- ⚡ **Optimised with Bun for fast builds**
- 🔒 **Type safety thanks to TypeScript**

## 🔐 AuthToken persistence

The server stores the authentication token automatically inside `authToken.txt`.

### How it works

1. **First authentication**
   - On first start the server requests an AuthToken from YTMDesktop
   - Approve the request inside the YTMDesktop app
   - The token is written to `authToken.txt`

2. **Subsequent starts**
   - The server loads the saved token from `authToken.txt`
   - No manual re-authentication is required
   - On each start the token is validated

3. **Invalid tokens**
   - When the token expires it is removed automatically
   - A new authentication request is triggered
   - The refreshed token is stored again

### Manual token management

**Reset the token**

```bash
# Option 1: delete the file
rm authToken.txt

# Option 2: via API endpoint
curl -X POST http://localhost:3000/api/reauth
```

**Set the token manually**

```bash
echo "your-token-here" > authToken.txt
```

### Security notes

⚠️ **Important**

- `authToken.txt` contains sensitive credentials
- Ensure the file is listed in `.gitignore` (already included)
- Never share the token publicly
- You can revoke access inside the YTMDesktop app at any time

## 📋 Requirements

1. [YouTube Music Desktop App](https://github.com/ytmdesktop/ytmdesktop) (v2.x)
2. [Bun](https://bun.sh) (v1.0 or later) for the best experience
   - Alternative: Node.js (v18 or later)
3. Remote control enabled inside YTMDesktop:
   - Open YTMDesktop
   - Settings → Integrations → enable Remote Control

## 🚀 Installation

### Using Bun (recommended)

```bash
# Clone the repository or download the sources
cd ytmdesktop-remote-server

# Install dependencies
bun install

# Build the project
bun run build

# Start the server
bun start
```

### Development helpers

```bash
# Development mode with auto-reload
bun run dev

# TypeScript type check
bun run type-check

# Launch the debug CLI tool
bun run debug
```

The server listens on `http://localhost:3000` by default.

## 🐛 CLI debug tool

An interactive command line interface for exploring the YTMDesktop API:

```bash
bun run debug
```

### Available commands

**Information**
- `status` – Show YTMDesktop app information
- `state` – Display the current player state (formatted)
- `playlists` – List all playlists

**Playback**
- `play` / `pause` – Toggle playback
- `next` – Next track
- `prev` – Previous track
- `shuffle` – Toggle shuffle
- `repeat [0-2]` – Set repeat mode (0=None, 1=All, 2=One)

**Controls**
- `volume <0-100>` – Set volume
- `seek <seconds>` – Seek to position
- `like` – Toggle like
- `dislike` – Toggle dislike

**Queue & video**
- `queue <index>` – Play queue item by index
- `video <videoId>` – Play a video by ID

**Advanced**
- `raw <command> [json]` – Send a raw command with optional JSON payload

**Utility**
- `help` – List all commands
- `clear` – Clear the screen
- `exit` – Quit the CLI

### Examples

```bash
ytm> state                    # Display the current player state
ytm> volume 80                # Set volume to 80%
ytm> repeat 1                 # Enable repeat all
ytm> queue 5                  # Play the 6th item in the queue
ytm> raw trackInfo            # Send a raw command
ytm> video dQw4w9WgXcQ        # Play a video by ID
```

The tool automatically uses the `authToken.txt` file from the project directory.
