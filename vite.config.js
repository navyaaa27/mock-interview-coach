import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('three')) return 'vendor-three';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
