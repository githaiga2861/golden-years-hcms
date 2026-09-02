// Small shared UI primitives kept in one file for easy maintenance.
import { useState } from 'react'

/**
 * A faint, collapsed-by-default "How this works" hint. Use on any page
 * where the system's actual behavior might not be obvious — expands
 * only when someone wants the explanation, so it never clutters the
 * page for people who already know how things work.
 */
export function HowThisWorks({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: '1rem' }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        background: 'none', border: 'none', color: 'var(--muted)', fontSize: '.82rem',
        cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '.35rem',
      }}>
        <span style={{ display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        How this works
      </button>
      {open && (
        <div style={{
          marginTop: '.5rem', padding: '.7rem .9rem', background: 'var(--paper)',
          border: '1px solid var(--line)', borderRadius: 8, fontSize: '.84rem',
          color: 'var(--muted)', lineHeight: 1.55, maxWidth: 640,
        }}>{children}</div>
      )}
    </div>
  )
}


export function Modal({ title, header, onClose, children, footer, wide, xwide }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''} ${xwide ? 'modal-xwide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={`modal-head ${header ? 'modal-head-rich' : ''}`}>
          {header || <h2>{title}</h2>}
          <button className="btn btn-quiet modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, help, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {help && <span className="help">{help}</span>}
    </div>
  )
}

export function Empty({ icon = '◌', title, hint }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
    </div>
  )
}

export function ProfileHeader({ name, subtitle, initials, children }) {
  return (
    <div className="profile-header">
      <div className="profile-avatar">{initials}</div>
      <div className="profile-header-text">
        <h2>{name}</h2>
        {subtitle && <div className="profile-subtitle">{subtitle}</div>}
        {children && <div className="profile-header-pills">{children}</div>}
      </div>
    </div>
  )
}

export function TechSupportPreview({ title, row, type, onClose }) {
  const initials = title.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <Modal
      onClose={onClose}
      header={<ProfileHeader name={title} initials={initials} subtitle={type === 'client' ? 'Client' : 'Caregiver'} />}
      footer={<button className="btn btn-quiet" onClick={onClose}>Close</button>}
    >
      <p className="notice notice-warn">
        You're viewing this {type} in Technical Support mode. Address, clinical, billing, and other sensitive details
        are not shown here — and are never sent to this account, even in the background.
      </p>
      <dl className="deflist">
        <div><dt>Status</dt><dd>{row.is_active ? 'Active' : 'Inactive'}{row.status ? ` (${row.status})` : ''}</dd></div>
        {type === 'client' && <div><dt>Location</dt><dd>{row.city ? `${row.city}, ${row.state || 'WA'}` : '—'}</dd></div>}
        {type === 'client' && <div><dt>Authorized hrs/week</dt><dd>{row.authorized_hours_per_week ?? '—'}</dd></div>}
        {type === 'caregiver' && <div><dt>Type</dt><dd>{row.caregiver_kind === 'live_in' ? 'Live-in' : 'Hourly'}</dd></div>}
        {type === 'caregiver' && <div><dt>Employment type</dt><dd>{row.employment_type || '—'}</dd></div>}
        <div><dt>On file since</dt><dd>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</dd></div>
      </dl>
      <p className="muted" style={{ fontSize: '.84rem' }}>Need full details? Ask an office admin, scheduler, or coordinator to look this up.</p>
    </Modal>
  )
}

export function Pill({ kind = 'muted', children }) {
  return <span className={`pill pill-${kind}`}>{children}</span>
}

export const STATUS_PILL = {
  open: ['warn', 'Open'], assigned: ['info', 'Assigned'], in_progress: ['gold', 'In progress'],
  completed: ['ok', 'Completed'], missed: ['bad', 'Missed'], cancelled: ['muted', 'Cancelled'],
}
