/* Golden Years Care App — service worker.
   Strategy: precache the app shell; network-first for everything else.
   Clock in/out made offline works via the in-app queue (src/lib/offline.js),
   not the service worker, so it also survives app restarts. */
const CACHE = 'gy-care-v2'
const SHELL = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy))
        return res
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('/index.html')))
  )
})

// Tapping an office alert notification opens (or focuses) the app on Updates.
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || '/updates'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) { w.navigate(target).catch(() => {}); return w.focus() }
      }
      return self.clients.openWindow(target)
    })
  )
})
