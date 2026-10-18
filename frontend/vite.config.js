import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // onnxruntime-web locates its .wasm file via import.meta.url; pre-bundling breaks that in dev.
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
})
