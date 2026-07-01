# iPod Web App - Complete Project Guide

## 🎵 What You Just Got

A fully-functional **iPod emulator** for iPhone with:

✅ **Classic iPod Interface**
- Circular scroll wheel with physics
- Play/pause/skip buttons
- Realistic visual design
- Works offline as a PWA

✅ **Music Sources**
- Upload local MP3/WAV/OGG files
- Extract ZIP files automatically
- Connect Spotify (with Premium account)
- Browse playlists

✅ **iPhone Integration**
- Add to home screen (no app store needed)
- Full screen, standalone mode
- Haptic feedback on every interaction
- Works offline

---

## 🚀 Quick Start (5 minutes)

### 1. Start Local Server

```bash
cd ipod-web-app
python3 -m http.server 8000
```

Or use Node:
```bash
npx http-server . -p 8000
```

### 2. Open on iPhone

- Safari → `http://192.168.x.x:8000` (replace with your computer's IP)
- Or on the same computer: `http://localhost:8000`

### 3. Add to Home Screen

1. Tap Share (bottom center)
2. "Add to Home Screen"
3. Tap "Add"

That's it! You now have an iPod on your home screen.

### 4. Upload Music

- Click the center wheel (big knob)
- Choose "Upload Files" or "Connect Spotify"
- Select MP3s or a ZIP file
- Start playing!

---

## 📁 Project Structure

```
ipod-web-app/
├── index.html           # Main app shell (PWA metadata)
├── styles.css           # iPod design & animations
├── app.js              # Main UI logic & event handlers
├── config.js           # Spotify API credentials
├── spotify.js          # Spotify OAuth & API calls
├── audio-manager.js    # Audio playback control
├── file-uploader.js    # File upload & ZIP extraction
├── sw.js               # Service Worker (offline support)
├── manifest.json       # PWA manifest
├── callback.html       # Spotify OAuth redirect
├── README.md           # Project overview
├── SETUP.md            # Detailed setup guide
└── .gitignore          # Git ignore rules
```

### Key Files Explained

**index.html** - The main app interface
- Contains the iPod device frame, scroll wheel, buttons
- Loads all other scripts
- Registers the service worker

**app.js** - Heart of the app
- Wheel rotation detection & haptic feedback
- Playlist navigation
- UI updates when playing
- Modal management

**audio-manager.js** - Audio playback engine
- HTML5 Audio API wrapper
- Play/pause/skip controls
- Track loading
- Time tracking

**file-uploader.js** - File handling
- IndexedDB storage
- ZIP extraction using JSZip
- Audio metadata parsing
- Storage management

**spotify.js** - Spotify integration
- OAuth 2.0 flow
- Playlist fetching
- Playback control (with backend)
- Token management

**styles.css** - Design system
- iPod aesthetic (metallic, brushed aluminum)
- Responsive layout
- Animations & transitions
- Haptic-feedback visual feedback

---

## 🎛️ How the Scroll Wheel Works

### Visual
- SVG circle with tick marks (8 like a real iPod)
- Rotates as you swipe
- Smooth animation feedback

### Interaction
1. **Touch & Drag** - Move finger around center
2. **Angle Detection** - Calculates rotation angle
3. **Track Navigation** - Every ~0.5 radians = next/prev song
4. **Haptic Pulse** - Vibration every time you scroll

### Physics
- Smooth rotation using `transform: rotate()`
- Touch events tracked across entire app
- Drag outside wheel still works (authentic iPod feel)

```javascript
// Simplified wheel math
angle = atan2(y, x)           // Get user's touch angle
angleDelta = newAngle - lastAngle
trackChange = angleDelta / 0.5  // ~0.5 rad per track
if (trackChange !== 0) navigate()
```

---

## 🎵 Audio Playback

### Local Files
1. User uploads MP3/WAV files
2. Stored in browser's IndexedDB (no server)
3. Converted to Blob URLs
4. Played via HTML5 `<audio>` element

### ZIP Support
1. User uploads .zip file
2. JSZip library extracts in browser
3. Finds all audio files (*.mp3, *.wav, etc)
4. Each file processed individually
5. All stored in IndexedDB

### Spotify (Future)
1. User clicks "Connect Spotify"
2. Redirected to Spotify login
3. App receives authorization code
4. Backend exchanges for access token
5. Fetch user's playlists
6. Control playback via Web Playback SDK

---

## 🔐 Spotify Setup (Advanced)

### Why You Need a Backend

Spotify requires:
- **Client ID** (public, safe in frontend)
- **Client Secret** (NEVER expose to users!)

To get an access token, you must:
1. Exchange auth code + Client Secret → access token
2. This MUST happen on your secure server
3. Server returns token to app (frontend never sees secret)

### Example Backend (Node.js)

```javascript
// routes/auth.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/spotify', async (req, res) => {
  const { code } = req.body;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      {
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      {
        auth: {
          username: process.env.SPOTIFY_CLIENT_ID,
          password: process.env.SPOTIFY_CLIENT_SECRET
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

Then update `spotify.js`:

```javascript
const exchangeCode = async (code, state) => {
  const response = await fetch('/api/auth/spotify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  const data = await response.json();
  setTokens(data.access_token, data.refresh_token, data.expires_in);
};
```

---

## 🔋 Haptic Feedback

Triggered on:
- ✓ Scroll wheel drag
- ✓ Track change
- ✓ Center button click
- ✓ Play/pause
- ✓ File upload start/complete

Intensity levels:
- `light` - 20ms buzz (subtle)
- `medium` - 40ms buzz (noticeable)
- `heavy` - 60ms buzz (strong)
- `success` - 30-20-30ms pattern (upload done)
- `error` - 100-50-100ms pattern (error)

Works via `navigator.vibrate()` API (iPhone + Android).

---

## 📱 PWA Features

### What is a PWA?

Progressive Web App - web app that works like native:

✓ Add to home screen
✓ Full screen mode (no browser bars)
✓ Offline support
✓ Fast load times
✓ Works on any device

### How It Works

1. **manifest.json** - App metadata
   - Name, icon, theme colors
   - Display mode (standalone)
   - Screenshot

2. **Service Worker (sw.js)** - Background magic
   - Caches app assets
   - Works offline
   - Syncs data in background

3. **HTTPS** (Production only)
   - Required for app install
   - HTTP works for local dev

### Install Steps

1. Open app in Safari
2. Tap Share → Add to Home Screen
3. Tap Add
4. App appears on home screen
5. Opens full screen (no address bar)
6. Works offline!

---

## 💾 Storage

### IndexedDB (Local Files)

Maximum storage: ~50MB-500MB depending on device

```javascript
// Stored structure
{
  title: "Song Name",
  artist: "Artist Name",
  duration: 243,
  url: "blob:...",  // Local playable URL
  size: 5242880,    // Bytes
  uploadedAt: 1719859200000
}
```

### LocalStorage (Spotify Token)

```javascript
localStorage.spotify_access_token   // Auth token
localStorage.spotify_refresh_token  // Refresh token
localStorage.spotify_expires_at     // Expiration time
```

### Clear Storage

```javascript
// Clear all local files
await FileUploader.clearStorage();

// Clear Spotify tokens
localStorage.removeItem('spotify_access_token');
```

---

## 🎨 Customization

### Change Colors

Edit `styles.css`:

```css
/* Main background */
.device-frame {
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
}

/* Play button (Spotify green) */
.play-btn {
  background: linear-gradient(135deg, #1db954, #1aa34a);
}

/* Wheel color */
.center-button {
  background: radial-gradient(circle at 35% 35%, #555, #222);
}
```

### Change Device Size

Edit `styles.css`:

```css
.device-frame {
  max-width: 360px;  /* Change this */
}
```

### Add More Features

- Shuffle/repeat modes
- Search functionality
- Playlist creation
- Equalizer
- Now Playing animations
- Album art display
- Dark/light theme toggle

---

## 🐛 Debugging

### Enable Debug Mode

Edit `config.js`:

```javascript
DEBUG: true
```

Then check browser console (F12 → Console):

```
Config loaded: { spotifyConfigured: true, ... }
[Audio] Now playing: song.mp3
[Wheel] Rotation: 45deg
```

### Common Issues

**Scroll wheel not working**
- Check touch events in DevTools
- Verify `touch-action: none` in CSS
- Test on real device (mouse simulation may not work well)

**Files not playing**
- Check browser console for errors
- Ensure audio format is supported (MP3 best)
- Verify file isn't corrupted

**Spotify not connecting**
- Is Client ID set in config.js?
- Check network tab in DevTools
- Verify redirect URI matches exactly

**App won't install to home screen**
- Need HTTPS in production (HTTP works locally)
- Check manifest.json loads (DevTools → Application)
- Try different browser (Safari best on iOS)

---

## 🚀 Deployment

### Deploy to GitHub Pages

```bash
git remote add origin https://github.com/yourusername/ipod-web-app.git
git push -u origin master
```

Then enable GitHub Pages in repo settings → Pages section.

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Your Server

```bash
# Copy files to web server
scp -r . user@server:/var/www/ipod-web-app/

# Make sure HTTPS is enabled
# Update callback URI in Spotify dashboard
```

---

## 📊 Performance Tips

1. **Compress audio files** before uploading
   - MP3 at 128kbps = high quality, small size
   - Use `ffmpeg`: `ffmpeg -i input.wav -b:a 128k output.mp3`

2. **Limit playlist size**
   - 100+ songs = slower navigation
   - Consider paginating large lists

3. **Use WebWorkers** for ZIP extraction
   - Currently synchronous, can block UI
   - For large ZIPs, move to worker thread

4. **Lazy load metadata**
   - Don't parse all files immediately
   - Load on demand as user scrolls

---

## 🎯 Next Steps

1. **Test on your iPhone** - Install and use!
2. **Set up Spotify** - Follow SETUP.md guide
3. **Deploy online** - Share with friends
4. **Customize** - Change colors, add features
5. **Submit to GitHub** - Share your version!

---

## 📝 License

This project is open source. Feel free to modify and share!

---

## ❓ Questions?

Check:
- README.md - Project overview
- SETUP.md - Installation guide  
- Code comments - Technical details
- Browser console - Debug info

Happy listening! 🎵
