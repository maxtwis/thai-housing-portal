import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          maps: ['mapbox-gl']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    // Add proxy configuration for development only
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  // Ensure that API routes are handled correctly in development
  define: {
    // This helps with environment detection
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});