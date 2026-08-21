import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

// Standalone from vite.config.ts on purpose: the tests don't need the PWA or
// Tailwind plugins, and running them here would only slow every run down.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // lucide-react ships a barrel of ~1500 icon modules. Without pre-bundling
    // it, vite-node transforms them one by one and the run never finishes.
    deps: {
      optimizer: {
        web: { enabled: true, include: ['lucide-react'] },
      },
    },
  },
})
