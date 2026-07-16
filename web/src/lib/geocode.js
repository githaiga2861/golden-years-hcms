/**
 * Converts a US street address into precise coordinates using Google's
 * Geocoding API. Only called when an admin saves a client's address —
 * results are stored on the client record, not re-fetched per visit.
 */
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export async function geocodeAddress(address) {
  if (!KEY) {
    return { ok: false, error: 'Google Maps API key is not configured (see .env).' }
  }
  if (!address || !address.trim()) {
    return { ok: false, error: 'Enter an address first.' }
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${KEY}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.length) {
      return { ok: false, error: `Could not locate that address (${data.status}). Check spelling and try again.` }
    }
    const top = data.results[0]
    const precise = ['ROOFTOP', 'RANGE_INTERPOLATED'].includes(top.geometry.location_type)
    return {
      ok: true,
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      formatted: top.formatted_address,
      precise, // false means Google only found an approximate area, not the exact home
    }
  } catch (e) {
    return { ok: false, error: 'Network error while looking up the address.' }
  }
}
