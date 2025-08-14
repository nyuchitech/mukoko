// vite.config.js - Updated to suppress SES warnings
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy API calls to worker
      '/api': {
        target: 'https://app.mukoko.com',
        changeOrigin: true,
        secure: true,
      },
      // Proxy worker assets
      '/worker': {
        target: 'https://app.mukoko.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  define: {
    // Ensure environment variables are available
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@heroicons/react', 'lucide-react'],
        },
      },
    },
  },
})