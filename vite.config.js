/// <reference types="vitest/config" />
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    // Only pick up tests in src/test/**. The standalone react-dom/server
    // scripts in src/components/SlotAvailability/*.test.js use no test runner
    // and must not be discovered here (out of scope — do not touch).
    include: ['src/test/**/*.test.{js,jsx,ts,tsx}'],
  },
})