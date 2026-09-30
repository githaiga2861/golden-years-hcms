export const fmtDate = (d) => {
  if (!d) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: PT })
}

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: PT }) : '—'

export const fmtDateTime = (d) => (d ? `${fmtDate(d)} · ${fmtTime(d)}` : '—')

export const fmtMoney = (n) =>
  (n ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export const fmtHours = (n) => (n == null ? '—' : `${Number(n).toFixed(2)} h`)

export const fullName = (r) => (r ? `${r.first_name} ${r.last_name}` : '—')

export const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

/** Local YYYY-MM-DD for <input type=date> and range math. */
export const toISODate = (d) => {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}

export const startOfWeek = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay()) // Sunday
  return x
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/* ---- Pacific Time (the agency's fixed timezone, regardless of browser) ---- */
export const PT = 'America/Los_Angeles'
const ptParts = (d) => {
  const o = {}
  new Intl.DateTimeFormat('en-CA', { timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(d)).forEach((x) => { o[x.type] = x.value })
  return o
}
export const ptDate = (d) => { const o = ptParts(d); return `${o.year}-${o.month}-${o.day}` }
export const ptTime = (d) => { const o = ptParts(d); return `${o.hour}:${o.minute}` }
export const ptToday = () => ptDate(new Date())
/** Wall-clock date + time typed in Pacific Time -> UTC ISO string. */
export const ptToISO = (date, time) => {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const target = Date.UTC(y, m - 1, d, hh, mm)
  let guess = target
  for (let i = 0; i < 2; i++) {
    const o = ptParts(guess)
    guess += target - Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute)
  }
  return new Date(guess).toISOString()
}
