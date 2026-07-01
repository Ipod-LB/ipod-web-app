# iPod Web App

A modern web-based iPod emulator for iPhone with full haptic feedback, circular scroll wheel control, and support for both Spotify playlists and local audio file uploads.

## Features

- **Classic iPod Interface**: Authentic scroll wheel interaction with haptic feedback
- **Spotify Integration**: Connect your Spotify account and play your playlists (Spotify Premium required for direct playback)
- **Local File Support**: Upload MP3s or ZIP files to play offline
- **PWA Ready**: Add to home screen, works offline
- **Haptic Feedback**: Touch vibration on every interaction
- **Responsive Design**: Optimized for iPhone

## Tech Stack

- Vanilla JavaScript (for performance & lightweight)
- HTML5 Audio API
- Spotify Web API
- IndexedDB (browser storage)
- Service Worker (PWA & offline)

## Installation & Setup

```bash
git clone https://github.com/yourusername/ipod-web-app.git
cd ipod-web-app
npx http-server . -p 8000
```

Visit `http://localhost:8000` on your iPhone and add to home screen.

## Spotify Setup

1. Go to https://developer.spotify.com/dashboard
2. Create an app to get `Client ID`
3. Add redirect URI: `[your-domain]/callback.html`
4. Update `config.js` with your Client ID

## Local Development

Perfect for testing on desktop or iPhone dev mode.
