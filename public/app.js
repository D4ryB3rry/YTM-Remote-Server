// Initialize Socket.IO connection
const socket = io();

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const albumArtPlaceholder = document.getElementById('albumArtPlaceholder');
const albumArt = document.getElementById('albumArt');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackAlbum = document.getElementById('trackAlbum');
const progressFill = document.getElementById('progressFill');
const progressSlider = document.getElementById('progressSlider');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const thumbsUpBtn = document.getElementById('thumbsUpBtn');
const thumbsDownBtn = document.getElementById('thumbsDownBtn');
const lyricsBtn = document.getElementById('lyricsBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');
const muteIcon = document.getElementById('muteIcon');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const lyricsPanel = document.getElementById('lyricsPanel');
const lyricsCloseBtn = document.getElementById('lyricsCloseBtn');
const lyricsContent = document.getElementById('lyricsContent');
const lyricsSyncStatus = document.getElementById('lyricsStatus');
const urlInput = document.getElementById('urlInput');
const playUrlBtn = document.getElementById('playUrlBtn');
const playlistList = document.getElementById('playlistList');
const refreshPlaylistsBtn = document.getElementById('refreshPlaylistsBtn');
const queueList = document.getElementById('queueList');
const queueStats = document.getElementById('queueStats');

// State
let currentState = null;
let isConnected = false;
let progressInterval = null;
let currentLyricsTrack = null;
let syncedLyricsData = null;
let lyricsUpdateInterval = null;
let currentActiveLyricIndex = -1;
let lastAlbumArtUrl = '';

// Socket.IO Events
socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
    updateStatus(true);
    loadPlaylists();
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    updateStatus(false);
    stopProgressUpdates();
});

socket.on('state-update', (state) => {
    console.log('State update received:', state);
    currentState = state;
    updateUI(state);
});

// Update UI Status
function updateStatus(connected) {
    if (connected) {
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Verbunden';
    } else {
        statusIndicator.classList.remove('connected');
        statusText.textContent = 'Nicht verbunden';
    }
}

// Update UI with current state
function updateUI(state) {
    if (!state || !state.player) return;

    const { player, video } = state;

    // Update track info
    trackTitle.textContent = video?.title || 'Kein Song wird abgespielt';
    trackArtist.textContent = video?.author || '-';
    trackAlbum.textContent = video?.album || '-';

    // Update album art
    updateAlbumArt(video?.thumbnails);

    // Update progress (API v1: videoProgress is Number in seconds, durationSeconds from video)
    updateProgress(player, video);

    // Update play/pause button (API v1: trackState - 0=Paused, 1=Playing, 2=Buffering)
    const isPlaying = player.trackState === 1;
    updatePlayPauseButton(!isPlaying); // isPaused = !isPlaying

    // Update shuffle button - check queue for shuffle state
    // Note: API v1 doesn't expose shuffle state directly, we'll handle this differently
    // updateShuffleButton(player.queue?.shuffled);

    // Update repeat button (API v1: repeatMode in queue)
    updateRepeatButton(player.queue?.repeatMode);

    // Update like buttons (API v1: likeStatus in video - -1=Unknown, 0=Dislike, 1=Indifferent, 2=Like)
    updateLikeButtons(video?.likeStatus);

    // Update volume (API v1: volume is 0-100)
    if (player.volume !== undefined) {
        volumeSlider.value = player.volume;
        volumeValue.textContent = `${player.volume}%`;
        updateVolumeIcon(player.volume);
    }

    // Update queue
    updateQueue(player.queue);

    // Start progress updates if playing
    if (isPlaying) {
        startProgressUpdates(player, video);
    } else {
        stopProgressUpdates();
    }
}

// Update Album Art with better loading logic
function updateAlbumArt(thumbnails) {
    if (!thumbnails || thumbnails.length === 0) {
        // No thumbnails, show placeholder
        albumArt.style.display = 'none';
        albumArtPlaceholder.style.opacity = '1';
        lastAlbumArtUrl = '';
        return;
    }

    // Get the best quality thumbnail
    const bestThumbnail = thumbnails.reduce((best, current) => {
        return (current.width > best.width) ? current : best;
    }, thumbnails[0]);

    const newUrl = bestThumbnail.url;

    // Don't reload if it's the same image
    if (newUrl === lastAlbumArtUrl) {
        return;
    }

    lastAlbumArtUrl = newUrl;

    // Show placeholder while loading
    albumArtPlaceholder.style.opacity = '1';
    albumArt.style.display = 'none';

    // Load new image
    const img = new Image();
    img.onload = () => {
        albumArt.src = newUrl;
        albumArt.style.display = 'block';
        albumArtPlaceholder.style.opacity = '0';
    };
    img.onerror = () => {
        // If image fails to load, keep placeholder
        console.error('Failed to load album art:', newUrl);
        albumArt.style.display = 'none';
        albumArtPlaceholder.style.opacity = '1';
        lastAlbumArtUrl = '';
    };
    img.src = newUrl;
}

