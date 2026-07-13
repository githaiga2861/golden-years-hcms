import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed under /care-app/ when hosted next to the main system,
// or at the root of its own domain. Adjust `base` to match hosting.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5174 }
})
