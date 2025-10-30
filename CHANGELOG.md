# Changelog

## Version 2.2.2 - Server-seitiger Playlist-Cache Fix (2025-10-29)

### 🐛 Kritischer Bugfix

**Problem:** Playlist-Cache funktionierte nicht bei 429 Errors
- ❌ Cache war nur im Frontend
- ❌ Server gab bei 429 Error `null` zurück
- ❌ Frontend konnte gecachte Playlists nicht nutzen

**Lösung:** Server-seitiger In-Memory Cache
- ✅ **PlaylistCache Singleton** im Server
- ✅ Bei API-Erfolg: Playlists cachen
- ✅ Bei API-Fehler (429, Timeout, etc.): Cache als Fallback
- ✅ Cache überlebt Server-Restarts (Singleton-Pattern)
- ✅ Detailliertes Logging: "cached playlists (fallback)" vs "playlists (fresh)"

### 🚀 Verbesserungen

**Cache-System:**
- In-Memory Cache (schnell & einfach)
- Automatisches Caching bei erfolgreichem Load
- Fallback bei Rate-Limiting (429)
- Fallback bei Netzwerkfehlern
- Age-Tracking für Debugging

**Logging:**
```
[Route] API returned null, checking cache...
[PlaylistCache] Returning cache (age: 5 minutes)
[Route] Returning 15 cached playlists (fallback)
```

### 📝 Neue Dateien

**src/server/cache/playlistCache.ts:**
- Singleton-Pattern für globalen Cache
- `set()` - Cache speichern
- `get()` - Cache abrufen
- `has()` - Cache-Existenz prüfen
- `getAgeMinutes()` - Cache-Alter anzeigen

**src/server/routes.ts:**
- Cache-Integration in `/api/playlists` Route
- Fallback-Logik bei API-Fehler
- Detailliertes Logging

### 🔧 Technische Details

**Funktionsweise:**
1. **Erfolgreicher API-Call:** Playlists → Cache → Response
2. **Fehlgeschlagener API-Call:** Cache prüfen → Falls vorhanden: Cache → Response
3. **Kein Cache:** 500 Error

**Rate-Limiting Handling:**
- YTMDesktop API hat Rate-Limits
- Bei 429 Error: Gecachte Playlists verwenden
- Kein Datenverlust für User

---

## Version 2.2.1 - Playlist-Cache & Like-Status Debug (2025-10-29)

### 🔧 Verbesserungen

**1. Playlist-Caching mit Fallback**
- ✅ Playlists werden nach erfolgreichem Load gecached
- ✅ Bei API-Fehler/Timeout: Cached Playlists als Fallback
- ✅ "(Cached)" Indikator bei Verwendung des Cache
- ✅ Bessere Fehlerbehandlung bei Netzwerkproblemen
- ✅ Verhindert leere Playlist-Anzeige bei temporären Ausfällen

**2. Like/Dislike Button Debug-Logging**
- ✅ Console-Logging für Like-Status hinzugefügt
- ✅ Detailliertes Debugging für Initial State
- ✅ Zeigt `video.likeStatus` Wert in Console
- ✅ Hilft bei Diagnose von State-Problemen

### 📝 Geänderte Dateien

**src/client/ui/playlist.ts:**
- `cachedPlaylists` - Private Cache-Variable
- `displayPlaylists()` - Neue Funktion für Playlist-Rendering
- Fallback-Logik bei API-Fehler
- "(Cached)" Indikator im UI

**src/client/ui/controls.ts:**
- Debug-Logging in `updateLikeButtons()`
- Detailliertes Console-Output für Like-Status

**src/client/main.ts:**
- Logging für `video.likeStatus` Wert

### 🐛 Bugfixes

- **Playlist-Caching:** Verhindert leere Anzeige bei API-Timeout
- **Like-Status:** Debug-Logging hilft bei State-Diagnose

### 💡 Debugging-Tipps