// Update Progress
function updateProgress(player, video) {
    // API v1: videoProgress is current position in seconds
    const current = player.videoProgress || 0;
    // API v1: durationSeconds is in the video object
    const total = video?.durationSeconds || 0;

    currentTime.textContent = formatTime(current);
    totalTime.textContent = formatTime(total);

    if (total > 0) {
        const percent = (current / total) * 100;
        progressFill.style.width = `${percent}%`;
        progressSlider.value = percent;
    }
}

// Start progress updates
function startProgressUpdates(player, video) {
    stopProgressUpdates();
    
    progressInterval = setInterval(() => {
        if (currentState && currentState.player && currentState.player.trackState === 1) {
            // Increment current position
            const current = (currentState.player.videoProgress || 0) + 1;
            const total = currentState.video?.durationSeconds || 0;
            
            if (current <= total) {
                currentState.player.videoProgress = current;
                updateProgress(currentState.player, currentState.video);
            }
        }
    }, 1000);
}

// Stop progress updates
function stopProgressUpdates() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update Play/Pause Button
function updatePlayPauseButton(isPaused) {
    if (isPaused) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    } else {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
}

// Update Shuffle Button
function updateShuffleButton(isShuffled) {
    if (isShuffled) {
        shuffleBtn.classList.add('active');
    } else {
        shuffleBtn.classList.remove('active');
    }
}

// Update Repeat Button
function updateRepeatButton(repeatMode) {
    // Handle undefined, null, or -1 (Unknown) as mode 0 (None)
    const mode = (repeatMode === undefined || repeatMode === null || repeatMode === -1) ? 0 : repeatMode;
    
    console.log('Update repeat button, mode:', mode);
    
    repeatBtn.classList.remove('active', 'repeat-one');
    
    if (mode === 1) {
        // Repeat All
        repeatBtn.classList.add('active');
    } else if (mode === 2) {
        // Repeat One
        repeatBtn.classList.add('active', 'repeat-one');
    }
    // mode 0 = None, no classes
}

// Update Like Buttons
function updateLikeButtons(likeStatus) {
    // API v1: likeStatus: -1=Unknown, 0=Dislike, 1=Indifferent, 2=Like
    thumbsUpBtn.classList.remove('active');
    thumbsDownBtn.classList.remove('active');

    if (likeStatus === 2) {
        thumbsUpBtn.classList.add('active');
    } else if (likeStatus === 0) {
        thumbsDownBtn.classList.add('active');
    }
}

// Update Volume Icon
function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.style.display = 'none';
        muteIcon.style.display = 'block';
    } else {
        volumeIcon.style.display = 'block';
        muteIcon.style.display = 'none';
    }
}

// Update Queue
function updateQueue(queue) {
    if (!queue || !queue.items || queue.items.length === 0) {
        queueList.innerHTML = '<p class="queue-empty">Keine Songs in der Warteschlange</p>';
        queueStats.textContent = '';
        return;
    }

    queueStats.textContent = `${queue.items.length} Songs`;
    
    queueList.innerHTML = queue.items.map((item, index) => {
        // Get thumbnail URL (use smallest one for queue)
        const thumbnail = item.thumbnails && item.thumbnails.length > 0 
            ? item.thumbnails[0].url 
            : '';
        
        return `
            <div class="queue-item ${index === queue.selectedItemIndex ? 'active' : ''}">
                ${thumbnail ? `<img src="${thumbnail}" alt="Cover" class="queue-item-thumbnail">` : '<div class="queue-item-thumbnail-placeholder">🎵</div>'}
                <div class="queue-item-info">
                    <div class="queue-item-title">${item.title || 'Unbekannt'}</div>
                    <div class="queue-item-artist">${item.author || 'Unbekannt'}</div>
                </div>
                <div class="queue-item-duration">${item.duration || ''}</div>
            </div>
        `;
    }).join('');
}

