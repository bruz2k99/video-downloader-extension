// Content script for detecting videos on web pages
class VideoDetector {
  constructor() {
    this.detectedVideos = [];
    this.videoId = 0;
    this.observer = null;
    this.init();
  }

  init() {
    this.detectVideos();
    this.setupMutationObserver();
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'GET_VIDEOS':
          sendResponse({ videos: this.detectedVideos });
          break;
        case 'START_DETECTION':
          this.detectVideos();
          sendResponse({ success: true });
          break;
        case 'REFRESH_DETECTION':
          this.refreshDetection();
          sendResponse({ success: true });
          break;
      }
    });
  }

  detectVideos() {
    const videos = [];
    
    // Detect HTML5 video elements
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.src && !video.src.startsWith('blob:')) {
        videos.push(this.createVideoInfo(video.src, video, 'video'));
      }
      
      // Check source elements within video
      const sources = video.querySelectorAll('source');
      sources.forEach(source => {
        if (source.src && !source.src.startsWith('blob:')) {
          videos.push(this.createVideoInfo(source.src, video, 'source'));
        }
      });
    });

    // Detect embedded videos (iframe)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.src;
      if (this.isVideoIframe(src)) {
        videos.push(this.createVideoInfo(src, iframe, 'iframe'));
      }
    });

    // Detect background videos and other media
    this.detectBackgroundVideos(videos);
    
    // Detect streaming videos
    this.detectStreamingVideos(videos);

    // Remove duplicates and update list
    this.detectedVideos = this.removeDuplicateVideos(videos);
  }

  createVideoInfo(url, element, type) {
    const videoInfo = {
      id: ++this.videoId,
      url: url,
      title: this.extractVideoTitle(element, url),
      duration: this.getVideoDuration(element),
      quality: this.getVideoQuality(element),
      format: this.getVideoFormat(url),
      size: this.getVideoSize(element),
      type: type,
      element: element
    };

    return videoInfo;
  }

  extractVideoTitle(element, url) {
    // Try to get title from various sources
    let title = '';
    
    // Check element attributes
    title = element.title || element.alt || element.getAttribute('data-title');
    
    // Check nearby text content
    if (!title) {
      const parent = element.closest('figure, div, section');
      if (parent) {
        const titleElement = parent.querySelector('h1, h2, h3, h4, h5, h6, .title, [class*="title"]');
        if (titleElement) {
          title = titleElement.textContent.trim();
        }
      }
    }
    
    // Check page title as fallback
    if (!title) {
      title = document.title;
    }
    
    // Extract from URL as last resort
    if (!title) {
      const urlParts = url.split('/');
      title = urlParts[urlParts.length - 1].split('?')[0];
    }
    
    return title.substring(0, 50) + (title.length > 50 ? '...' : '');
  }

  getVideoDuration(element) {
    if (element.tagName === 'VIDEO' && element.duration && !isNaN(element.duration)) {
      const minutes = Math.floor(element.duration / 60);
      const seconds = Math.floor(element.duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return 'Unknown';
  }

  getVideoQuality(element) {
    if (element.tagName === 'VIDEO') {
      const width = element.videoWidth || element.width;
      const height = element.videoHeight || element.height;
      
      if (width && height) {
        if (height >= 2160) return '4K';
        if (height >= 1440) return '1440p';
        if (height >= 1080) return '1080p';
        if (height >= 720) return '720p';
        if (height >= 480) return '480p';
        return `${width}x${height}`;
      }
    }
    return 'Auto';
  }

  getVideoFormat(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    const videoFormats = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v'];
    
    if (videoFormats.includes(extension)) {
      return extension;
    }
    
    // Check for common streaming formats
    if (url.includes('.m3u8')) return 'HLS';
    if (url.includes('.mpd')) return 'DASH';
    
    return 'mp4'; // Default
  }

  getVideoSize(element) {
    // This is an estimate - real size would need to be fetched
    if (element.tagName === 'VIDEO') {
      const duration = element.duration || 60; // Default 1 minute
      const quality = this.getVideoQuality(element);
      
      // Rough estimates based on quality
      const bitrateEstimates = {
        '4K': 25000000,      // 25 Mbps
        '1440p': 16000000,   // 16 Mbps
        '1080p': 8000000,    // 8 Mbps
        '720p': 5000000,     // 5 Mbps
        '480p': 2500000,     // 2.5 Mbps
        'Auto': 5000000      // Default 5 Mbps
      };
      
      const bitrate = bitrateEstimates[quality] || bitrateEstimates['Auto'];
      return Math.floor((bitrate * duration) / 8); // Convert to bytes
    }
    
    return null;
  }

  isVideoIframe(src) {
    const videoSites = [
      'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
      'twitch.tv', 'facebook.com', 'instagram.com', 'tiktok.com'
    ];
    
    return videoSites.some(site => src.includes(site));
  }

  detectBackgroundVideos(videos) {
    // Check for CSS background videos
    const elementsWithBgVideo = document.querySelectorAll('*');
    elementsWithBgVideo.forEach(element => {
      const style = getComputedStyle(element);
      const backgroundImage = style.backgroundImage;
      
      if (backgroundImage && backgroundImage.includes('url(')) {
        const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch) {
          const url = urlMatch[1];
          if (this.isVideoUrl(url)) {
            videos.push(this.createVideoInfo(url, element, 'background'));
          }
        }
      }
    });
  }

  detectStreamingVideos(videos) {
    // Intercept network requests (this is limited in content scripts)
    // In a real implementation, you'd need to use webRequest API in background script
    
    // Check for common streaming video patterns in page source
    const pageContent = document.documentElement.outerHTML;
    
    // Look for .m3u8 (HLS) URLs
    const hlsMatches = pageContent.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g);
    if (hlsMatches) {
      hlsMatches.forEach(url => {
        videos.push(this.createVideoInfo(url, document.body, 'hls'));
      });
    }
    
    // Look for .mpd (DASH) URLs
    const dashMatches = pageContent.match(/https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/g);
    if (dashMatches) {
      dashMatches.forEach(url => {
        videos.push(this.createVideoInfo(url, document.body, 'dash'));
      });
    }
  }

  isVideoUrl(url) {
    const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', 'm3u8', 'mpd'];
    const urlLower = url.toLowerCase();
    
    return videoExtensions.some(ext => 
      urlLower.includes(`.${ext}`) || urlLower.includes(`${ext}?`)
    );
  }

  removeDuplicateVideos(videos) {
    const seen = new Set();
    return videos.filter(video => {
      const key = video.url;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  setupMutationObserver() {
    // Watch for dynamically added video content
    this.observer = new MutationObserver((mutations) => {
      let shouldRefresh = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            
            // Check if the added node is a video or contains videos
            if (element.tagName === 'VIDEO' || 
                element.tagName === 'IFRAME' ||
                element.querySelector('video, iframe')) {
              shouldRefresh = true;
            }
          }
        });
      });
      
      if (shouldRefresh) {
        setTimeout(() => this.detectVideos(), 500); // Debounce
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  refreshDetection() {
    this.detectedVideos = [];
    this.videoId = 0;
    this.detectVideos();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize video detector
let videoDetector;

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    videoDetector = new VideoDetector();
  });
} else {
  videoDetector = new VideoDetector();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (videoDetector) {
    videoDetector.destroy();
  }
});