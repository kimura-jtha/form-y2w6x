import { resolve } from 'node:path';
import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

process.env.VITE_APP_VERSION = process.env.npm_package_version;
const tzOffset = 7 * 36e5;
process.env.VITE_APP_BUILD = new Date(Date.now() + tzOffset)
  .toISOString()
  .replaceAll(/[-:]/g, '')
  .replace('T', '_')
  .slice(0, -7);

// https://vite.dev/config/
export default defineConfig({
  server: {
    // https://533a614b56bc.ngrok-free.app
    allowedHosts: ['533a614b56bc.ngrok-free.app'],
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Only split the largest, most independent libraries
          // React ecosystem
          react: ['react', 'react-dom'],
          router: ['react-router'],
        },
      },
    },
  },
  plugins: [react()],
});
