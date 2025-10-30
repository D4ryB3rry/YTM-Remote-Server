# 🎵 YTM Remote Server

Moderner TypeScript-basierter Webservice zur Fernsteuerung von YouTube Music Desktop vom Handy oder Browser aus.

**Neu in v3.0:** Komplett auf TypeScript umgestellt, modularisiert und mit Bun optimiert!

## ✨ Features

- 🎮 Vollständige Playback-Kontrolle (Play, Pause, Next, Previous)
- 🔊 Lautstärkeregelung
- 🔀 Shuffle & Repeat Modi
- 🎵 Album-Cover und Track-Informationen in Echtzeit
- 📱 Responsive Design für Desktop und Mobile
- 🔄 Echtzeit-Updates über WebSocket
- 💾 **Automatische AuthToken-Persistenz**
- 🎨 Moderne, intuitive Benutzeroberfläche
- 📦 **Modularisierte TypeScript-Architektur**
- ⚡ **Optimiert mit Bun für schnelle Builds**
- 🔒 **Type-Safety durch TypeScript**

## 🔐 AuthToken-Persistenz

Der Server speichert das Authentifizierungstoken automatisch in der Datei `authToken.txt`:

### Funktionsweise

1. **Erstmalige Authentifizierung:**
   - Beim ersten Start fordert der Server ein AuthToken von YTMDesktop an
   - Du musst die Anfrage in der YTMDesktop App akzeptieren
   - Das Token wird automatisch in `authToken.txt` gespeichert

2. **Nachfolgende Starts:**
   - Der Server lädt das Token automatisch aus `authToken.txt`
   - Keine erneute Authentifizierung nötig!
   - Bei jedem Start wird geprüft, ob das Token noch gültig ist

3. **Ungültiges Token:**
   - Wenn das Token abgelaufen ist, wird es automatisch gelöscht
   - Eine neue Authentifizierung wird angefordert
   - Das neue Token wird wieder gespeichert

### Manuelle Token-Verwaltung

**Token zurücksetzen:**
```bash
# Option 1: Datei löschen
rm authToken.txt

# Option 2: API-Endpoint
curl -X POST http://localhost:3000/api/reauth
```

**Token manuell setzen:**
```bash
echo "dein-token-hier" > authToken.txt
```

### Sicherheitshinweise

⚠️ **WICHTIG:**
- Die `authToken.txt` Datei enthält sensible Zugriffsdaten
- Füge `authToken.txt` zu `.gitignore` hinzu (bereits enthalten)
- Teile das Token nicht öffentlich
- Bei Bedarf kannst du in der YTMDesktop App den Zugriff widerrufen

## 📋 Voraussetzungen

