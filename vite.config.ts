import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3020,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand']
  }
})
