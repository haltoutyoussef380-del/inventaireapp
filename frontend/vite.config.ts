import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/inventaireapp/', // Required for GitHub Pages deployment
  plugins: [react()],
  server: {
    host: true, // Listen on all IP addresses (for mobile access)
    port: 5174, // Frontend port changed to 5174 just in case 5173 is taken
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  }
})
