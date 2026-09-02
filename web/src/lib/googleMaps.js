/**
 * Loads the Google Maps JavaScript API (with the Places library) once,
 * on demand, using the browser API key from .env. Safe to call from
 * multiple components — returns the same cached promise.
 *
 * Uses Google's recommended `loading=async` pattern — but under that
 * mode, the script tag's own `onload` firing does NOT guarantee the
 * Places sub-library has finished initializing yet (it loads via a
 * separate internal step afterward). So after onload, we briefly poll
 * for `google.maps.places` to actually exist before resolving, instead
 * of trusting onload alone.
 */
let loadPromise = null

function waitForPlaces(resolve, reject, attemptsLeft = 100) {
  if (window.google?.maps?.places) {
    resolve(window.google)
    return
  }
  if (attemptsLeft <= 0) {
    reject(new Error('Google Maps loaded, but the Places library never became ready.'))
    return
  }
  setTimeout(() => waitForPlaces(resolve, reject, attemptsLeft - 1), 50)
}

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
    script.onload = () => waitForPlaces(resolve, reject)
    script.onerror = () => reject(new Error('Failed to load Google Maps.'))
    document.head.appendChild(script)
  })
  return loadPromise
}
