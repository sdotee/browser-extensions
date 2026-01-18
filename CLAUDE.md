# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
bun install              # Install dependencies
bun run build            # Build Chrome extension
bun run build:firefox    # Build Firefox extension
bun run dev              # Watch mode for Chrome development
bun run dev:firefox      # Watch mode for Firefox development
bun run release          # Build and package for release
```

Build outputs:
- Chrome MV3: `.output/chrome-mv3/`
- Firefox MV3: `.output/firefox-mv3/`

Release packages (in `.output/release/`):
- `see-extension-chrome-v{version}.zip`
- `see-extension-firefox-v{version}.xpi`
- `see-extension-source-v{version}.zip`

Load as unpacked extension:
- Chrome: `chrome://extensions/` → Load `.output/chrome-mv3/`
- Firefox: `about:debugging` → Load Temporary Add-on → select `manifest.json`

## Architecture

Cross-browser extension built with WXT framework for S.EE URL shortening, text sharing, and file hosting service.

### Entry Points

- **entrypoints/popup/**: Extension popup UI
  - `index.html`: Popup structure with tabs (URL/Text/Files)
  - `main.ts`: Core logic for shortening, sharing, uploading, history
  - `style.css`: Modern design system with dark/light themes
- **entrypoints/background.ts**: Service worker for context menus and background tasks

### Core Modules

- **utils/sdk.ts**: Browser-compatible API client for S.EE API
- **utils/storage.ts**: WXT storage abstraction (sync for settings, local for history)

### Key Features

- **URL Shortening**: Shorten URLs with custom slugs and domain selection
- **Text Sharing**: Share text/code snippets with syntax highlighting options
- **File Upload**: Batch upload with progress tracking and format options (Plain/Markdown/HTML/BBCode)
- **Context Menus**: Right-click to shorten page/link, show QR, share selection, upload image
- **History**: Tab-aware history with batch delete for URLs/Texts/Files
- **Draft Persistence**: localStorage saves input drafts across popup sessions

### Key Patterns

- Theme system uses CSS custom properties with `[data-theme="dark"]` selector
- QR codes generated at 100px display, exported at 512px
- Image upload converts to WebP via Canvas API before upload
- Clipboard in service worker uses `browser.scripting.executeScript` injection
- WXT handles cross-browser compatibility (Chrome MV3 / Firefox MV3)
- Version is read from `package.json` - update version there only

### Permissions

Extension requires: `activeTab`, `storage`, `clipboardWrite`, `contextMenus`, `notifications`, `scripting`, and `<all_urls>` host permission.