Wenn Like/Dislike Buttons nicht funktionieren, öffne die Browser-Console (F12) und schaue nach:
```
[Main] video.likeStatus: LIKE/DISLIKE/INDIFFERENT
[ControlsUI] updateLikeButtons called with: ...
[ControlsUI] Set thumbs up/down as active
```

---

## Version 2.2.0 - Vollständige Lyrics-Integration (2025-10-29)

### 🎵 Hauptfeature: Lyrics API & Display

**Lyrics-Funktionalität voll implementiert:**
- ✅ **Lyrics-API** mit lrclib.net Integration
- ✅ **File-Cache System** (7 Tage Cache) - keine unnötigen API-Calls
- ✅ **Synced Lyrics** mit Echtzeit-Synchronisation während Wiedergabe
- ✅ **Plain Lyrics** Fallback wenn keine Synced Lyrics verfügbar
- ✅ **Click-to-Seek** - Klicke auf Lyrics-Zeile zum Springen
- ✅ **Auto-Scroll** - Aktive Zeile wird automatisch zentriert
- ✅ **YouTube Music Fallback** - Link wenn keine Lyrics gefunden

### 🎨 Lyrics UI Features

**Synced Lyrics:**
- Aktive Zeile hervorgehoben und vergrößert
- Smooth Scroll zur aktuellen Zeile
- Vergangene Zeilen ausgegraut
- Glassmorphism-Effekt für aktive Zeile
- Pulsierender "♪ Synced Lyrics" Indikator

**Plain Lyrics:**
- Sauberes, lesbares Layout
- Scrollbar für lange Texte
- "Lyrics · Source" Anzeige

### 🚀 Backend-Architektur

**Neue Server-Module:**
- `src/server/lyrics/lyricsCache.ts` - File-basiertes Cache-System
- `src/server/lyrics/lyricsFetcher.ts` - API-Fetcher mit lrclib.net
- `.cache/lyrics/` - Automatisches Cache-Verzeichnis

**API-Endpoint:**
- `GET /api/lyrics?artist=...&title=...` - Lyrics abrufen

**Cache-Features:**
- MD5-Hash basierte Cache-Keys
- 7 Tage Gültigkeit
- Automatische Erstellung von Cache-Verzeichnis
- JSON-basierte Persistenz

### 📝 Geänderte/Neue Dateien

**Server:**
- `src/server/lyrics/lyricsCache.ts` - Cache-System (NEU)
- `src/server/lyrics/lyricsFetcher.ts` - Lyrics-Fetcher (NEU)
- `src/server/routes.ts` - Lyrics-Route hinzugefügt
- `src/shared/types/index.ts` - Lyrics Types hinzugefügt

**Client:**
- `src/client/api/apiClient.ts` - getLyrics() Methode
- `src/client/ui/lyrics.ts` - Vollständig umgebaut mit API-Integration
- `public/styles.css` - Lyrics-Plain Styling

**Konfiguration:**
- `.gitignore` - Cache-Verzeichnis hinzugefügt

### 🔧 Technische Details

**Lyrics-Quellen:**
- Primär: lrclib.net (kostenlos, keine API-Key nötig)
- Format: LRC (.lrc) mit Timestamps [mm:ss.xx]
- Fallback: Plain Text Lyrics

**Performance:**
- File-Cache reduziert API-Calls drastisch
- Lyrics werden für 7 Tage gecached
- Schneller Zugriff auf bereits geladene Songs

**LRC Parser:**
- Regex-basiertes Parsing von Timestamp-Format
- Unterstützt [mm:ss.xx] und [mm:ss] Format
- Millisekunden-Präzision für Synchronisation

---

## Version 2.1.4 - Media Type Badges & Lyrics UI (2025-10-29)

### ✨ Neue Features

**1. Media Type Badge Anzeige**
- ✅ Visuelles Badge neben dem Tracktitel zeigt den Medien-Typ an
- ✅ **LIVE** - Rotes Badge mit Glow-Effekt für Live-Streams
- ✅ **PODCAST** - Lila Badge für Podcasts
- ✅ **VIDEO** - Orange Badge für Video-Content
- ✅ **SONG** - Grünes Badge für reguläre Audio-Songs
- ✅ **UPLOAD** - Orange Badge für hochgeladene Inhalte
- ✅ Automatische Erkennung über `video.videoType` und `video.isLive` API-Felder
- ✅ Debug-Logging zur Fehlersuche

