import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['lucide-react'],  // Externalize lucide-react
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          maps: ['mapbox-gl']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000
  }
})