import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443 // Use the forwarded port for WebContainer preview
    }
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true
  }
})