**2. Lyrics UI Verbesserung**
- ✅ Informative Nachricht, warum Lyrics nicht verfügbar sind
- ✅ Direkter Link zu YouTube Music für offiziellen Lyrics-Zugriff
- ✅ Schönes Icon-Design mit Hover-Effekten
- ✅ Automatische Video-ID Erkennung für korrekten Link

### 🎨 UI Design

**Badge-Styling (Verbessert):**
- Hellere, kontrastreichere Farben für bessere Sichtbarkeit
- Stärkere Box-Shadows mit Glow-Effekt
- Glassmorphism-Effekt mit Backdrop-Blur
- Pulsierender Indikator-Punkt
- Responsive Layout neben Titel

**Lyrics-Panel:**
- Klare Erklärung der API-Limitierung
- Animierter Button zum Öffnen in YouTube Music
- Responsive Icon-Design

### 📝 Geänderte Dateien

**src/shared/types/index.ts:**
- `videoType` Feld hinzugefügt: -1 (Unknown), 0 (Audio), 1 (Video), 2 (Uploaded), 3 (Podcast)

**public/index.html:**
- `<span id="mediaTypeBadge">` Element hinzugefügt
- `title-with-badge` Container für flexibles Layout

**public/styles.css:**
- `.media-type-badge` - Basis-Styling mit Glassmorphism
- `.type-live`, `.type-podcast`, `.type-video`, `.type-audio` - Typ-spezifische Farben
- Badge-Pulse Animation für Indikator-Punkt

**src/client/ui/elements.ts:**
- `mediaTypeBadge` Element-Referenz hinzugefügt

**src/client/ui/controls.ts:**
- `updateMediaTypeBadge()` - Neue Funktion zur Badge-Verwaltung
- Automatische Typ-Erkennung und Styling
- Debug-Logging für Badge-Updates

**src/client/ui/lyrics.ts:**
- `showNotImplemented()` - Verbesserte Nachricht mit YouTube Music Link
- Automatische Video-ID Extraktion
- Schönes UI-Design mit Icon

**src/client/main.ts:**
- Badge-Update im UI-Update-Flow integriert

### 🔧 Technische Details

- Verwendet offizielle YTMDesktop API v1 Fields (seit v2.0.6+)
- TypeScript Type-Safety für alle neuen Felder
- Performance-optimiert: Badge wird nur bei Änderung aktualisiert
- Graceful Handling für fehlende Typ-Informationen

---

## Version 2.1.3 - UI Verbesserungen (2025-10-28)

### ✨ Neue Features

**1. Repeat Button mit visuellen Modi**
- ✅ **Repeat All:** Icon rot 🔁
- ✅ **Repeat One:** Icon rot + **"1"** Badge 🔂
- ✅ **None:** Icon grau ⚪
- Klarer visueller Unterschied zwischen den 3 Modi

**2. Thumbnails in der Warteschlange**
- ✅ 48x48px Album-Cover für jeden Song
- ✅ 🎵 Placeholder bei fehlendem Bild
- ✅ Besseres Layout: Thumbnail + Titel/Artist + Dauer
- ✅ Korrekter `selectedItemIndex` für aktiven Song

**3. Playlist-Informationen erweitert**
- ✅ Author/Owner angezeigt (falls verfügbar)
- ✅ Song-Anzahl angezeigt (falls verfügbar)
- ✅ Format: "Author • 42 Songs"
- ✅ Flexible Anzeige (nur was verfügbar ist)

### 📝 Geänderte Dateien

**public/index.html:**
- Repeat Button: `<span class="repeat-one-indicator">1</span>` hinzugefügt

