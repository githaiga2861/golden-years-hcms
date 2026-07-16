import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * A dropdown backed by a shared, agency-wide reference table (e.g.
 * diagnoses_list, allergies_list). Anyone can pick an existing entry;
 * clicking the + button lets them type a new one, which is saved to the
 * table permanently — so it appears for every client from then on.
 *
 * multi=false -> value is a single id, onChange(id)
 * multi=true  -> value is an array of ids, onChange(idsArray)
 */
export default function EditableSelect({ table, label, value, onChange, multi = false, placeholder }) {
  const [options, setOptions] = useState([])
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () =>
    supabase.from(table).select('id,label').order('label').then(({ data }) => setOptions(data || []))
  useEffect(() => { load() }, [table]) // eslint-disable-line

  const addNew = async () => {
    const label2 = newLabel.trim()
    if (!label2) return
    setBusy(true); setErr('')
    const { data, error } = await supabase.from(table)
      .insert({ label: label2, is_custom: true }).select().single()
    setBusy(false)
    if (error) {
      // Unique violation = someone already added this exact label; just use it.
      if (error.code === '23505') {
        const existing = options.find((o) => o.label.toLowerCase() === label2.toLowerCase())
        if (existing) { selectNew(existing.id); setAdding(false); setNewLabel(''); return }
      }
      setErr(error.message); return
    }
    await load()
    selectNew(data.id)
    setAdding(false); setNewLabel('')
  }

  const selectNew = (id) => {
    if (multi) onChange([...(value || []), id])
    else onChange(id)
  }

  const toggleMulti = (id) => {
    const cur = value || []
    onChange(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
  }

  return (
    <div className="field">
      <label>{label}</label>
      {!multi && (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <select value={value || ''} onChange={(e) => onChange(e.target.value || null)} style={{ flex: 1 }}>
            <option value="">{placeholder || 'Select…'}</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button type="button" className="btn btn-outline" style={{ padding: '.4rem .6rem' }}
            onClick={() => setAdding(true)} aria-label={`Add new ${label}`}>+</button>
        </div>
      )}
      {multi && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 7, padding: '.5rem .6rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: options.length ? '.5rem' : 0 }}>
            {options.map((o) => (
              <button key={o.id} type="button"
                className={`btn ${(value || []).includes(o.id) ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '.25rem .6rem', fontSize: '.8rem' }}
                onClick={() => toggleMulti(o.id)}>{o.label}</button>
            ))}
          </div>
          <button type="button" className="btn btn-quiet" style={{ padding: '.2rem .4rem', fontSize: '.82rem' }}
            onClick={() => setAdding(true)}>+ Add new {label.toLowerCase()}</button>
        </div>
      )}
      {adding && (
        <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
          <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`New ${label.toLowerCase()}…`}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNew())} />
          <button type="button" className="btn btn-primary" style={{ padding: '.4rem .7rem' }} onClick={addNew} disabled={busy}>
            {busy ? '…' : 'Save'}
          </button>
          <button type="button" className="btn btn-quiet" style={{ padding: '.4rem .5rem' }} onClick={() => { setAdding(false); setNewLabel('') }}>✕</button>
        </div>
      )}
      {err && <span className="help" style={{ color: 'var(--bad)' }}>{err}</span>}
    </div>
  )
}
