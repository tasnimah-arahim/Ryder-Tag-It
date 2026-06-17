import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy /api calls to the Node auth server so the browser origin stays
      // at localhost:5173 — required for WebAuthn (expectedOrigin must match).
      '/api': 'http://localhost:3000',
    },
  },
})
