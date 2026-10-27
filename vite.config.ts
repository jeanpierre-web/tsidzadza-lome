/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base relative : le build marche sur GitHub Pages (sous-dossier) comme sur Vercel.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
})
