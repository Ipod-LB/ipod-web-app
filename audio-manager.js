/**
 * Audio Manager Module
 * Handles local audio file playback with controls
 */
const AudioManager = (() => {
  const audio = new Audio();
  let playlist = [];
  let currentIndex = 0;
  let isPlaying = false;

  // Initialize audio element
  audio.addEventListener('ended', () => {
    nextTrack();
  });

  audio.addEventListener('timeupdate', () => {
    notifyListeners('timeupdate', {
      currentTime: audio.currentTime,
      duration: audio.duration
    });
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    notifyListeners('play');
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    notifyListeners('pause');
  });

  audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    notifyListeners('error', { error: audio.error });
  });

  // Event listeners
  const listeners = {};

  const on = (event, callback) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  };

  const off = (event, callback) => {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };

  const notifyListeners = (event, data = null) => {
    if (!listeners[event]) return;
    listeners[event].forEach(cb => cb(data));
  };

  // Load playlist
  const loadPlaylist = (tracks) => {
    playlist = tracks;
    currentIndex = 0;
    if (playlist.length > 0) {
      loadTrack(0);
      notifyListeners('playlistLoaded', { playlist });
    }
  };

  // Load specific track
  const loadTrack = (index) => {
    if (index < 0 || index >= playlist.length) return false;

    currentIndex = index;
    const track = playlist[index];

    if (track.url) {
      // Local file
      audio.src = track.url;
    } else if (track.uri) {
      // Spotify track (would need Spotify Web Playback SDK)
      console.warn('Spotify playback requires Web Playback SDK implementation');
      return false;
    }

    notifyListeners('trackChanged', { track, index });
    return true;
  };

  // Play
  const play = () => {
    if (playlist.length === 0) return false;
    
    try {
      audio.play().catch(err => {
        console.error('Play failed:', err);
        notifyListeners('error', { error: err });
      });
      return true;
    } catch (err) {
      console.error('Play error:', err);
      return false;
    }
  };

  // Pause
  const pause = () => {
    audio.pause();
    return true;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Next track
  const nextTrack = () => {
    if (loadTrack(currentIndex + 1)) {
      play();
      return true;
    }
    return false;
  };

  // Previous track
  const prevTrack = () => {
    // If more than 3 seconds into track, restart it
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      if (isPlaying) play();
      return true;
    }

    if (loadTrack(currentIndex - 1)) {
      play();
      return true;
    }
    return false;
  };

  // Seek to time
  const seek = (time) => {
    audio.currentTime = Math.max(0, Math.min(time, audio.duration));
  };

  // Set volume (0-1)
  const setVolume = (vol) => {
    audio.volume = Math.max(0, Math.min(vol, 1));
  };

  // Get current track
  const getCurrentTrack = () => {
    return playlist[currentIndex] || null;
  };

  // Get playlist
  const getPlaylist = () => [...playlist];

  // Get current state
  const getState = () => ({
    isPlaying,
    currentIndex,
    currentTime: audio.currentTime,
    duration: audio.duration,
    track: getCurrentTrack(),
    playlist: playlist.length,
    volume: audio.volume
  });

  return {
    loadPlaylist,
    loadTrack,
    play,
    pause,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    getCurrentTrack,
    getPlaylist,
    getState,
    on,
    off,
    // Direct access if needed
    audioElement: audio
  };
})();
