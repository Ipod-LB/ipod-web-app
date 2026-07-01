/**
 * Spotify Integration Module
 * Handles OAuth flow and playlist retrieval
 */
const Spotify = (() => {
  let accessToken = localStorage.getItem('spotify_access_token');
  let refreshToken = localStorage.getItem('spotify_refresh_token');
  let expiresAt = localStorage.getItem('spotify_expires_at');

  // Generate random state for OAuth
  const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('spotify_state', state);
    return state;
  };

  // Get authorization URL
  const getAuthUrl = () => {
    if (!CONFIG.isSpotifyConfigured()) {
      alert('Spotify not configured. Please update your Client ID in config.js');
      return null;
    }

    const params = new URLSearchParams({
      client_id: CONFIG.SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: CONFIG.SPOTIFY_REDIRECT_URI,
      scope: CONFIG.SPOTIFY_SCOPES.join(' '),
      state: generateState(),
      show_dialog: true
    });

    return `${CONFIG.SPOTIFY_AUTH_BASE}?${params.toString()}`;
  };

  // Login with Spotify
  const login = () => {
    const authUrl = getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  // Exchange authorization code for token
  const exchangeCode = async (code, state) => {
    // Verify state matches
    const savedState = sessionStorage.getItem('spotify_state');
    if (state !== savedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Note: This requires a backend server to securely exchange the code
    // The Client ID and Client Secret should never be exposed in frontend code
    // For this demo, we'll show the proper flow but you need a backend
    console.warn('⚠️ For production, use a backend server to exchange auth code');
    
    // This should be handled by your backend:
    // POST https://accounts.spotify.com/api/token
    // with client_id, client_secret, code, redirect_uri, grant_type
    
    throw new Error('Please implement backend token exchange. See console for details.');
  };

  // Handle callback (called from callback.html)
  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      return false;
    }

    if (code) {
      try {
        await exchangeCode(code, state);
        return true;
      } catch (err) {
        console.error('Token exchange failed:', err);
        return false;
      }
    }

    return false;
  };

  // Set tokens
  const setTokens = (access, refresh = null, expiresIn = 3600) => {
    accessToken = access;
    if (refresh) refreshToken = refresh;
    expiresAt = Date.now() + (expiresIn * 1000);

    localStorage.setItem('spotify_access_token', access);
    if (refresh) localStorage.setItem('spotify_refresh_token', refresh);
    localStorage.setItem('spotify_expires_at', expiresAt);
  };

  // Check if token is expired
  const isTokenExpired = () => {
    return !expiresAt || Date.now() >= expiresAt;
  };

  // Get valid access token (refresh if needed)
  const getAccessToken = async () => {
    if (!accessToken) return null;

    if (isTokenExpired() && refreshToken) {
      try {
        // Refresh token (requires backend)
        await refreshAccessToken();
      } catch (err) {
        console.error('Token refresh failed:', err);
        logout();
        return null;
      }
    }

    return accessToken;
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    if (!refreshToken) throw new Error('No refresh token available');

    // This should be handled by your backend:
    // POST https://accounts.spotify.com/api/token
    // with grant_type: refresh_token
    throw new Error('Token refresh requires backend implementation');
  };

  // Logout
  const logout = () => {
    accessToken = null;
    refreshToken = null;
    expiresAt = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
  };

  // Fetch user's playlists
  const getPlaylists = async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${CONFIG.SPOTIFY_API_BASE}/me/playlists`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to fetch playlists: ${response.statusText}`);
    }

    return response.json();
  };

  // Fetch playlist tracks
  const getPlaylistTracks = async (playlistId) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `${CONFIG.SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tracks: ${response.statusText}`);
    }

    return response.json();
  };

  // Start playback
  const play = async (deviceId, trackUri = null) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const body = { device_id: deviceId };
    if (trackUri) body.uris = [trackUri];

    const response = await fetch(
      `${CONFIG.SPOTIFY_API_BASE}/me/player/play?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      throw new Error(`Playback failed: ${response.statusText}`);
    }
  };

  // Pause playback
  const pause = async (deviceId) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `${CONFIG.SPOTIFY_API_BASE}/me/player/pause?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Pause failed: ${response.statusText}`);
    }
  };

  // Check if authenticated
  const isAuthenticated = () => !!accessToken && !isTokenExpired();

  return {
    login,
    logout,
    isAuthenticated,
    getAccessToken,
    getPlaylists,
    getPlaylistTracks,
    play,
    pause,
    setTokens,
    handleCallback
  };
})();
