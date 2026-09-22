import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'server/src/**/*.test.ts'],
    css: true,
    pool: 'threads',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      '@supabase/supabase-js',
      'dayjs',
      'recharts',
      'exceljs',
      'fuse.js',
    ],
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
            if (id.includes('node_modules/exceljs/')) {
              return 'vendor-exceljs';
            }
            if (id.includes('node_modules/jspdf/') || id.includes('node_modules/jspdf-autotable/')) {
              return 'vendor-jspdf';
            }
            if (id.includes('node_modules/html2canvas/')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('node_modules/framer-motion/')) {
              return 'vendor-framer-motion';
            }
            if (id.includes('node_modules/@google/genai/') || id.includes('node_modules/@anthropic-ai/sdk/')) {
              return 'vendor-ai';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-lucide';
            }
          }
        },
      },
    },
  },
});
