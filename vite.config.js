import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/login':    'http://localhost:5000',
      '/register': 'http://localhost:5000',
      '/users':    'http://localhost:5000',
      '/concerns': 'http://localhost:5000',
    }
  }
})