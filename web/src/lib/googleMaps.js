/**
 * Loads the Google Maps JavaScript API (with the Places library) once,
 * on demand, using the browser API key from .env. Safe to call from
 * multiple components — returns the same cached promise.
 */
let loadPromise = null

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured (see .env).'))
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google)
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Failed to load Google Maps.'))
    document.head.appendChild(script)
  })
  return loadPromise
}
