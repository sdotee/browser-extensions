import { defineConfig } from 'wxt';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifestVersion: 3,
  vite: () => ({
    plugins: [
      replace({
        // Replace jspdf's remote pdfobject CDN URL to pass Chrome Web Store review
        'https://cdnjs.cloudflare.com/ajax/libs/pdfobject/2.1.1/pdfobject.min.js': '',
        preventAssignment: true,
      }),
    ],
  }),
  manifest: ({ browser }) => ({
    name: 'S.EE - URL Shortener, Text & File Sharing',
    version: pkg.version,
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
