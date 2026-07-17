/**
 * Loads the Google Maps JavaScript API once, on demand, using the same
 * browser API key as the office system (already restricted to this
 * domain). Only needed for DistanceMatrixService — no extra libraries.
 */
let loadPromise = null

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured (see .env).'))
  }
  if (window.google?.maps?.DistanceMatrixService) {
    return Promise.resolve(window.google)
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async`
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Failed to load Google Maps.'))
    document.head.appendChild(script)
  })
  return loadPromise
}

/**
 * Driving distance in miles between two {lat,lng} points, or null if
 * it can't be calculated (offline, API error, etc.) — callers should
 * treat null as "fall back to manual mileage entry".
 */
export async function drivingDistanceMiles(origin, destination) {
  try {
    const google = await loadGoogleMaps()
    const service = new google.maps.DistanceMatrixService()
    const result = await new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      }, (response, status) => {
        if (status === 'OK') resolve(response)
        else reject(new Error(status))
      })
    })
    const element = result.rows?.[0]?.elements?.[0]
    if (element?.status !== 'OK') return null
    return element.distance.value / 1609.34 // meters -> miles
  } catch {
    return null
  }
}
