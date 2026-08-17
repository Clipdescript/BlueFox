import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  // Reuse the existing BlueFox logo from the monorepo public assets.
  publicDir: '../public',
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
  },
});