// Send Command to Server
async function sendCommand(command, data = null) {
    try {
        const response = await fetch('/api/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command, data })
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending command:', error);
        return { success: false };
    }
}

// Control Button Handlers
playPauseBtn.addEventListener('click', () => {
    sendCommand('playPause');
});

prevBtn.addEventListener('click', () => {
    sendCommand('previous');
});

nextBtn.addEventListener('click', () => {
    sendCommand('next');
});

shuffleBtn.addEventListener('click', () => {
    sendCommand('shuffle');
});

repeatBtn.addEventListener('click', () => {
    // API v1: repeatMode is in player.queue, not player directly
    const currentMode = currentState?.player?.queue?.repeatMode;
    // Handle undefined, null, or -1 as 0
    const mode = (currentMode === undefined || currentMode === null || currentMode === -1) ? 0 : currentMode;
    
    // Cycle: 0 (None) -> 1 (All) -> 2 (One) -> 0
    const nextMode = (mode + 1) % 3;
    
    console.log('Repeat mode change:', mode, '->', nextMode);
    sendCommand('repeatMode', nextMode);
});

thumbsUpBtn.addEventListener('click', () => {
    sendCommand('toggleLike');
});

thumbsDownBtn.addEventListener('click', () => {
    sendCommand('toggleDislike');
});

// Progress Slider
progressSlider.addEventListener('input', (e) => {
    if (!currentState || !currentState.video) return;
    
    // API v1: durationSeconds is in video object
    const total = currentState.video.durationSeconds || 0;
    const percent = e.target.value;
    const seekTo = (percent / 100) * total;
    
    // Update UI immediately
    currentTime.textContent = formatTime(seekTo);
    progressFill.style.width = `${percent}%`;
});

progressSlider.addEventListener('change', (e) => {
    if (!currentState || !currentState.video) return;
    
    // API v1: durationSeconds is in video object
    const total = currentState.video.durationSeconds || 0;
    const percent = e.target.value;
    const seekTo = (percent / 100) * total;
    
    sendCommand('seekTo', seekTo);
});

// Volume Controls
volumeBtn.addEventListener('click', () => {
    const currentVolume = parseInt(volumeSlider.value);
    if (currentVolume > 0) {
        // Currently has volume -> Mute it
        volumeSlider.value = 0;
        volumeValue.textContent = '0%';
        updateVolumeIcon(0);
        sendCommand('setVolume', 0);
    } else {
        // Currently muted -> Unmute to 50%
        volumeSlider.value = 50;
        volumeValue.textContent = '50%';
        updateVolumeIcon(50);
        sendCommand('setVolume', 50);
    }
});

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    volumeValue.textContent = `${volume}%`;
    updateVolumeIcon(volume);
});

volumeSlider.addEventListener('change', (e) => {
    const volume = parseInt(e.target.value);
    sendCommand('setVolume', volume);
});

