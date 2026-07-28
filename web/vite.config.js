import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read the caregiver app's current version.json off disk at BUILD time
// (not a network fetch, so it can never be served stale by a CDN) and
// bake the correct external APK download URL directly into the bundle.
let apkFile = 'golden-years-care.apk'
try {
  const versionPath = path.resolve(__dirname, '../caregiver-app/public/downloads/version.json')
  const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'))
  if (data.apkFile) apkFile = data.apkFile
} catch (e) {
  console.warn('Could not read caregiver-app version.json at build time:', e.message)
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5173 },
  define: {
    __APK_FILE__: JSON.stringify(apkFile),
  },
})
