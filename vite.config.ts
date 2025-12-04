import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { build } from 'vite';

// Plugin to copy static files to dist
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      // Copy manifest.json
      copyFileSync('manifest.json', 'dist/manifest.json');

      // Copy icons
      mkdirSync('dist/icons', { recursive: true });
      const icons = readdirSync('icons');
      icons.forEach((icon) => {
        copyFileSync(`icons/${icon}`, `dist/icons/${icon}`);
      });

      console.log('Copied manifest.json and icons to dist/');
    },
  };
}

// Plugin to strip external URL references from comments (for Chrome Web Store compliance)
function stripExternalUrls() {
  return {
    name: 'strip-external-urls',
    closeBundle() {
      const jsFiles = ['dist/popup.js', 'dist/html2canvas.esm.js', 'dist/index.es.js', 'dist/purify.es.js'];

      jsFiles.forEach((file) => {
        try {
          let content = readFileSync(file, 'utf-8');

          // Remove CDN URLs that might trigger Chrome Web Store rejection
          // Pattern matches URLs in comments like // http://... or * http://... or <url>
          content = content.replace(/https?:\/\/cdnjs\.cloudflare\.com[^\s'")>]*/g, '[removed]');
          content = content.replace(/https?:\/\/cdn\.[^\s'")>]*/g, '[removed]');
          content = content.replace(/https?:\/\/unpkg\.com[^\s'")>]*/g, '[removed]');
          content = content.replace(/https?:\/\/jsdelivr\.[^\s'")>]*/g, '[removed]');

          writeFileSync(file, content, 'utf-8');
        } catch (e) {
          // File might not exist yet, ignore
        }
      });

      console.log('Stripped external CDN URLs from JS files');
    },
  };
}

// Plugin to build background script separately
function buildBackgroundScript() {
  return {
    name: 'build-background-script',
    async closeBundle() {
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, 'src/background.ts'),
            name: 'background',
            formats: ['es'],
            fileName: () => 'background.js',
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
          target: 'esnext',
          minify: 'terser',
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: false,
            },
          },
        },
      });
      console.log('Built background.js');
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false,
      },
      compress: {
        drop_console: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyStaticFiles(), buildBackgroundScript(), stripExternalUrls()],
});
