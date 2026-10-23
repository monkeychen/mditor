import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/types'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'main.js',
              },
            },
          },
        },
      },
      {
        // Preload process entry
        entry: path.resolve(__dirname, 'src/preload/index.ts'),
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'preload.js',
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
