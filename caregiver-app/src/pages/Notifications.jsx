import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const fmtWhen = (d) => {
  const diffMin = Math.round((Date.now() - new Date(d)) / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_LABEL = {
  care_plan: 'Care Plan', physician_order: 'Physician Order', medication: 'Medication', adl_task: 'New Task', other: 'Update',
}

export default function Notifications() {
  const { caregiver } = useAuth()
  const [items, setItems] = useState([])
  const [clientNames, setClientNames] = useState({})
  const [readIds, setReadIds] = useState(new Set())

  const load = async () => {
    if (!caregiver) return
    const { data: shiftClients } = await supabase.from('shifts')
      .select('client_id, clients(first_name,last_name)').eq('caregiver_id', caregiver.id)
    const ids = [...new Set((shiftClients || []).map((s) => s.client_id))]
    const names = {}
    ;(shiftClients || []).forEach((s) => { if (s.clients) names[s.client_id] = `${s.clients.first_name} ${s.clients.last_name}` })
    setClientNames(names)
    if (ids.length === 0) { setItems([]); return }

    const { data: updates } = await supabase.from('client_updates').select('*')
      .in('client_id', ids).order('created_at', { ascending: false }).limit(60)
    const { data: reads } = await supabase.from('update_reads').select('update_id').eq('caregiver_id', caregiver.id)
    setReadIds(new Set((reads || []).map((r) => r.update_id)))
    setItems(updates || [])
  }
  useEffect(() => { load() }, [caregiver?.id]) // eslint-disable-line

  const markRead = async (id) => {
    if (readIds.has(id)) return
    await supabase.from('update_reads').insert({ update_id: id, caregiver_id: caregiver.id })
    setReadIds((s) => new Set([...s, id]))
  }

  const markAllRead = async () => {
    const unread = items.filter((i) => !readIds.has(i.id))
    if (unread.length === 0) return
    await supabase.from('update_reads').insert(unread.map((u) => ({ update_id: u.id, caregiver_id: caregiver.id })))
    setReadIds((s) => new Set([...s, ...unread.map((u) => u.id)]))
  }

  if (!caregiver) return null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ marginBottom: 0 }}>Updates</h1>
        {items.some((i) => !readIds.has(i.id)) && (
          <button className="btn btn-quiet" onClick={markAllRead}>Mark all read</button>
        )}
      </div>
      <p className="muted" style={{ marginTop: 0 }}>Changes to care plans, new orders, and new medications for your clients.</p>

      {items.length === 0 && (
        <div className="empty"><h3>No updates yet</h3><p>You'll see it here when the office changes something for your clients.</p></div>
      )}

      {items.map((i) => {
        const unread = !readIds.has(i.id)
        return (
          <div key={i.id} className="card" onClick={() => markRead(i.id)}
            style={{ borderLeft: unread ? '4px solid var(--gold)' : '4px solid transparent', cursor: unread ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="pill pill-info">{TYPE_LABEL[i.update_type] || 'Update'}</span>
              {unread && <span className="pill pill-gold">New</span>}
            </div>
            <p style={{ margin: '.5rem 0 .2rem', fontWeight: 600 }}>{clientNames[i.client_id] || 'Client'}</p>
            <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>{i.message}</p>
            <p className="muted" style={{ margin: '.4rem 0 0', fontSize: '.78rem' }}>{fmtWhen(i.created_at)}</p>
          </div>
        )
      })}
    </>
  )
}