// Lyrics Functions
async function loadLyrics(artist, title) {
    if (!artist || !title) {
        showLyricsError('Keine Track-Informationen verfügbar');
        return;
    }

    // Don't reload if same track
    const trackKey = `${artist}:${title}`;
    if (currentLyricsTrack === trackKey && lyricsPanel.classList.contains('active')) {
        return;
    }
    currentLyricsTrack = trackKey;

    // Clear any existing sync
    stopLyricsSync();

    // Show panel with loading state
    lyricsPanel.classList.add('active');
    lyricsSyncStatus.textContent = '';
    lyricsSyncStatus.classList.remove('synced');
    lyricsContent.classList.remove('synced');
    lyricsContent.innerHTML = `
        <div class="lyrics-loading">
            <div class="spinner"></div>
            <p>Lyrics werden geladen...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
        
        if (!response.ok) {
            const error = await response.json();
            showLyricsError(error.message || 'Keine Lyrics gefunden');
            return;
        }

        const data = await response.json();
        
        if (data.hasSynced && data.synced && data.synced.length > 0) {
            // Show synced lyrics
            syncedLyricsData = data.synced;
            displaySyncedLyrics(data.synced);
            lyricsSyncStatus.textContent = '🎵 Synchronisierte Lyrics';
            lyricsSyncStatus.classList.add('synced');
            lyricsContent.classList.add('synced');
            startLyricsSync();
        } else if (data.lyrics) {
            // Show plain lyrics
            syncedLyricsData = null;
            lyricsContent.classList.remove('synced');
            lyricsSyncStatus.textContent = '';
            lyricsContent.innerHTML = data.lyrics.split('\n')
                .map(line => `<div class="lyrics-line">${line || '&nbsp;'}</div>`)
                .join('');
        } else {
            showLyricsError('Keine Lyrics gefunden');
        }
    } catch (error) {
        console.error('Error loading lyrics:', error);
        showLyricsError('Fehler beim Laden der Lyrics');
    }
}

function displaySyncedLyrics(syncedLines) {
    lyricsContent.innerHTML = syncedLines
        .map((line, index) => `
            <div class="lyrics-line" data-index="${index}" data-time="${line.time}">
                ${line.text || '&nbsp;'}
            </div>
        `)
        .join('');
    
    // Add click-to-seek functionality
    const lines = lyricsContent.querySelectorAll('.lyrics-line');
    lines.forEach(line => {
        line.addEventListener('click', () => {
            const time = parseFloat(line.dataset.time);
            if (!isNaN(time)) {
                sendCommand('seekTo', time);
            }
        });
    });
}

function startLyricsSync() {
    stopLyricsSync();
    
    lyricsUpdateInterval = setInterval(() => {
        if (!syncedLyricsData || !currentState || !currentState.player) return;
        
        // API v1: videoProgress is the current position in seconds
        const currentTime = currentState.player.videoProgress || 0;
        updateActiveLyric(currentTime);
    }, 100); // Update every 100ms for smooth sync
}

function stopLyricsSync() {
    if (lyricsUpdateInterval) {
        clearInterval(lyricsUpdateInterval);
        lyricsUpdateInterval = null;
    }
    currentActiveLyricIndex = -1;
}

function updateActiveLyric(currentTime) {
    if (!syncedLyricsData) return;
    
    // Find the current line index
    let activeIndex = -1;
    for (let i = syncedLyricsData.length - 1; i >= 0; i--) {
        if (currentTime >= syncedLyricsData[i].time) {
            activeIndex = i;
            break;
        }
    }
    
    // Only update if index changed
    if (activeIndex === currentActiveLyricIndex) return;
    currentActiveLyricIndex = activeIndex;
    
    // Update all lines
    const lines = lyricsContent.querySelectorAll('.lyrics-line');
    lines.forEach((line, index) => {
        line.classList.remove('active', 'past');
        
        if (index === activeIndex) {
            line.classList.add('active');
            // Scroll to active line
            line.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (index < activeIndex) {
            line.classList.add('past');
        }
    });
}

function showLyricsError(message) {
    syncedLyricsData = null;
    lyricsContent.classList.remove('synced');
    lyricsSyncStatus.textContent = '';
    lyricsContent.innerHTML = `
        <div class="lyrics-error">
            <p>${message}</p>
        </div>
    `;
}

function closeLyricsPanel() {
    lyricsPanel.classList.remove('active');
    stopLyricsSync();
}

// Lyrics Button Handlers
lyricsBtn.addEventListener('click', () => {
    if (!currentState || !currentState.video) {
        alert('Kein Song wird abgespielt');
        return;
    }
    
    const artist = currentState.video.author;
    const title = currentState.video.title;
    loadLyrics(artist, title);
});

lyricsCloseBtn.addEventListener('click', closeLyricsPanel);

// Close lyrics panel with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lyricsPanel.classList.contains('active')) {
        closeLyricsPanel();
    }
});

// Click outside to close
lyricsPanel.addEventListener('click', (e) => {
    if (e.target === lyricsPanel) {
        closeLyricsPanel();
    }
});

// Direct Playback
playUrlBtn.addEventListener('click', () => {
    playFromUrl();
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        playFromUrl();
    }
});

function playFromUrl() {
    const url = urlInput.value.trim();
    if (!url) return;
    
    // Extract video ID from URL or use as-is if it's already an ID
    let videoId = url;
    
    // Handle different YouTube/YouTube Music URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            videoId = match[1];
            break;
        }
    }
    
    sendCommand('changeVideo', { videoId: videoId, playlistId: null });
    urlInput.value = '';
}

// Playlists
async function loadPlaylists() {
    try {
        playlistList.innerHTML = `
            <div class="playlist-loading">
                <div class="spinner-small"></div>
                <p>Playlists werden geladen...</p>
            </div>
        `;
        
        const response = await fetch('/api/playlists');
        
        if (!response.ok) {
            throw new Error('Failed to load playlists');
        }
        
        const playlists = await response.json();
        
        if (!playlists || playlists.length === 0) {
            playlistList.innerHTML = '<p class="queue-empty">Keine Playlists gefunden</p>';
            return;
        }
        
        playlistList.innerHTML = playlists.map(playlist => {
            // Zeige Song-Anzahl falls verfügbar
            const songCount = playlist.count || playlist.trackCount || '';
            const songCountText = songCount ? `${songCount} Songs` : '';
            
            // Zeige Author/Owner falls verfügbar  
            const author = playlist.author || playlist.owner || '';
            
            return `
                <div class="playlist-item" data-playlist-id="${playlist.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"></path>
                    </svg>
                    <div class="playlist-info">
                        <div class="playlist-name">${playlist.title}</div>
                        <div class="playlist-meta">
                            ${author ? `<span class="playlist-author">${author}</span>` : ''}
                            ${author && songCountText ? '<span class="playlist-separator">•</span>' : ''}
                            ${songCountText ? `<span class="playlist-count">${songCountText}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        const items = playlistList.querySelectorAll('.playlist-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const playlistId = item.dataset.playlistId;
                sendCommand('changeVideo', { playlistId: playlistId, videoId: null });
            });
        });
    } catch (error) {
        console.error('Error loading playlists:', error);
        playlistList.innerHTML = '<p class="queue-empty">Fehler beim Laden der Playlists</p>';
    }
}

refreshPlaylistsBtn.addEventListener('click', loadPlaylists);

// Initialize
updateStatus(isConnected);
