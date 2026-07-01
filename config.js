// Spotify Configuration
// Get these values from https://developer.spotify.com/dashboard
const CONFIG = {
  SPOTIFY_CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID_HERE',
  SPOTIFY_REDIRECT_URI: window.location.origin + '/callback.html',
  SPOTIFY_API_BASE: 'https://api.spotify.com/v1',
  SPOTIFY_AUTH_BASE: 'https://accounts.spotify.com/authorize',
  
  // Scopes needed for playlist access
  SPOTIFY_SCOPES: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ],

  // Max local files storage (in MB)
  MAX_STORAGE: 500,

  // Debug mode
  DEBUG: false
};

// Helper to check if Spotify is configured
CONFIG.isSpotifyConfigured = () => {
  return CONFIG.SPOTIFY_CLIENT_ID !== 'YOUR_SPOTIFY_CLIENT_ID_HERE';
};

// Log configuration status
if (CONFIG.DEBUG) {
  console.log('Config loaded:', {
    spotifyConfigured: CONFIG.isSpotifyConfigured(),
    redirectUri: CONFIG.SPOTIFY_REDIRECT_URI
  });
}
