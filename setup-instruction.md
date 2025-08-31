# Chrome Extension Setup Instructions

## Step-by-Step Development Setup

### 1. Prepare Development Environment

1. **Open Chrome Browser**
2. **Navigate to Extensions Page**: Go to `chrome://extensions/`
3. **Enable Developer Mode**: Toggle the "Developer mode" switch in the top right

### 2. Load the Extension

1. **Click "Load unpacked"** button
2. **Select the project folder** containing manifest.json
3. **Confirm installation** - the extension will appear in your extensions list

### 3. Test the Extension

1. **Visit any website** with video content (YouTube, news sites, etc.)
2. **Click the extension icon** in the Chrome toolbar
3. **View detected videos** in the popup interface
4. **Test download functionality** by clicking download buttons

### 4. Development Workflow

#### Making Changes
1. **Edit source files** (content.js, popup.js, background.js)
2. **Go to chrome://extensions/**
3. **Click the refresh icon** on your extension card
4. **Test changes** by opening the popup or visiting websites

#### Debugging
1. **Right-click extension icon** → "Inspect popup" for popup debugging
2. **Go to chrome://extensions/** → "background page" for background script debugging
3. **Use browser DevTools** → Console for content script debugging

### 5. Adding Icons (Optional)

Create PNG icons in the `icons/` folder:
- `icon16.png` (16x16)
- `icon32.png` (32x32) 
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Or use the provided SVG icon as a template.

### 6. Publishing to Chrome Web Store

#### Prerequisites
1. **Chrome Web Store Developer Account** ($5 one-time fee)
2. **Extension package** (.zip file)
3. **Store listing assets** (screenshots, descriptions)

#### Steps
1. **Create developer account** at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **Package extension**: Zip all files except development files
3. **Upload package** to dashboard
4. **Complete store listing**: Add descriptions, screenshots, privacy policy
5. **Submit for review**: Chrome will review for compliance
6. **Publish**: After approval, extension goes live

## File Structure Overview

```
video-downloader-extension/
├── manifest.json          # Extension configuration
├── content.js            # Runs on web pages to detect videos
├── background.js         # Handles downloads and background tasks
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # Documentation
```

## Key Development Concepts

### Manifest V3
- Modern Chrome extension format
- Service worker-based background scripts
- Enhanced security and performance

### Content Scripts
- Run in webpage context
- Can access DOM elements
- Detect video elements and sources

### Background Scripts  
- Handle downloads and API calls
- Manage extension state
- Process user actions

### Popup Interface
- User interaction point
- Display detected videos
- Control download operations

## Common Issues & Solutions

### Videos Not Detected
- **Check permissions**: Ensure `activeTab` and host permissions are set
- **Verify content script injection**: Check if content.js is loading
- **Test on different sites**: Some sites may block detection

### Downloads Failing
- **Check URL validity**: Ensure video URLs are accessible
- **Verify permissions**: `downloads` permission must be granted
- **Test file naming**: Invalid characters in filenames can cause failures

### Extension Not Loading
- **Check manifest syntax**: JSON must be valid
- **Verify file paths**: All referenced files must exist
- **Review console errors**: Check Chrome DevTools for error messages

## Advanced Features to Add

### Enhanced Detection
- Network request interception
- Video player API integration
- Streaming protocol support

### UI Improvements
- Video thumbnails
- Batch selection
- Custom download directories

### Performance Optimization
- Debounced detection
- Memory management
- Background processing