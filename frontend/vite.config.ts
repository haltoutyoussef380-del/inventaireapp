import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isMobile = process.env.VITE_MOBILE === 'true';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: isMobile ? './' : (mode === 'production' ? '/inventaireapp/' : '/'),
  plugins: [react()],
  build: isMobile ? {
    target: 'es2015',
    cssTarget: 'chrome61',
  } : {},
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  }
}));
