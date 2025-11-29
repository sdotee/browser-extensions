import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
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
          minify: false,
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
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyStaticFiles(), buildBackgroundScript()],
});
