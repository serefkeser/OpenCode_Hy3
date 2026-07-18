import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages için base path. Repo adınızla değiştirin:
// Örn: repo "otonom-studio" ise base: '/otonom-studio/'
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
