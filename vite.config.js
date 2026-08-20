import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const onnxRuntimeWebPackagePath = resolve(dirname(require.resolve('onnxruntime-web')), '../package.json')
const onnxRuntimeWebVersion = JSON.parse(readFileSync(onnxRuntimeWebPackagePath, 'utf8')).version
const onnxWasmCdnBase = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${onnxRuntimeWebVersion}/dist/`

// Transformers.js contains a local fallback URL for ONNX Runtime's WASM file.
// Replace that URL at build time so the renderer does not copy the 23 MB binary.
const externalizeOnnxWasm = {
  name: 'externalize-onnx-wasm',
  enforce: 'pre',
  transform(code) {
    const localWasmUrl = /new URL\(["']ort-wasm-simd-threaded\.asyncify\.wasm["'],\s*import\.meta\.url\)\.href/g
    if (!localWasmUrl.test(code)) return null

    return {
      code: code.replace(localWasmUrl, JSON.stringify(`${onnxWasmCdnBase}ort-wasm-simd-threaded.asyncify.wasm`)),
      map: null
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [externalizeOnnxWasm, react()],
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