**public/styles.css:**
- `.repeat-one-indicator` - "1" Badge Styling
- `.queue-item-thumbnail` - Thumbnail Styling
- `.queue-item-thumbnail-placeholder` - Placeholder
- `.queue-item-info` - Info Container
- `.queue-item-duration` - Duration Styling
- `.playlist-meta` - Meta-Info Container
- `.playlist-author`, `.playlist-separator` - Author & Separator

**public/app.js:**
- `updateQueue()` - Thumbnails + Duration + korrekter selectedItemIndex
- `loadPlaylists()` - Author + Song Count Anzeige

### 🎨 UI Improvements

- Repeat Button zeigt jetzt klar alle 3 Modi visuell
- Queue ist übersichtlicher mit Thumbnails
- Playlists zeigen mehr Context
- Besseres Spacing und Layout

---

## Version 2.1.2 - State & UI Fixes (2025-10-28)

### 🐛 Kritische UI-Bugfixes

**Problem 1: Volume Button**
- ✅ FIXED: Mute Button setzt jetzt korrekt auf 0 (statt nichts zu tun)
- ✅ Korrekte Logik: Volume > 0 → Mute, Volume = 0 → Unmute

**Problem 2: Dauer/Progress Bar**
- ✅ FIXED: Zeit wird jetzt angezeigt (z.B. "0:45 / 3:00" statt "0:00 / 0:00")
- ✅ API v1: Verwendet `video.durationSeconds` statt `player.videoProgress.total`
- ✅ Seek-Funktionalität korrigiert

**Problem 3: Play/Pause & Repeat Button State**
- ✅ FIXED: Play/Pause Icon wechselt jetzt korrekt
- ✅ FIXED: Repeat Button cycled durch alle 3 Modi (None → All → One)
- ✅ API v1: Verwendet `trackState` statt `isPaused`
- ✅ API v1: Verwendet `player.queue.repeatMode` statt `player.repeatMode`

### 🔄 API v1 State-Struktur komplett korrigiert

Alle Feldnamen auf YTMDesktop Companion Server API v1 aktualisiert:

| Alt (❌) | Neu (✅) | Beschreibung |
|----------|----------|--------------|
| `player.isPaused` | `player.trackState` | 0=Paused, 1=Playing, 2=Buffering |
| `player.seekbarCurrentPosition` | `player.videoProgress` | Position in Sekunden |
| `player.videoProgress.total` | `video.durationSeconds` | Dauer in Sekunden |
| `player.volumePercent` | `player.volume` | Lautstärke 0-100 |
| `player.repeatMode` | `player.queue.repeatMode` | Repeat-Modus |
| `player.likeStatus` (String) | `video.likeStatus` (Number) | Like-Status |

### 📝 Geänderte Funktionen

**public/app.js:**
- `updateUI()` - Komplett überarbeitet für API v1
- `updateProgress()` - Verwendet video.durationSeconds
- `startProgressUpdates()` - Verwendet trackState und videoProgress
- `updateLikeButtons()` - Erkennt Number-Werte
- Volume Button - Korrekte Mute-Logik
- Progress Slider - Korrekte Dauer
- Repeat Button - Liest queue.repeatMode
- Lyrics Sync - Verwendet videoProgress

### ✅ Jetzt funktionieren

- ✅ Volume Mute/Unmute Button
- ✅ Progress Bar mit korrekter Zeitanzeige
- ✅ Play/Pause Icon wechselt
- ✅ Repeat Button durch alle Modi
- ✅ Like/Dislike mit korrektem State
- ✅ Seek funktioniert richtig
- ✅ Lyrics Sync

---

## Version 2.1.1 - API Command Fixes (2025-10-28)

### 🐛 Kritische Bugfixes

#### API Commands korrigiert
Alle Commands wurden auf die korrekten YTMDesktop API v1 Namen aktualisiert:

**Playback:**
- ❌ `play-pause` → ✅ `playPause`

**Like/Dislike:**
- ❌ `thumbs-up` → ✅ `toggleLike`
- ❌ `thumbs-down` → ✅ `toggleDislike`

