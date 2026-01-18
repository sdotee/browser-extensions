import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'S.EE - URL Shortener, Text & File Sharing',
    version: '2.0.0',
    description: 'Shorten URLs, share text & files, generate QR codes instantly. Custom slugs, QR export (PNG/SVG/PDF), history, and right-click menu.',
    permissions: [
      'activeTab',
      'storage',
      'clipboardWrite',
      'contextMenus',
      'notifications',
      'scripting',
    ],
    host_permissions: [
      'https://s.ee/*',
      'https://fs.to/*',
      '<all_urls>',
    ],
    icons: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: '{d4e5f6a7-b8c9-4d0e-a1b2-c3d4e5f6a7b8}',
          strict_min_version: '142.0',
          data_collection_permissions: {
            required: ['browsingActivity'],
          },
        },
      },
    }),
  }),
});
