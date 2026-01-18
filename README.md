# S.EE Browser Extension

A cross-browser extension for [S.EE](https://s.ee) - URL shortening, text sharing, and file hosting service.

## Features

- **URL Shortening**: Shorten any URL with custom slugs and multiple domain options
- **Text Sharing**: Share code snippets and text with syntax highlighting support
- **File Upload**: Batch upload files with multiple export formats (Plain/Markdown/HTML/BBCode)
- **QR Code Generation**: Generate and export QR codes in PNG, SVG, or PDF format
- **Context Menus**: Right-click to shorten pages/links, show QR codes, share text, upload images
- **History Management**: Track and manage URLs, texts, and files with batch operations
- **Draft Persistence**: Input fields are saved automatically across sessions
- **Dark/Light Theme**: Automatic theme detection with manual toggle
- **Cross-Browser**: Works on Chrome (MV3) and Firefox (MV3)

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/sdotee/browser-extensions.git
   cd browser-extensions
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the extension:
   ```bash
   # For Chrome
   bun run build

   # For Firefox
   bun run build:firefox
   ```

4. Load the extension:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select `.output/chrome-mv3/`
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", select `.output/firefox-mv3/manifest.json`

## Usage

### Getting Started

1. Click the S.EE extension icon in your browser toolbar
2. Enter your API token (get one at [s.ee/user/developers](https://s.ee/user/developers/))
3. Click "Save Token & Continue"

### URL Shortening

- **Current Page**: Click "Shorten URL" to shorten the active tab's URL
- **Custom URL**: Enter any URL to shorten
- **Custom Slug**: Enable custom slug to create memorable short URLs

### Text Sharing

- Enter text or code to share
- Optional title (defaults to "Untitled")
- Select text type for syntax highlighting

### File Upload

- Drag & drop or select files (supports batch upload)
- Individual copy buttons for each uploaded file
- Batch copy with format options:
  - Plain URLs
  - Markdown links
  - HTML links
  - BBCode links
- Optional filename inclusion in export

### Context Menu Actions

Right-click on any page to access:
- **Shorten This Page** - Shorten current page URL
- **Shorten This Link** - Shorten a link (when right-clicking on links)
- **Show QR Code** - Generate QR code for page/link
- **Share Selected Text** - Share highlighted text
- **Upload Image to S.EE** - Upload image with automatic WebP conversion

### History

- Tab-aware history for URLs, Texts, and Files
- Copy, open, or delete individual items
- Batch select and delete multiple items
- Clear all history per category

## Development

```bash
# Install dependencies
bun install

# Development mode with hot reload
bun run dev          # Chrome
bun run dev:firefox  # Firefox

# Build for production
bun run build          # Chrome
bun run build:firefox  # Firefox
```

### Project Structure

```
see-chrome-extension/
├── entrypoints/
│   ├── popup/
│   │   ├── index.html    # Popup UI structure
│   │   ├── main.ts       # Core popup logic
│   │   └── style.css     # Styles with theme support
│   └── background.ts     # Service worker for context menus
├── utils/
│   ├── sdk.ts            # S.EE API client
│   └── storage.ts        # Browser storage utilities
├── public/
│   └── icons/            # Extension icons
├── wxt.config.ts         # WXT configuration
├── scripts/
│   └── release.sh        # Release packaging script
└── .output/              # Built extensions
    ├── chrome-mv3/       # Chrome build
    ├── firefox-mv3/      # Firefox build
    └── release/          # Packaged releases (.zip, .xpi)
```

### Tech Stack

- [WXT](https://wxt.dev/) - Next-gen Web Extension Framework
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [QRCode.js](https://github.com/soldair/node-qrcode)
- [jsPDF](https://github.com/parallax/jsPDF)
- [html2canvas](https://html2canvas.hertzen.com/)
- [DOMPurify](https://github.com/cure53/DOMPurify)

## Privacy

This extension:
- Only communicates with the S.EE API (https://s.ee)
- Stores your API token and preferences in browser sync storage
- Stores history locally on your device
- Does not collect or transmit any personal data

## License

MIT License

## Links

- [S.EE Website](https://s.ee)
- [Get API Token](https://s.ee/user/developers/)
- [Manage Your Links](https://s.ee/user/links/)
