import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // In production builds, use relative paths so Electron can load
  // assets from the local filesystem via file:// protocol
  base: command === 'build' ? './' : '/',
}))
