import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/golden-years-hcms/',
  server: { port: 5173 }
})
