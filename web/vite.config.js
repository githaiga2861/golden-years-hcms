import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Read the current version.json off disk at BUILD time (not a network
// fetch, so it can never be served stale by a CDN) and bake the correct
// APK filename directly into the built JS bundle.
let apkFile = 'golden-years-care.apk'
try {
  const versionPath = path.resolve(__dirname, 'public/downloads/version.json')
  const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'))
  if (data.apkFile) apkFile = data.apkFile
} catch {
  // Fall back to the stable filename if version.json isn't there yet.
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5173 },
  define: {
    __APK_FILE__: JSON.stringify(apkFile),
  },
})
