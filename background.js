class VideoDownloaderBackground {
  constructor() {
    this.downloads = new Map();
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.setupDownloadListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'DOWNLOAD_VIDEO':
          this.handleDownloadRequest(message.video, sender, sendResponse);
          return true; // Keep message channel open for async response
        default:
          break;
      }
    });
  }

  setupDownloadListener() {
    // Listen for download progress and completion
    chrome.downloads.onChanged.addListener((downloadDelta) => {
      const downloadId = downloadDelta.id;
      
      if (this.downloads.has(downloadId)) {
        const videoId = this.downloads.get(downloadId);
        
        if (downloadDelta.state) {
          if (downloadDelta.state.current === 'complete') {
            this.downloads.delete(downloadId);
            this.notifyDownloadComplete(videoId);
          } else if (downloadDelta.state.current === 'interrupted') {
            this.downloads.delete(downloadId);
            this.notifyDownloadError(videoId, 'Download was interrupted');
          }
        }
        
        // Handle progress updates
        if (downloadDelta.bytesReceived) {
          chrome.downloads.search({ id: downloadId }, (results) => {
            if (results.length > 0) {
              const download = results[0];
              if (download.totalBytes > 0) {
                const progress = Math.round((download.bytesReceived / download.totalBytes) * 100);
                this.notifyDownloadProgress(videoId, progress);
              }
            }
          });
        }
      }
    });
  }

  async handleDownloadRequest(video, sender, sendResponse) {
    try {
      // Validate video URL
      if (!video.url || !this.isValidVideoUrl(video.url)) {
        throw new Error('Invalid video URL');
      }

      // Generate safe filename
      const filename = this.generateSafeFilename(video.title, video.format);
      
      // Start download
      const downloadId = await this.startDownload(video.url, filename);
      
      // Track download
      this.downloads.set(downloadId, video.id);
      
      sendResponse({ success: true, downloadId });
    } catch (error) {
      console.error('Download error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async startDownload(url, filename) {
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: url,
        filename: `Video Downloads/${filename}`,
        saveAs: false, // Automatically save to default downloads folder
        conflictAction: 'uniquify' // Add number if file exists
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      });
    });
  }

  generateSafeFilename(title, format) {
    // Clean title for safe filename
    let safeName = title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .trim();
    
    // Ensure reasonable length
    if (safeName.length > 50) {
      safeName = safeName.substring(0, 50);
    }
    
    // Add timestamp if name is too short
    if (safeName.length < 3) {
      safeName = `video_${Date.now()}`;
    }
    
    // Add extension
    const extension = format || 'mp4';
    return `${safeName}.${extension}`;
  }

  isValidVideoUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Check for valid protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Check for video file extensions or streaming formats
      const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', 'm3u8', 'mpd'];
      const hasVideoExtension = videoExtensions.some(ext => 
        url.toLowerCase().includes(`.${ext}`)
      );
      
      // Allow URLs that look like video streams even without extensions
      const isLikelyVideo = url.includes('video') || 
                           url.includes('stream') || 
                           url.includes('media') ||
                           hasVideoExtension;
      
      return isLikelyVideo;
    } catch {
      return false;
    }
  }

  notifyDownloadProgress(videoId, progress) {
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_PROGRESS',
      videoId: videoId,
      progress: progress
    });
  }

  notifyDownloadComplete(videoId) {
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_COMPLETE',
      videoId: videoId
    });
    
    // Show browser notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Video Download Complete',
      message: 'Your video has been downloaded successfully!'
    });
  }

  notifyDownloadError(videoId, error) {
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_ERROR',
      videoId: videoId,
      error: error
    });
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Video Download Failed',
      message: error
    });
  }
}

// Initialize background script
const videoDownloader = new VideoDownloaderBackground();

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Video Downloader Plus installed');
});