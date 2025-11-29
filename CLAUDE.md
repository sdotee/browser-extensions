# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install      # Install dependencies
npm run build    # Build extension to dist/
npm run dev      # Watch mode for development
```

After building, load `dist/` folder as unpacked extension in Chrome (`chrome://extensions/`).

To create release package:
```bash
cd dist && zip -r ../see-extension-v1.0.0.zip .
```

## Architecture

Chrome Extension (Manifest V3) for S.EE URL shortening service with QR code generation.

### Entry Points

- **popup.html + src/main.ts**: Extension popup UI - handles URL shortening, QR generation, history management, settings
- **src/background.ts**: Service worker - handles context menu creation and right-click actions

### Core Modules

- **src/sdk.ts**: Browser-compatible API client for S.EE (uses fetch, not Node.js axios)
- **src/storage.ts**: Chrome storage abstraction (sync for settings, local for history)

### Build System

Vite builds two separate bundles:
1. Main popup bundle from `popup.html`
2. Background service worker via custom plugin in `vite.config.ts`

The build copies `manifest.json` and `icons/` to `dist/`.

### Key Patterns

- Theme system uses CSS custom properties with `[data-theme="dark"]` selector
- QR codes exported at 512x512 using qrcode library
- Clipboard in service worker uses `chrome.scripting.executeScript` to inject into active tab
- Context menu actions store pending data in `chrome.storage.local` for popup to consume

### Permissions

Extension requires: `activeTab`, `storage`, `clipboardWrite`, `contextMenus`, `notifications`, `scripting`, and `<all_urls>` host permission for script injection.
