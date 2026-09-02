import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read the caregiver app's current version.json off disk at BUILD time
// (not a network fetch, so it can never be served stale by a CDN) and
// bake the correct APK download URL (a GitHub Release asset — the APK
// is too large for normal git/CDN hosting) directly into the bundle.
let apkUrl = ''
try {
  const versionPath = path.resolve(__dirname, '../caregiver-app/public/downloads/version.json')
  const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'))
  if (data.apkUrl) apkUrl = data.apkUrl
} catch (e) {
  console.warn('Could not read caregiver-app version.json at build time:', e.message)
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5173 },
  define: {
    __APK_URL__: JSON.stringify(apkUrl),
  },
})
