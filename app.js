/**
 * Main Application Logic
 * Controls iPod UI and integrates all modules
 */
const App = (() => {
  const DOM = {
    appContainer: document.getElementById('app-container'),
    scrollWheel: document.getElementById('scrollWheel'),
    centerButton: document.getElementById('centerButton'),
    playBtn: document.getElementById('playBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    fileInput: document.getElementById('fileInput'),
    spotifyBtn: document.getElementById('spotifyBtn'),
    uploadModal: document.getElementById('uploadModal'),
    closeModal: document.getElementById('closeModal')
  };

  // State
  let wheelRotation = 0;
  let isDragging = false;
  let lastAngle = 0;

  // Initialize
  const init = async () => {
    await FileUploader.initDB();
    setupEventListeners();
    renderUI();
    showEmptyState();
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Wheel controls
    DOM.scrollWheel.addEventListener('touchstart', handleWheelStart, false);
    DOM.scrollWheel.addEventListener('touchmove', handleWheelMove, false);
    DOM.scrollWheel.addEventListener('touchend', handleWheelEnd, false);

    // Mouse support (for development)
    DOM.scrollWheel.addEventListener('mousedown', handleWheelStart, false);
    document.addEventListener('mousemove', handleWheelMove, false);
    document.addEventListener('mouseup', handleWheelEnd, false);

    // Center button
    DOM.centerButton.addEventListener('click', handleCenterClick);

    // Control buttons
    DOM.playBtn.addEventListener('click', togglePlayPause);
    DOM.prevBtn.addEventListener('click', handlePrev);
    DOM.nextBtn.addEventListener('click', handleNext);

    // File upload
    DOM.fileInput.addEventListener('change', handleFileUpload);
    DOM.spotifyBtn.addEventListener('click', () => Spotify.login());

    // Modal
    DOM.closeModal.addEventListener('click', closeModal);
    DOM.uploadModal.addEventListener('click', (e) => {
      if (e.target === DOM.uploadModal) closeModal();
    });

    // Audio events
    AudioManager.on('trackChanged', updateUI);
    AudioManager.on('play', updatePlayButton);
    AudioManager.on('pause', updatePlayButton);
    AudioManager.on('timeupdate', updateTime);
  };

  // Wheel handling
  const getAngleFromEvent = (e) => {
    const rect = DOM.scrollWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.touches ? e.touches[0].clientX : e.clientX) - centerX;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - centerY;

    return Math.atan2(y, x);
  };

  const handleWheelStart = (e) => {
    isDragging = true;
    lastAngle = getAngleFromEvent(e);
    DOM.scrollWheel.classList.add('rotating');
    triggerHaptic('light');
  };

  const handleWheelMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const currentAngle = getAngleFromEvent(e);
    let angleDelta = currentAngle - lastAngle;

    // Normalize angle delta
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

    // Update wheel rotation
    wheelRotation += angleDelta;

    // Rotate visual wheel
    DOM.scrollWheel.style.transform = `rotate(${wheelRotation * 180 / Math.PI}deg)`;

    // Navigate playlist based on rotation (every ~0.5 rad = next track)
    const trackChange = Math.floor(angleDelta / 0.5);
    if (trackChange !== 0) {
      if (trackChange > 0) {
        navigatePlaylist(1);
      } else {
        navigatePlaylist(-1);
      }
      triggerHaptic();
    }

    lastAngle = currentAngle;
  };

  const handleWheelEnd = (e) => {
    isDragging = false;
    DOM.scrollWheel.classList.remove('rotating');
  };

  // Navigate playlist by scroll wheel
  const navigatePlaylist = (direction) => {
    const playlist = AudioManager.getPlaylist();
    if (playlist.length === 0) return;

    let nextIndex = AudioManager.getState().currentIndex + direction;
    nextIndex = (nextIndex + playlist.length) % playlist.length;

    AudioManager.loadTrack(nextIndex);
    triggerHaptic();
  };

  // Center button click
  const handleCenterClick = () => {
    triggerHaptic('medium');
    showModal();
  };

  // Play/pause
  const togglePlayPause = () => {
    const playlist = AudioManager.getPlaylist();
    if (playlist.length === 0) {
      showModal();
      return;
    }

    AudioManager.togglePlay();
    triggerHaptic('light');
  };

  // Previous track
  const handlePrev = () => {
    AudioManager.prevTrack();
    triggerHaptic();
  };

  // Next track
  const handleNext = () => {
    AudioManager.nextTrack();
    triggerHaptic();
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    triggerHaptic('medium');
    const uploadBtn = e.target.parentElement;
    const originalText = uploadBtn.textContent;
    uploadBtn.innerHTML = '<div class="loading"></div> Importing...';

    try {
      const uploaded = await FileUploader.handleFiles(files);
      
      if (uploaded.length > 0) {
        // Load uploaded files into playlist
        const stored = await FileUploader.getStoredFiles();
        const playlist = stored.map(f => ({
          title: f.title,
          artist: f.artist,
          duration: f.duration,
          url: f.url
        }));

        AudioManager.loadPlaylist(playlist);
        closeModal();
        triggerHaptic('success');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading files: ' + err.message);
      triggerHaptic('error');
    } finally {
      uploadBtn.textContent = originalText;
      DOM.fileInput.value = '';
    }
  };

  // UI Updates
  const updateUI = (track) => {
    if (!track) {
      showEmptyState();
      return;
    }

    const state = AudioManager.getState();
    const minutes = Math.floor(state.duration / 60);
    const seconds = Math.floor(state.duration % 60);

    DOM.appContainer.innerHTML = `
      <div class="song-title">${escapeHtml(track.title)}</div>
      <div class="song-artist">${escapeHtml(track.artist)}</div>
      <div class="song-time">0:00 / ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</div>
    `;
  };

  const updateTime = ({ currentTime, duration }) => {
    const timeEl = DOM.appContainer.querySelector('.song-time');
    if (!timeEl) return;

    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const totalMins = Math.floor(duration / 60);
    const totalSecs = Math.floor(duration % 60);

    timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} / ${String(totalMins).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;
  };

  const updatePlayButton = () => {
    const state = AudioManager.getState();
    if (state.isPlaying) {
      DOM.playBtn.classList.add('playing');
      DOM.playBtn.textContent = '⏸';
    } else {
      DOM.playBtn.classList.remove('playing');
      DOM.playBtn.textContent = '▶';
    }
  };

  const showEmptyState = () => {
    DOM.appContainer.innerHTML = `
      <div class="empty-state">
        <div>iPod</div>
        <p style="font-size: 12px; margin-top: 8px; color: #666;">Click center wheel<br>to add music</p>
      </div>
    `;
  };

  // Modal
  const showModal = () => {
    DOM.uploadModal.classList.remove('hidden');
    triggerHaptic();
  };

  const closeModal = () => {
    DOM.uploadModal.classList.add('hidden');
  };

  // Haptic feedback
  const triggerHaptic = (intensity = 'light') => {
    if (!navigator.vibrate) return;

    const patterns = {
      light: 20,
      medium: 40,
      heavy: 60,
      success: [30, 20, 30],
      error: [100, 50, 100]
    };

    const pattern = patterns[intensity] || patterns.light;
    navigator.vibrate(pattern);
  };

  // Utility
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return {
    init,
    triggerHaptic
  };
})();

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
