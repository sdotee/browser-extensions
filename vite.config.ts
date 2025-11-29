import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';

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
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyStaticFiles()],
});
