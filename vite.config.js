import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    hmr: {
      overlay: false, // Disable HMR overlay for speed
    },
    watch: {
      usePolling: false, // Don't use polling, use native fs events
    }
  },
  build: {
    outDir: 'dist-react',
    target: 'esnext', // Use latest JS features
    minify: 'esbuild', // Faster minification
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-icons'], // Split vendor code
        }
      }
    }
  }
})
