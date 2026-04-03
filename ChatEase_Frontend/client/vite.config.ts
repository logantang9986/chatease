import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Crucial for Electron: use relative paths for assets
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8081',
      '/user-info': 'http://localhost:8081',
      '/user-contact': 'http://localhost:8081',
      '/chat': 'http://localhost:8081',

      // Added proxy for user application requests
      '/user-apply': 'http://localhost:8081',

      '/group-info': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },

      '/ws': {
        target: 'ws://localhost:8081',
        ws: true
      },
      '/files': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/upload': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})
