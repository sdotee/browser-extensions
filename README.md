# S.EE - URL Shortener & QR Code Generator

A powerful Chrome extension for shortening URLs and generating QR codes using the [S.EE](https://s.ee) service.

## Features

- **One-Click URL Shortening** - Shorten the current page URL with a single click
- **Custom URL Input** - Enter any URL to shorten, not just the current page
- **Custom Slugs** - Create memorable short URLs with custom slugs
- **Multiple Domains** - Choose from your available S.EE domains
- **QR Code Generation** - Generate QR codes for any shortened URL
- **QR Code Export** - Download QR codes in PNG, SVG, or PDF format (512x512)
- **Right-Click Menu** - Shorten URLs or generate QR codes directly from context menu
- **History Management** - View, copy, and manage your shortened URLs with pagination
- **Auto-Copy** - Automatically copy shortened URLs to clipboard
- **Dark/Light Mode** - Seamless theme switching based on your preference
- **Desktop Notifications** - Get notified when URLs are shortened via context menu

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right corner
6. Click "Load unpacked" and select the `dist` folder

## Usage

### Getting Started
1. Click the S.EE extension icon in your browser toolbar
2. Enter your API token (get one at [s.ee/user/developers](https://s.ee/user/developers/))
3. Click "Save Token & Continue"

### Shortening URLs
- **Current Page**: Click "Shorten URL" to shorten the active tab's URL
- **Custom URL**: Switch to "Custom URL" tab and enter any URL to shorten
- **Custom Slug**: Enable "Use custom slug" to create a memorable short URL

### Right-Click Menu
Right-click on any page or link to access:
- **Shorten this page/link** - Creates a short URL and copies to clipboard
- **Generate QR Code for this page/link** - Creates a short URL and prepares QR code

### QR Codes
- QR codes are automatically generated for each shortened URL
- Export in PNG, SVG, or PDF format
- Copy QR code image directly to clipboard
- Access QR codes for historical links from the history section

### History
- View all your shortened URLs with pagination (10 per page)
- Copy, open, or delete individual links
- Batch select and delete multiple links
- Clear all history with one click

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode with watch
npm run dev
```

### Project Structure
```
see-chrome-extension/
├── src/
│   ├── main.ts        # Main popup logic
│   ├── background.ts  # Service worker for context menu
│   ├── sdk.ts         # S.EE API client
│   ├── storage.ts     # Chrome storage utilities
│   └── styles.css     # Styles with dark/light theme
├── popup.html         # Extension popup UI
├── manifest.json      # Chrome extension manifest
├── icons/             # Extension icons
└── dist/              # Built extension (for installation)
```

### Tech Stack
- TypeScript
- Vite
- Chrome Extension Manifest V3
- QRCode.js
- jsPDF

## Privacy

This extension:
- Only communicates with the S.EE API (https://s.ee)
- Stores your API token and preferences in Chrome's sync storage
- Stores URL history locally on your device
- Does not collect or transmit any personal data

## License

MIT License

## Links

- [S.EE Website](https://s.ee)
- [Get API Token](https://s.ee/user/developers/)
- [Manage Your Links](https://s.ee/user/links/)
