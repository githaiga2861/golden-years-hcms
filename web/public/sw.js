// Minimal service worker — required by browsers for "Install app" (PWA)
// eligibility. Does not cache anything, so the app always loads fresh
// from the network; it exists purely to satisfy installability rules.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