1. [YouTube Music Desktop App](https://github.com/ytmdesktop/ytmdesktop) (v2.x)
2. [Bun](https://bun.sh) (v1.0 oder höher) - empfohlen für optimale Performance
   - Alternativ: Node.js (v18 oder höher)
3. YTMDesktop Remote Control aktiviert:
   - Öffne YTMDesktop
   - Settings → Integrations → Remote Control aktivieren

## 🚀 Installation

### Mit Bun (empfohlen)

```bash
# Repository klonen oder Dateien herunterladen
cd ytmdesktop-remote-server

# Dependencies installieren
bun install

# Projekt bauen
bun run build

# Server starten
bun start
```

### Für Entwicklung

```bash
# Development-Modus mit Auto-Reload
bun run dev

# TypeScript Type-Check
bun run type-check

# Debug CLI Tool starten
bun run debug
```

Der Server läuft standardmäßig auf `http://localhost:3000`

## 🐛 CLI Debug Tool

Ein interaktives Command-Line Interface zum Testen der YTMDesktop API:

```bash
bun run debug
```

### Verfügbare Debug-Commands

**Information:**
- `status` - YTMDesktop App-Info abrufen
- `state` - Aktuellen Player-State anzeigen (formatiert)
- `playlists` - Alle Playlists auflisten

**Playback:**
- `play` / `pause` - Play/Pause toggle
- `next` - Nächster Track
- `prev` - Vorheriger Track
- `shuffle` - Shuffle toggle
- `repeat [0-2]` - Repeat-Modus setzen (0=None, 1=All, 2=One)

**Controls:**
- `volume <0-100>` - Lautstärke setzen
- `seek <seconds>` - Zu Position springen
- `like` - Like toggle
- `dislike` - Dislike toggle

**Queue & Video:**
- `queue <index>` - Queue-Item an Index abspielen
- `video <videoId>` - Video per ID abspielen

**Advanced:**
- `raw <command> [json]` - Rohen Command mit optionalen JSON-Daten senden

**Utility:**
- `help` - Alle Commands anzeigen
- `clear` - Bildschirm leeren
- `exit` - CLI beenden

### Beispiele

```bash
ytm> state                    # Aktuellen Player-State anzeigen
ytm> volume 80                # Lautstärke auf 80% setzen
ytm> repeat 1                 # Repeat All aktivieren
ytm> queue 5                  # 6. Item in Queue abspielen
ytm> raw trackInfo            # Raw Command senden
ytm> video dQw4w9WgXcQ        # Video per ID abspielen
```

Das Tool verwendet automatisch den `authToken.txt` aus dem Projektverzeichnis.

## 🎯 Verwendung

### Erste Authentifizierung

1. Starte YTMDesktop und aktiviere Remote Control
2. Starte den Server mit `npm start`
3. **Wichtig:** Akzeptiere die Authentifizierungsanfrage in der YTMDesktop App!
4. Der Server zeigt "✓ Authentication successful!" an
5. Das Token wird in `authToken.txt` gespeichert

### Nachfolgende Starts

1. Starte YTMDesktop
2. Starte den Server mit `npm start`
3. Der Server lädt automatisch das gespeicherte Token
4. Fertig! Keine erneute Authentifizierung nötig 🎉

### Web-Interface verwenden

Öffne im Browser oder auf dem Handy:
```
http://localhost:3000
```

Oder von einem anderen Gerät im gleichen Netzwerk:
```
http://<deine-ip-adresse>:3000
```

## 🛠️ API Endpoints

### Status & State
```bash
# Server-Status prüfen
GET /api/status

# Aktuellen Player-State abrufen
GET /api/state

# Playlists abrufen
GET /api/playlists
```

### Playback-Kontrolle
```bash
# Befehl senden
POST /api/command
Content-Type: application/json

{
  "command": "play-pause"
}

# Befehle mit Daten
{
  "command": "seekTo",
  "data": 120
}
```

### Verfügbare Befehle
- `playPause` - Play/Pause Toggle
- `next` - Nächster Track
- `previous` - Vorheriger Track
- `toggleLike` - Like Toggle
- `toggleDislike` - Dislike Toggle
- `shuffle` - Shuffle Toggle
- `repeatMode` - Repeat Mode (Data: 0=None, 1=All, 2=One)
- `setVolume` - Lautstärke setzen (Data: 0-100)
- `seekTo` - Position setzen (Data: Sekunden)
- `playQueueIndex` - Queue-Item auswählen (Data: Index-Nummer)
- `changeVideo` - Video wechseln (Data: {videoId, playlistId})

### Authentifizierung
```bash
# Neue Authentifizierung erzwingen (löscht authToken.txt)
POST /api/reauth
```

## 📁 Projektstruktur

```
ytmdesktop-remote-server/
├── src/
│   ├── server/                    # Server-seitiger Code
│   │   ├── index.ts              # Server-Einstiegspunkt
│   │   ├── config.ts             # Konfiguration
│   │   ├── routes.ts             # Express Routes
│   │   ├── auth/
│   │   │   └── authManager.ts    # Token-Verwaltung
│   │   ├── api/
│   │   │   └── ytmClient.ts      # YTMDesktop API Client
│   │   └── socket/
│   │       └── socketManager.ts  # WebSocket-Verwaltung
│   ├── client/                    # Client-seitiger Code
│   │   ├── main.ts               # Client-Einstiegspunkt
│   │   ├── config.ts             # Client-Konfiguration
│   │   ├── api/
│   │   │   └── apiClient.ts      # API-Kommunikation
│   │   ├── socket/
│   │   │   └── socketClient.ts   # WebSocket Client
│   │   ├── state/
│   │   │   └── stateManager.ts   # State Management
│   │   └── ui/
│   │       ├── elements.ts       # DOM-Referenzen
│   │       ├── controls.ts       # Playback Controls
│   │       ├── progress.ts       # Progress Bar
│   │       ├── volume.ts         # Lautstärke
│   │       ├── queue.ts          # Warteschlange
│   │       ├── playlist.ts       # Playlists
│   │       ├── lyrics.ts         # Lyrics Panel
│   │       └── status.ts         # Status Anzeige
│   └── shared/
│       └── types/
│           └── index.ts          # Gemeinsame TypeScript Types
├── public/
│   ├── index.html                # Web-Interface
│   ├── styles.css                # Styling
│   └── dist/                     # Gebauter Client-Code
│       └── main.js               # (automatisch generiert)
├── dist/
│   └── server/
│       └── index.js              # Gebauter Server-Code
├── authToken.txt                 # AuthToken (automatisch erstellt)
├── package.json                  # Dependencies & Scripts
├── tsconfig.json                 # TypeScript-Konfiguration
├── .gitignore                    # Git-Ignore-Regeln
└── README.md                     # Diese Datei
```

## 🏗️ Architektur

### Server-Architektur
- **Modularisiert:** Klare Trennung von Auth, API, Socket und Routes
- **Type-Safe:** Vollständig typisiert mit TypeScript
- **Saubere Abstraktion:** Jedes Modul hat eine klar definierte Verantwortung

### Client-Architektur
- **Modular UI:** Jede UI-Komponente in eigenem Modul
- **State Management:** Zentrale State-Verwaltung
- **Separation of Concerns:** API, Socket, UI und State getrennt

### Build-System
- **Bun Build:** Schnelle Builds mit Bun
- **Separate Targets:** Server (Bun) und Client (Browser) getrennt
- **Type-Check:** Vollständige TypeScript-Validierung

## 🔄 Migration von v2.x auf v3.0

Die v3.0 ist eine vollständige Neuentwicklung in TypeScript. Wichtige Änderungen:

### Was bleibt gleich
- ✅ `authToken.txt` - Dein gespeichertes Token funktioniert weiterhin
- ✅ API-Endpoints - Alle bleiben kompatibel
- ✅ Web-Interface - Keine Änderungen am UI

### Was sich ändert
- 📦 **Package Manager:** npm → Bun (empfohlen)
- 🏗️ **Build-Schritt:** Projekt muss vor dem Start gebaut werden
- 📝 **Scripts:** Neue npm/bun Scripts (siehe Installation)

### Migrations-Schritte
```bash
# 1. Alte Version sichern (optional)
cp -r ytmdesktop-remote-server ytmdesktop-remote-server-v2-backup

# 2. Dependencies neu installieren
bun install

# 3. Projekt bauen
bun run build

# 4. Server starten
bun start
```

## 🔧 Troubleshooting

### Server kann nicht auf YTMDesktop zugreifen
- Stelle sicher, dass YTMDesktop läuft
- Prüfe, ob Remote Control aktiviert ist (Settings → Integrations)
- YTMDesktop verwendet standardmäßig Port 9863

### Playlist-Fehler (429 Too Many Requests)
- Die YTMDesktop API hat Rate Limits für REST-Aufrufe
- Playlists werden nur einmal beim ersten Laden abgerufen
- Verwende den Refresh-Button um Playlists manuell neu zu laden
- Mindestens 30 Sekunden Abstand zwischen Playlist-Aufrufen einhalten

### Authentifizierung schlägt fehl
- Lösche `authToken.txt` und starte neu
- Akzeptiere die Anfrage in der YTMDesktop App innerhalb von 30 Sekunden
- Prüfe die Server-Logs für Fehlermeldungen

### Token wird nicht gespeichert
- Prüfe Schreibrechte im Projektverzeichnis
- Schaue in die Server-Logs nach Fehlermeldungen
- Stelle sicher, dass keine Firewall/Antivirus blockiert

### "Auth token invalid or expired"
- Der Server löscht automatisch ungültige Tokens
- Beim nächsten Start wird eine neue Authentifizierung angefordert
- Alternativ: `POST /api/reauth` aufrufen

### Buttons reagieren nicht
- Öffne Browser-Konsole (F12) für Debugging
- Prüfe Server-Logs auf Fehler
- Cache leeren (Strg+Shift+R)
- Server und YTMDesktop neu starten

## 🔐 Sicherheit

Die `authToken.txt` Datei ist automatisch in `.gitignore` eingetragen und wird nicht ins Repository committed.

**Best Practices:**
- Teile niemals dein AuthToken
- Bei Sicherheitsbedenken: Token löschen und neu authentifizieren
- In YTMDesktop kannst du jederzeit den Zugriff widerrufen

## 📝 Lizenz

MIT License

## 🙏 Credits

Basiert auf der [YTMDesktop Companion Server API](https://github.com/ytmdesktop/ytmdesktop)

---

**Viel Spaß beim Fernsteuern deiner Musik! 🎵**
