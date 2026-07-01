/**
 * File Uploader Module
 * Handles local file uploads and ZIP extraction
 */
const FileUploader = (() => {
  // IndexedDB setup
  const dbName = 'iPodDB';
  const storeName = 'audioFiles';
  let db = null;

  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  // Get stored files
  const getStoredFiles = () => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  // Parse metadata from audio file
  const parseMetadata = async (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      const cleanup = () => URL.revokeObjectURL(url);

      audio.addEventListener('loadedmetadata', () => {
        cleanup();
        resolve({
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Unknown',
          duration: Math.round(audio.duration),
          type: file.type,
          size: file.size
        });
      });

      audio.addEventListener('error', () => {
        cleanup();
        resolve({
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Unknown',
          duration: 0,
          type: file.type,
          size: file.size
        });
      });

      audio.src = url;
    });
  };

  // Save file to IndexedDB
  const saveFile = (file, metadata, blob) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const url = URL.createObjectURL(blob);

      const record = {
        ...metadata,
        blob,
        url,
        uploadedAt: Date.now()
      };

      const request = store.add(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(record);
    });
  };

  // Handle audio files
  const handleAudioFiles = async (files) => {
    const results = [];
    
    for (const file of files) {
      try {
        if (!file.type.startsWith('audio/')) continue;

        const metadata = await parseMetadata(file);
        const blob = file.slice(0, file.size);
        const record = await saveFile(file, metadata, blob);
        results.push(record);
      } catch (err) {
        console.error('Error processing audio file:', err);
      }
    }

    return results;
  };

  // Extract and handle ZIP file
  const handleZipFile = async (zipFile) => {
    try {
      // Load JSZip if available, otherwise show error
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded. Please add <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>');
      }

      const zipData = await zipFile.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(zipData);

      const results = [];
      const files = [];

      // Extract audio files from ZIP
      zip.forEach((path, file) => {
        if (!file.dir && /\.(mp3|wav|ogg|m4a|flac)$/i.test(path)) {
          files.push({ path, file });
        }
      });

      // Process extracted files
      for (const { path, file } of files) {
        try {
          const blob = await file.async('blob');
          const audioFile = new File([blob], path.split('/').pop(), {
            type: blob.type || 'audio/mpeg'
          });

          const metadata = await parseMetadata(audioFile);
          const record = await saveFile(audioFile, metadata, blob);
          results.push(record);
        } catch (err) {
          console.error(`Error processing ${path}:`, err);
        }
      }

      return results;
    } catch (err) {
      throw new Error(`ZIP extraction failed: ${err.message}`);
    }
  };

  // Handle file input
  const handleFiles = async (fileList) => {
    await initDB();
    const results = [];

    for (const file of fileList) {
      try {
        if (file.type.startsWith('audio/')) {
          const record = await handleAudioFiles([file]);
          results.push(...record);
        } else if (file.name.endsWith('.zip')) {
          const record = await handleZipFile(file);
          results.push(...record);
        }
      } catch (err) {
        console.error('File handling error:', err);
      }
    }

    return results;
  };

  // Clear stored files
  const clearStorage = () => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  // Get storage info
  const getStorageInfo = async () => {
    const files = await getStoredFiles();
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    return {
      fileCount: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  };

  return {
    initDB,
    handleFiles,
    getStoredFiles,
    clearStorage,
    getStorageInfo
  };
})();

// Load JSZip for ZIP support
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
script.async = true;
document.head.appendChild(script);
