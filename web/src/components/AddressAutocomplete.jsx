import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/googleMaps'

/**
 * A street-address input that shows live Google Places suggestions as
 * the admin types (US addresses only). Selecting a suggestion fills in
 * city/state/zip and precise coordinates immediately — no separate
 * "Locate" step needed for addresses that appear in the dropdown.
 */
export default function AddressAutocomplete({ value, onSelect, placeholder }) {
  const inputRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let live = true
    loadGoogleMaps()
      .then((google) => {
        if (!live || !inputRef.current) return
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry'],
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry) return // user hit Enter without picking a suggestion
          const parts = {}
          for (const c of place.address_components || []) {
            if (c.types.includes('street_number')) parts.streetNumber = c.long_name
            if (c.types.includes('route')) parts.route = c.long_name
            if (c.types.includes('locality')) parts.city = c.long_name
            if (c.types.includes('administrative_area_level_1')) parts.state = c.short_name
            if (c.types.includes('postal_code')) parts.zip = c.long_name
          }
          onSelect({
            address: [parts.streetNumber, parts.route].filter(Boolean).join(' '),
            city: parts.city || '',
            state: parts.state || 'WA',
            zip: parts.zip || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            formatted: place.formatted_address,
          })
        })
        setReady(true)
      })
      .catch((e) => setErr(e.message))
    return () => { live = false }
  }, []) // eslint-disable-line

  return (
    <>
      <input
        ref={inputRef}
        defaultValue={value}
        placeholder={placeholder || 'Start typing an address…'}
        autoComplete="off"
      />
      {err && <span className="help" style={{ color: 'var(--bad)' }}>{err} You can still type the address manually and use "Locate" below.</span>}
      {!ready && !err && <span className="help">Loading address suggestions…</span>}
    </>
  )
}
