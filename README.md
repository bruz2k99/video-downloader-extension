# video-downloader-extension
Download any videos from any website.
# Video Downloader Plus Chrome Extension

A powerful Chrome extension that automatically detects and downloads videos from any website.

## Features

- **Automatic Video Detection**: Scans web pages for video content in real-time
- **Multiple Format Support**: Supports MP4, WebM, AVI, MOV, and streaming formats (HLS, DASH)
- **Quality Detection**: Automatically identifies video quality (4K, 1080p, 720p, etc.)
- **Clean Interface**: Modern popup UI with download progress tracking
- **Background Downloads**: Uses Chrome's download API for reliable downloads
- **Smart Naming**: Automatically generates meaningful filenames
- **Real-time Updates**: Detects dynamically loaded videos

## Installation

### Development Installation

1. Clone or download this project
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension will appear in your extensions list

### Production Installation

1. Package the extension files into a .zip
2. Upload to Chrome Web Store (requires developer account)
3. Follow Chrome Web Store review process

## How It Works

### Content Script Detection
The extension uses a content script that:
- Scans for HTML5 `<video>` elements
- Detects video sources in `<source>` tags
- Identifies embedded videos in iframes
- Monitors for dynamically added content
- Extracts video metadata (duration, quality, format)

### Background Processing
The background script handles:
- Secure download management
- Progress tracking
- Error handling
- File naming and organization

### Popup Interface
The popup provides:
- Real-time video listing
- Download controls
- Progress visualization
- Quality and format information

## Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Content       │    │   Background     │    │   Popup         │
│   Script        │◄──►│   Script         │◄──►│   Interface     │
│                 │    │                  │    │                 │
│ • Video         │    │ • Download       │    │ • UI Controls   │
│   Detection     │    │   Management     │    │ • Progress      │
│ • DOM           │    │ • File Handling  │    │   Display       │
│   Monitoring    │    │ • Notifications  │    │ • Video List    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Permissions Explained

- `activeTab`: Access current tab for video detection
- `downloads`: Manage file downloads
- `storage`: Store user preferences and download history
- `scripting`: Inject content scripts for video detection
- `host_permissions`: Access websites to detect videos

## Supported Video Types

### Direct Video Files
- MP4, WebM, AVI, MOV, WMV, FLV, MKV, M4V

### Streaming Formats
- HLS (.m3u8)
- DASH (.mpd)
- Progressive download

### Embedded Videos
- YouTube embeds
- Vimeo embeds
- Other iframe-based video players

## Development Guidelines

### Adding New Detection Methods

1. **Extend Content Script**: Add detection logic in `content.js`
2. **Update Video Info**: Modify `createVideoInfo()` method
3. **Test Across Sites**: Verify detection works on target websites

### Enhancing Download Features

1. **Background Script**: Modify `background.js` for new download options
2. **UI Updates**: Update `popup.html` and `popup.js` for new controls
3. **Permission Check**: Ensure manifest.json has required permissions

## Security Considerations

- All downloads go through Chrome's secure download API
- No direct file system access
- URLs are validated before download
- User consent required for each download

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)

## Legal Considerations

Always respect:
- Website terms of service
- Copyright laws
- Content creator rights
- Fair use policies

This extension is for educational purposes and legitimate video downloading needs.

## Future Enhancements

- Batch download functionality
- Custom download directories
- Video preview thumbnails
- Download scheduling
- Integration with cloud storage
- Video format conversion