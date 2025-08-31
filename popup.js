// Popup script for Video Downloader Plus
class VideoDownloaderPopup {
  constructor() {
    this.videos = [];
    this.downloads = new Map();
    this.init();
  }

  async init() {
    await this.loadDetectedVideos();
    this.setupEventListeners();
    this.startVideoDetection();
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.refreshVideoDetection();
    });

    // Listen for download progress updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'DOWNLOAD_PROGRESS') {
        this.updateDownloadProgress(message.videoId, message.progress);
      } else if (message.type === 'DOWNLOAD_COMPLETE') {
        this.handleDownloadComplete(message.videoId);
      } else if (message.type === 'DOWNLOAD_ERROR') {
        this.handleDownloadError(message.videoId, message.error);
      }
    });
  }

  async loadDetectedVideos() {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Request videos from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEOS' });
      
      if (response && response.videos) {
        this.videos = response.videos;
        this.renderVideos();
      } else {
        this.showNoVideos();
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      this.showNoVideos();
    }
  }

  async startVideoDetection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if not already present
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Start detection
      await chrome.tabs.sendMessage(tab.id, { type: 'START_DETECTION' });
      
      // Poll for updates every 2 seconds
      setInterval(() => {
        this.loadDetectedVideos();
      }, 2000);
    } catch (error) {
      console.error('Error starting video detection:', error);
    }
  }

  renderVideos() {
    const container = document.getElementById('videos-list');
    const noVideos = document.getElementById('no-videos');
    const scanningStatus = document.getElementById('scanning-status');
    const videoCount = document.getElementById('video-count');

    if (this.videos.length === 0) {
      this.showNoVideos();
      return;
    }

    // Hide no videos message and update status
    noVideos.classList.add('hidden');
    scanningStatus.classList.add('hidden');
    videoCount.textContent = `${this.videos.length} video${this.videos.length !== 1 ? 's' : ''} detected`;

    // Clear container
    container.innerHTML = '';

    // Render each video
    this.videos.forEach((video, index) => {
      const videoCard = this.createVideoCard(video, index);
      container.appendChild(videoCard);
    });
  }

  createVideoCard(video, index) {
    const card = document.createElement('div');
    card.className = 'video-card bg-white rounded-lg border border-gray-200 p-4 cursor-pointer';
    
    const isDownloading = this.downloads.has(video.id);
    const downloadProgress = this.downloads.get(video.id) || 0;

    card.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900 truncate">
              ${video.title || `Video ${index + 1}`}
            </h3>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${video.format?.toUpperCase() || 'MP4'}
            </span>
          </div>
          
          <p class="text-xs text-gray-500 mt-1">
            ${video.duration || 'Unknown duration'} • ${this.formatFileSize(video.size)}
          </p>
          
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500">Quality:</span>
              <span class="text-xs font-medium text-gray-700">${video.quality || 'Auto'}</span>
            </div>
            
            <button 
              class="download-btn ${isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
              ${isDownloading ? 'disabled' : ''}
              data-video-id="${video.id}"
              data-video-url="${video.url}"
              data-video-title="${video.title || `video_${index + 1}`}"
            >
              ${isDownloading ? `
                <svg class="w-3 h-3 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>${downloadProgress}%</span>
              ` : `
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Download</span>
              `}
            </button>
          </div>
          
          ${isDownloading ? `
            <div class="mt-2">
              <div class="w-full bg-gray-200 rounded-full h-1">
                <div class="progress-bar bg-blue-600 h-1 rounded-full" style="width: ${downloadProgress}%"></div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Add download event listener
    const downloadBtn = card.querySelector('.download-btn');
    if (downloadBtn && !isDownloading) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadVideo(video);
      });
    }

    return card;
  }

  showNoVideos() {
    const container = document.getElementById('videos-list');
    const noVideos = document.getElementById('no-videos');
    const scanningStatus = document.getElementById('scanning-status');
    
    container.innerHTML = '';
    noVideos.classList.remove('hidden');
    scanningStatus.classList.add('hidden');
    
    document.getElementById('video-count').textContent = '0 videos detected';
  }

  async downloadVideo(video) {
    try {
      // Start download progress tracking
      this.downloads.set(video.id, 0);
      this.renderVideos(); // Re-render to show progress

      // Send download request to background script
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_VIDEO',
        video: video
      });

      if (response.success) {
        console.log('Download started successfully');
      } else {
        throw new Error(response.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      this.downloads.delete(video.id);
      this.showNotification('Download failed: ' + error.message, 'error');
      this.renderVideos();
    }
  }

  updateDownloadProgress(videoId, progress) {
    if (this.downloads.has(videoId)) {
      this.downloads.set(videoId, progress);
      this.renderVideos();
    }
  }

  handleDownloadComplete(videoId) {
    this.downloads.delete(videoId);
    this.showNotification('Download completed successfully!', 'success');
    this.renderVideos();
  }

  handleDownloadError(videoId, error) {
    this.downloads.delete(videoId);
    this.showNotification('Download failed: ' + error, 'error');
    this.renderVideos();
  }

  async refreshVideoDetection() {
    document.getElementById('scanning-status').classList.remove('hidden');
    document.getElementById('scan-text').textContent = 'Rescanning for videos...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_DETECTION' });
      
      setTimeout(() => {
        this.loadDetectedVideos();
      }, 1000);
    } catch (error) {
      console.error('Error refreshing detection:', error);
    }
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-3 rounded-lg text-white text-sm z-50 ${
      type === 'success' ? 'bg-green-600' : 
      type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VideoDownloaderPopup();
});