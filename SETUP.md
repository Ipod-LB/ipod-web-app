# iPod Web App - Setup Guide

## Quick Start

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd ipod-web-app

# Start a simple HTTP server
npx http-server . -p 8000

# Or using Python
python3 -m http.server 8000

# Visit http://localhost:8000 on your phone
```

### Add to iPhone Home Screen

1. Open in Safari
2. Tap Share button (bottom center)
3. Select "Add to Home Screen"
4. Tap "Add"

The app now works offline and has full screen mode!

---

## Spotify Integration Setup

### Why Spotify?

- Stream from your existing playlists
- No need to download music files
- Seamless playlist switching

### Requirements

- **Spotify Premium** account (for playback control)
- **Spotify Developer App** credentials

### Step 1: Create Spotify Developer App

1. Go to https://developer.spotify.com/dashboard
2. Login with your Spotify account (create one if needed)
3. Click "Create an App"
4. Accept terms and create
5. Copy your **Client ID**

### Step 2: Configure Redirect URI

1. In your app settings, click "Edit Settings"
2. Add Redirect URI: `https://yourdomain.com/callback.html`
3. For local dev: `http://localhost:8000/callback.html`
4. Save

### Step 3: Update config.js

Edit `config.js` and replace:

```javascript
SPOTIFY_CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID_HERE'
```

With your actual Client ID from step 1.

### Step 4: Important - Backend Token Exchange

⚠️ **SECURITY WARNING**: Do NOT expose your Client Secret in the browser code.

For production, you MUST create a backend server to:

1. Receive the auth code from callback
2. Exchange it for an access token (using Client Secret)
3. Return the token to the frontend

Example backend (Node.js):

```javascript
app.post('/auth/spotify', async (req, res) => {
  const { code } = req.body;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString('base64')
    },
    body: new URLSearchParams({
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();
  res.json(data);
});
```

Then update `spotify.js` exchangeCode() to call your backend.

---

## Upload Local Music

### Supported Formats

- MP3
- WAV
- OGG
- M4A
- FLAC

### How to Use

1. Click center wheel (the big knob)
2. Tap "Upload Files"
3. Select audio files or a ZIP
4. Files are stored in browser IndexedDB (no server needed!)

### ZIP File Support

Bundle all your songs:

```
my-music.zip
├── song1.mp3
├── song2.mp3
├── Folder/
│   └── song3.mp3
```

Upload the ZIP and it automatically extracts and imports all audio files.

### Storage Limit

Default: 500MB per browser
Set in `config.js`: `MAX_STORAGE`

---

## Feature Roadmap

- [x] Local file upload
- [x] ZIP extraction
- [x] Scroll wheel navigation
- [x] Haptic feedback
- [x] PWA support
- [ ] Spotify integration (requires backend)
- [ ] Playlist management
- [ ] Shuffle/repeat modes
- [ ] Now Playing animations
- [ ] Dark/light themes
- [ ] Visualizer effects

---

## Troubleshooting

### "Spotify not configured"
→ Update `config.js` with your Client ID

### Files not playing
→ Check browser console (F12) for errors
→ Ensure audio files are in supported format

### ZIP import failing
→ Make sure all files are audio format (.mp3, .wav, etc)
→ Try a smaller ZIP first to test

### Scroll wheel not working
→ Use touch input on real device (mouse is supported for testing)
→ Check touch-action CSS isn't being overridden

### Not adding to home screen
→ Needs HTTPS on production (http works locally)
→ Ensure manifest.json is loading (check DevTools)

---

## Performance Tips

- Use MP3 format (best browser support)
- Compress audio if file size is large
- Clear browser cache if experiencing issues

---

## Security Notes

1. **Client Secret**: Never commit or expose in code
2. **Access Tokens**: Stored in localStorage (consider clearing on logout)
3. **Audio Files**: Stored in IndexedDB (private to this origin)
4. **HTTPS**: Required for production/installation

---

## For More Help

Check the code comments or open an issue on GitHub!
