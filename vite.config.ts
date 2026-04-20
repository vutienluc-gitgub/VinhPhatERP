import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/@tanstack/react-query/')) {
              return 'vendor-query';
            }
            if (
              id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/resolvers/') ||
              id.includes('node_modules/zod/')
            ) {
              return 'vendor-form';
            }
            if (id.includes('node_modules/@supabase/supabase-js/')) {
              return 'vendor-supabase';
            }
          }
        },
      },
    },
  },
});
