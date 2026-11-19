import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/dutyy/api': {
        target: 'http://localhost:8000',
        changeOrigin: false,
      },
    },
  },
});