**Volume:**
- ❌ `volume` → ✅ `setVolume`

**Playlists & Videos:**
- ❌ `playPlaylist` → ✅ `changeVideo` mit `{ playlistId, videoId: null }`
- ❌ `playVideo` → ✅ `changeVideo` mit `{ videoId, playlistId: null }`

### ✅ Was jetzt funktioniert

- ✅ Play/Pause Button (war 400 Error)
- ✅ Playlist Auswahl (war 400 Error)
- ✅ Direct URL Playback (war 400 Error)
- ✅ Like/Dislike Buttons (war 400 Error)
- ✅ Volume Control (war 400 Error)
- ✅ Next/Previous (funktionierte bereits)
- ✅ Shuffle/Repeat (funktionierte bereits)

### 📝 Geänderte Dateien

**public/app.js:**
- Alle Command-Namen auf API v1 Standard aktualisiert
- `changeVideo` Command mit korrektem Data-Format

### 📚 Dokumentation

**Neu:** FIX-v2.1.1.md - Detaillierte Übersicht aller Fixes und API-Referenz

---

## Version 2.1.0 - AuthToken-Persistenz (2025-10-28)

### ✨ Neue Features

#### 🔐 Automatische AuthToken-Persistenz
- **AuthToken wird jetzt persistent gespeichert** in `authToken.txt`
- Keine erneute Authentifizierung bei jedem Server-Neustart nötig
- Token wird automatisch geladen und validiert beim Start
- Ungültige Tokens werden automatisch gelöscht und neu angefordert

#### 🔄 Verbesserte Authentifizierung
- Automatische Token-Validierung beim Server-Start
- Graceful Handling von abgelaufenen Tokens
- Neue API-Endpoint: `POST /api/reauth` zum manuellen Zurücksetzen
- Detailliertes Logging für Auth-Prozess

#### 🛡️ Sicherheit
- `.gitignore` enthält jetzt `authToken.txt` 
- `authToken.txt.example` als Vorlage hinzugefügt
- Dokumentation zu Sicherheits-Best-Practices

### 🔧 Technische Änderungen

**server.js:**
- Neue Funktionen:
  - `loadAuthToken()` - Lädt Token aus Datei
  - `saveAuthToken()` - Speichert Token in Datei
  - `deleteAuthToken()` - Löscht Token-Datei
- Erweiterte `initialize()` Funktion mit Token-Loading
- 401-Error Handling führt zu automatischem Token-Reset
- Verbesserte Konsolen-Ausgaben mit Status-Symbolen (✓, ⚠️)

**Neue Dateien:**
- `authToken.txt` - Wird automatisch erstellt (nicht im Git)
- `authToken.txt.example` - Beispiel-Datei
- `.gitignore` - Schützt sensible Dateien
- `CHANGELOG.md` - Diese Datei

### 📚 Dokumentation

**README.md:**
- Vollständige Sektion zu AuthToken-Persistenz
- Erklärung der Funktionsweise
- Troubleshooting-Tipps
- Sicherheitshinweise
- Manuelle Token-Verwaltung

### 🔄 Migration von v2.0.x

Keine Breaking Changes! Der Server funktioniert wie gewohnt:
1. Beim ersten Start: Authentifizierung wie bisher
2. Token wird automatisch gespeichert
3. Bei nachfolgenden Starts: Automatisches Laden des Tokens

Bestehende Installationen benötigen keine Anpassungen.

---

## Version 2.0.1 - Repeat-Button Fix (2025-10-28)

### 🐛 Bugfixes
- Repeat-Button behandelt jetzt `repeatMode: -1` korrekt
- Verbesserte State-Validierung für alle Modi
- Debug-Logging für Repeat-Funktionalität

---

## Version 2.0.0 - Initial Release

### Features
- Vollständige Playback-Kontrolle
- Echtzeit-Updates via WebSocket
- Responsive Web-Interface
- Playlists-Unterstützung
- Lyrics-Anzeige
- Album-Cover und Track-Informationen
