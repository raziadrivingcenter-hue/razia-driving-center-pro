import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Cloudflare Pages Functions don't run under plain `vite dev`, so
      // /api/reviews would hit the SPA fallback and return index.html. The
      // browser then failed to parse JSON and every review count fell back to
      // a stale hardcoded number. Proxy this one read-only endpoint to the
      // live deployment so local development shows the same live GBP data.
      '/api/reviews': {
        target: 'https://raziadrivingcenter.com',
        changeOrigin: true,
      },
    },
  },
})