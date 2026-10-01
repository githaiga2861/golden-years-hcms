import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from './supabase'
import logoUrl from '../assets/logo.png'

const NAVY = [11, 83, 148]
const GOLD = [201, 162, 39]
const GREY = [90, 100, 115]
const TZ = 'America/Los_Angeles'

// ---- Edit these to change the header / terms ----
const AGENCY = {
  name: 'Golden Years Home Care WA',
  legal: 'A service of Golden Years Home Health Supported Living LLC',
  addr1: '614 Harrison St, Suite C',
  addr2: 'Sumner, WA 98390',
  phone: '(206) 717-1234',
  email: 'contact@goldenyearshomehealthllc.com',
  web: 'goldenyearshomecarewa.com',
}
const PAYABLE_TO = 'Golden Years Home Health Supported Living LLC'
const NET_DAYS = 15
// -------------------------------------------------

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = { month: 'short', day: 'numeric', year: 'numeric' }
const dDate = (v) => (v ? new Date(v + 'T12:00:00').toLocaleDateString('en-US', fmt) : '')
const dStamp = (v) => (v ? new Date(v).toLocaleDateString('en-US', { ...fmt, timeZone: TZ }) : '')

async function loadLogo() {
  try {
    const blob = await (await fetch(logoUrl)).blob()
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
    const dim = await new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res(null); i.src = dataUrl })
    return dim ? { dataUrl, ...dim } : null
  } catch { return null }
}

function header(doc, logo, agency) {
  const W = doc.internal.pageSize.getWidth()
  let x = 14
  if (logo) {
    const h = 20, w = (logo.w / logo.h) * h
    doc.addImage(logo.dataUrl, 'PNG', 14, 10, w, h)
    x = 14 + w + 4
  }
  doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(15).text(AGENCY.name, x, 17)
  doc.setTextColor(...GREY).setFont('helvetica', 'normal').setFontSize(8).text(AGENCY.legal, x, 22)
  doc.text(`${AGENCY.addr1}, ${AGENCY.addr2}`, W - 14, 14, { align: 'right' })
  doc.text(`Tel ${agency.phone}`, W - 14, 19, { align: 'right' })
  doc.text(agency.email, W - 14, 24, { align: 'right' })
  doc.text(AGENCY.web, W - 14, 29, { align: 'right' })
  doc.setDrawColor(...GOLD).setLineWidth(0.8).line(14, 33, W - 14, 33)
}

function footer(doc, text) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight()
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFontSize(8).setTextColor(...GREY).setFont('helvetica', 'normal')
    doc.text(text, 14, H - 8)
    doc.text(`Page ${i} of ${n}`, W - 14, H - 8, { align: 'right' })
  }
}

async function buildInvoicePdf(invoice) {
  const [itemsRes, clientRes, setRes, logo] = await Promise.all([
    supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('service_date'),
    supabase.from('clients').select('first_name,last_name,address,city,state,zip,billing_email').eq('id', invoice.client_id).maybeSingle(),
    supabase.from('app_settings').select('agency_phone,agency_email').eq('id', 1).maybeSingle(),
    loadLogo(),
  ])
  const items = itemsRes.data || []
  const c = clientRes.data || {}
  const agency = { phone: setRes.data?.agency_phone || AGENCY.phone, email: setRes.data?.agency_email || AGENCY.email }

  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  header(doc, logo, agency)

  // Title block
  doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(24).text('INVOICE', W - 14, 46, { align: 'right' })
  const issued = invoice.created_at ? new Date(invoice.created_at) : new Date()
  const due = new Date(issued.getTime() + NET_DAYS * 86400000)
  const meta = [
    ['Invoice #', invoice.invoice_number],
    ['Invoice date', issued.toLocaleDateString('en-US', { ...fmt, timeZone: TZ })],
    ['Due date', due.toLocaleDateString('en-US', { ...fmt, timeZone: TZ })],
    ['Service period', `${dDate(invoice.period_start)} - ${dDate(invoice.period_end)}`],
  ]
  doc.setFontSize(9)
  meta.forEach(([k, v], i) => {
    const y = 54 + i * 5.5
    doc.setFont('helvetica', 'bold').setTextColor(...GREY).text(k, W - 70, y)
    doc.setFont('helvetica', 'normal').setTextColor(30, 30, 30).text(String(v || ''), W - 14, y, { align: 'right' })
  })

  // Bill to
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...GREY).text('BILL TO', 14, 50)
  doc.setFontSize(11).setTextColor(20, 20, 20).text(`${c.first_name || ''} ${c.last_name || ''}`.trim(), 14, 56)
  doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(60, 60, 60)
  let y = 61
  if (c.address) { doc.text(c.address, 14, y); y += 5 }
  const cityLine = [c.city, [c.state, c.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  if (cityLine) { doc.text(cityLine, 14, y); y += 5 }
  if (c.billing_email) { doc.text(c.billing_email, 14, y); y += 5 }

  autoTable(doc, {
    startY: Math.max(y, 78) + 4,
    head: [['Date', 'Service', 'Hours', 'Rate', 'Amount']],
    body: items.map((i) => [dDate(String(i.service_date || '').slice(0, 10)), String(i.description || ''), Number(i.hours || 0).toFixed(2), money(i.rate), money(i.amount)]),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: 14, right: 14, bottom: 30 },
  })

  let fy = doc.lastAutoTable.finalY + 8
  if (fy > 215) { doc.addPage(); fy = 20 }
  const totalHours = items.reduce((s, i) => s + Number(i.hours || 0), 0)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60, 60, 60)
  doc.text('Total hours', W - 70, fy); doc.text(totalHours.toFixed(2), W - 14, fy, { align: 'right' })
  doc.text('Subtotal', W - 70, fy + 6); doc.text(money(invoice.subtotal ?? invoice.total), W - 14, fy + 6, { align: 'right' })
  doc.setFillColor(...NAVY).rect(W - 74, fy + 10, 60, 10, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(255, 255, 255)
  doc.text(invoice.status === 'paid' ? 'PAID' : 'Amount due', W - 70, fy + 16.5)
  doc.text(money(invoice.total), W - 17, fy + 16.5, { align: 'right' })

  // Terms
  let ty = fy + 32
  doc.setTextColor(...NAVY).setFontSize(10).text('Payment terms', 14, ty)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(70, 70, 70)
  const terms = [
    `Payment is due within ${NET_DAYS} days of the invoice date (Net ${NET_DAYS}).`,
    `Please make checks payable to ${PAYABLE_TO} and write the invoice number on the check.`,
    'Hours billed are actual time worked, recorded at clock in and clock out and verified by our office.',
    `Questions about this invoice? Call ${agency.phone} or email ${agency.email}.`,
  ]
  terms.forEach((t, i) => doc.text(t, 14, ty + 6 + i * 5))
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...NAVY)
  doc.text('Thank you for trusting us with your care.', 14, ty + 32)

  footer(doc, `${AGENCY.name}  |  Invoice ${invoice.invoice_number}`)
  doc.save(`${invoice.invoice_number}.pdf`)
}

export async function downloadReportPdf(stats, range) {
  const logo = await loadLogo()
  const agency = { phone: AGENCY.phone, email: AGENCY.email }
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  header(doc, logo, agency)

  doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(18).text('Scheduling, Payroll & Billing Report', 14, 44)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...GREY)
  doc.text(`Period: ${dDate(range.start)} to ${dDate(range.end)}    |    Generated: ${new Date().toLocaleDateString('en-US', { ...fmt, timeZone: TZ })}`, 14, 50)

  const kv = (title, rows, startY) => {
    autoTable(doc, {
      startY,
      head: [[title, '']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9.5 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    })
    return doc.lastAutoTable.finalY + 6
  }
  let y = 56
  y = kv('Scheduling', [
    ['Total shifts', stats.shiftsTotal], ['Completed', stats.shiftsCompleted],
    ['Missed', stats.shiftsMissed], ['Cancelled', stats.shiftsCancelled],
  ], y)
  y = kv('Payroll', [
    ['Visits completed', stats.visitsCount], ['Total hours', stats.totalHours.toFixed(2)],
    ['Estimated payroll', money(stats.totalPayroll)],
  ], y)
  y = kv('Billing', [
    ['Invoices generated', stats.invoiceCount], ['Total billed', money(stats.totalBilled)],
  ], y)

  doc.addPage()
  header(doc, logo, agency)
  doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(13).text('Visit detail', 14, 44)
  const rows = [...stats.visits].sort((a, b) => new Date(a.clock_in_at) - new Date(b.clock_in_at))
  autoTable(doc, {
    startY: 48,
    head: [['Date', 'Client', 'Caregiver', 'Hours', 'Pay rate', 'Pay amount']],
    body: rows.map((v) => [
      dStamp(v.clock_in_at), (v.client_name || '').trim(), v.caregiver_name || '',
      Number(v.worked_hours || 0).toFixed(2), money(v.pay_rate), money((v.worked_hours || 0) * (v.pay_rate || 0)),
    ]),
    foot: [['', '', 'Total', stats.totalHours.toFixed(2), '', money(stats.totalPayroll)]],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [232, 238, 246], textColor: 20, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    margin: { left: 14, right: 14, bottom: 20 },
  })

  footer(doc, `${AGENCY.name}  |  Report ${range.start} to ${range.end}  |  Confidential`)
  doc.save(`gy-report-${range.start}-to-${range.end}.pdf`)
}

export async function downloadInvoicePdf(invoice) {
  try {
    await buildInvoicePdf(invoice)
  } catch (e) {
    console.error('Invoice PDF failed', e)
    alert('Could not create the invoice PDF: ' + (e?.message || e))
  }
}

/* ================= Thorough reports: full agency / per client / per caregiver ================= */
const rNorm = (s) => String(s || '').replace(/\s+/g, ' ').trim()
const rKey = (s) => rNorm(s).toUpperCase()
const rNum = (v) => Number(v || 0)
const rName = (r) => (r ? rNorm(`${r.first_name || ''} ${r.last_name || ''}`) : '')
const rSlug = (s) => rNorm(s).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const rHrs = (n) => rNum(n).toFixed(2)
const rLine = (h, rate) => Math.round(rNum(h) * rNum(rate) * 100) / 100
const rT = (v) => (v ? new Date(v).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '—')
const rPtFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const rParts = (d) => { const o = {}; rPtFmt.formatToParts(new Date(d)).forEach((x) => { o[x.type] = x.value }); return o }
const rDate = (d) => { const o = rParts(d); return `${o.year}-${o.month}-${o.day}` }
const rToISO = (date, time) => {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const target = Date.UTC(y, m - 1, d, hh, mm)
  let guess = target
  for (let i = 0; i < 2; i++) {
    const o = rParts(guess)
    guess += target - Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute)
  }
  return new Date(guess).toISOString()
}
const rNextDay = (d) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10) }
const rWeekKey = (iso) => { const x = new Date(rDate(iso) + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - x.getUTCDay()); return x.toISOString().slice(0, 10) }
const rWeeksIn = (a, b) => Math.max(1, Math.ceil(((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000 + 1) / 7))
const rStatus = (v) => (!v.clock_out_at ? 'In progress' : v.billed ? 'Verified, billed' : v.verified ? 'Verified' : 'Awaiting verification')
const rGps = (v) => (v.location_ok === true ? 'On site' : v.location_ok === false ? 'Mismatch' : 'No check')
const rCap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '')
const rGroup = (list, fn) => { const m = new Map(); list.forEach((x) => { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x) }); return m }

async function rAll(make) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await make().range(from, from + 999)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

function rTot(list) {
  const done = list.filter((v) => v.clock_out_at)
  const t = { visits: done.length, open: list.length - done.length, hours: 0, bill: 0, pay: 0, miles: 0, pending: 0, verified: 0, billed: 0, mismatch: 0, verifiedAll: 0 }
  done.forEach((v) => {
    const h = rNum(v.worked_hours)
    t.hours += h; t.bill += rLine(h, v.bill_rate); t.pay += rLine(h, v.pay_rate); t.miles += rNum(v.mi)
    if (v.verified || v.billed) t.verifiedAll++
    if (v.billed) t.billed++; else if (v.verified) t.verified++; else t.pending++
    if (v.location_ok === false) t.mismatch++
  })
  return t
}
function rShiftStats(list) {
  const n = (o) => list.filter((s) => s.outcome === o).length
  const live = list.filter((s) => s.outcome !== 'cancelled_caregiver' && s.outcome !== 'cancelled_office')
  return {
    total: list.length, completed: n('completed'), inprogress: n('in_progress'), missed: n('missed'),
    cancelled: n('cancelled_caregiver'), cancelledOffice: n('cancelled_office'), upcoming: n('upcoming'),
    open: list.filter((s) => !s.caregiver_id && (s.outcome === 'upcoming' || s.outcome === 'missed')).length,
    hours: live.reduce((a, s) => a + (new Date(s.ends_at) - new Date(s.starts_at)) / 3600000, 0),
  }
}

async function rFetch({ type, id, start, end }) {
  const startISO = rToISO(start, '00:00')
  const endISO = rToISO(rNextDay(end), '00:00')
  const [clients, caregivers, shifts, ledger, invoices] = await Promise.all([
    rAll(() => supabase.from('clients').select('id,first_name,last_name,address,city,state,zip,phone,billing_email,authorized_hours_per_week,bill_rate,is_active').order('last_name')),
    rAll(() => supabase.from('caregivers').select('id,first_name,last_name,hourly_rate,max_hours_per_week,is_active').order('last_name')),
    rAll(() => {
      let q = supabase.from('v_shift_outcome').select('shift_id,client_id,caregiver_id,starts_at,ends_at,status,service_type,outcome,cancelled_by_caregiver_id').gte('starts_at', startISO).lt('starts_at', endISO).order('starts_at')
      if (type === 'client') q = q.eq('client_id', id)
      if (type === 'caregiver') q = q.or(`caregiver_id.eq.${id},cancelled_by_caregiver_id.eq.${id}`)
      return q
    }),
    rAll(() => {
      let q = supabase.from('v_visit_ledger').select('*').gte('clock_in_at', startISO).lt('clock_in_at', endISO).order('clock_in_at')
      if (type === 'client') q = q.eq('client_id', id)
      return q
    }),
    type === 'caregiver' ? Promise.resolve([]) : rAll(() => {
      let q = supabase.from('invoices').select('id,invoice_number,client_id,period_start,period_end,total,status,created_at').gte('period_end', start).lte('period_start', end).order('created_at')
      if (type === 'client') q = q.eq('client_id', id)
      return q
    }),
  ])
  const cMap = new Map(clients.map((c) => [c.id, c]))
  const gMap = new Map(caregivers.map((c) => [c.id, c]))
  const cl = type === 'client' ? cMap.get(id) : null
  const cg = type === 'caregiver' ? gMap.get(id) : null
  if (type === 'client' && !cl) throw new Error('Client not found.')
  if (type === 'caregiver' && !cg) throw new Error('Caregiver not found.')
  let visits = ledger
  if (type === 'caregiver') {
    const key = rKey(rName(cg))
    visits = ledger.filter((v) => (v.caregiver_id != null ? v.caregiver_id === id : rKey(v.caregiver_name) === key))
  }
  const miles = {}
  try {
    const vs = await rAll(() => supabase.from('visits').select('id,mileage_miles').gte('clock_in_at', startISO).lt('clock_in_at', endISO))
    vs.forEach((v) => { miles[v.id] = rNum(v.mileage_miles) })
  } catch (e) { console.warn('Mileage unavailable', e) }
  visits.forEach((v) => { v.mi = rNum(miles[v.visit_id]) })
  const notes = new Map()
  if (type === 'client') {
    try {
      const ids = visits.map((v) => v.visit_id)
      for (let i = 0; i < ids.length; i += 80) {
        const { data } = await supabase.from('visit_notes').select('visit_id,body,created_at').in('visit_id', ids.slice(i, i + 80)).order('created_at')
        ;(data || []).forEach((n) => { if (!notes.has(n.visit_id)) notes.set(n.visit_id, []); notes.get(n.visit_id).push(n.body) })
      }
    } catch (e) { console.warn('Notes unavailable', e) }
  }
  const outShifts = shifts.map((s) => ({ ...s, id: s.shift_id, ...(type === 'caregiver' && s.caregiver_id !== id && s.cancelled_by_caregiver_id === id ? { outcome: 'cancelled_caregiver' } : {}) }))
  return { type, id, start, end, clients, caregivers, shifts: outShifts, visits, invoices, notes, cMap, gMap, cl, cg }
}

/* ---- drawing helpers ---- */
const R_HEAD = { fillColor: NAVY, textColor: 255, fontSize: 8.5 }
const rRoom = (S, y, need) => { if (y + need > 262) { S.doc.addPage(); S.ensure(); return 42 } return y }
const rTbl = (S, o) => {
  autoTable(S.doc, {
    margin: { top: 38, left: 14, right: 14, bottom: 18 },
    didDrawPage: S.ensure, headStyles: R_HEAD, bodyStyles: { fontSize: 8 },
    didParseCell: (data) => {
      const cs = (o.columnStyles || {})[data.column.index]
      if (cs && cs.halign && data.section !== 'body') data.cell.styles.halign = cs.halign
    },
    footStyles: { fillColor: [232, 238, 246], textColor: 20, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [244, 247, 251] }, ...o,
  })
  return S.doc.lastAutoTable.finalY + 6
}
const rH = (S, text, y) => {
  y = rRoom(S, y, 28)
  const W = S.doc.internal.pageSize.getWidth()
  S.doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(12).text(text, 14, y)
  S.doc.setDrawColor(...GOLD).setLineWidth(0.5).line(14, y + 1.8, W - 14, y + 1.8)
  return y + 7
}
function rTitle(S, title, subs) {
  const d = S.doc
  d.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(18)
  const tl = d.splitTextToSize(title, 186)
  d.text(tl, 14, 44)
  let y = 44 + tl.length * 7
  d.setTextColor(...GREY).setFont('helvetica', 'normal').setFontSize(9.5)
  subs.forEach((t) => { const l = d.splitTextToSize(t, 186); d.text(l, 14, y); y += l.length * 4.6 })
  return y + 5
}
function rKV(S, y, pairs) {
  const rows = []
  for (let i = 0; i < pairs.length; i += 2) {
    rows.push([pairs[i][0], String(pairs[i][1]), pairs[i + 1] ? pairs[i + 1][0] : '', pairs[i + 1] ? String(pairs[i + 1][1]) : ''])
  }
  return rTbl(S, {
    startY: y, body: rows, theme: 'grid', bodyStyles: { fontSize: 9 }, alternateRowStyles: {},
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [232, 238, 246], cellWidth: 48 }, 1: { halign: 'right', cellWidth: 43 },
      2: { fontStyle: 'bold', fillColor: [232, 238, 246], cellWidth: 48 }, 3: { halign: 'right', cellWidth: 43 },
    },
  })
}
const rRight = (idx) => Object.fromEntries(idx.map((i) => [i, { halign: 'right' }]))

function rVisitTable(S, y, list, mode) {
  if (!list.length) {
    S.doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...GREY).text('No visits in this period.', 14, y + 2)
    return y + 10
  }
  const T = rTot(list)
  const done = (v) => !!v.clock_out_at
  const cfg = {
    full: {
      head: ['Date', 'Caregiver', 'In', 'Out', 'Hours', 'Amount', 'GPS', 'Status'], right: [4, 5],
      row: (v) => [dStamp(v.clock_in_at), rNorm(v.caregiver_name), rT(v.clock_in_at), rT(v.clock_out_at), done(v) ? rHrs(v.worked_hours) : '—', done(v) ? money(rLine(v.worked_hours, v.bill_rate)) : '—', rGps(v), rStatus(v)],
      foot: ['', '', '', 'Total', rHrs(T.hours), money(T.bill), '', ''],
    },
    client: {
      head: ['Date', 'Caregiver', 'In', 'Out', 'Hours', 'Bill rate', 'Amount', 'Miles', 'GPS', 'Status'], right: [4, 5, 6, 7],
      row: (v) => [dStamp(v.clock_in_at), rNorm(v.caregiver_name), rT(v.clock_in_at), rT(v.clock_out_at), done(v) ? rHrs(v.worked_hours) : '—', money(v.bill_rate), done(v) ? money(rLine(v.worked_hours, v.bill_rate)) : '—', v.mi ? v.mi.toFixed(1) : '—', rGps(v), rStatus(v)],
      foot: ['', '', '', 'Total', rHrs(T.hours), '', money(T.bill), T.miles.toFixed(1), '', ''],
    },
    caregiver: {
      head: ['Date', 'Client', 'In', 'Out', 'Hours', 'Pay rate', 'Pay', 'Miles', 'GPS', 'Status'], right: [4, 5, 6, 7],
      row: (v) => [dStamp(v.clock_in_at), rNorm(v.client_name), rT(v.clock_in_at), rT(v.clock_out_at), done(v) ? rHrs(v.worked_hours) : '—', money(v.pay_rate), done(v) ? money(rLine(v.worked_hours, v.pay_rate)) : '—', v.mi ? v.mi.toFixed(1) : '—', rGps(v), rStatus(v)],
      foot: ['', '', '', 'Total', rHrs(T.hours), '', money(T.pay), T.miles.toFixed(1), '', ''],
    },
  }[mode]
  return rTbl(S, { startY: y, head: [cfg.head], body: list.map(cfg.row), foot: [cfg.foot], columnStyles: rRight(cfg.right) })
}

const R_OUT = { completed: 'Completed', in_progress: 'In progress', missed: 'Missed', upcoming: 'Upcoming', cancelled_caregiver: 'Cancelled by caregiver', cancelled_office: 'Cancelled by office' }
const rNote = (S, y, text) => {
  y = rRoom(S, y, 14)
  S.doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(...GREY)
  const l = S.doc.splitTextToSize(text, 186)
  S.doc.text(l, 14, y)
  return y + l.length * 4 + 3
}
function rShiftIssues(S, y, D) {
  const rows = D.shifts.filter((s) => s.outcome && s.outcome !== 'completed')
  if (!rows.length) return y
  y = rH(S, 'Shifts not completed', y)
  y = rTbl(S, {
    startY: y, head: [['Date', 'Client', 'Caregiver', 'Scheduled', 'Outcome']],
    body: rows.map((s) => {
      const gid = s.outcome === 'cancelled_caregiver' ? (s.cancelled_by_caregiver_id || s.caregiver_id) : s.caregiver_id
      return [dStamp(s.starts_at), rName(D.cMap.get(s.client_id)) || '—', gid ? (rName(D.gMap.get(gid)) || '—') : 'Unassigned', `${rT(s.starts_at)} - ${rT(s.ends_at)}`, R_OUT[s.outcome] || s.outcome]
    }),
  })
  return rNote(S, y, 'Missed = the shift time passed with no clock-in. Cancelled by caregiver = released from the Care App. Upcoming = not due yet.')
}

function rWeekly(S, y, done, limit, limitLabel, D) {
  const m = {}
  done.forEach((v) => { const k = rWeekKey(v.clock_in_at); m[k] = (m[k] || 0) + rNum(v.worked_hours) })
  const weeks = Object.entries(m).sort()
  if (!weeks.length) return y
  y = rH(S, 'Weekly hours', y)
  return rTbl(S, {
    startY: y, head: [['Week of (Sunday)', 'Hours worked', limitLabel, 'Difference']],
    body: weeks.map(([k, h]) => {
      const lim = rNum(limit)
      const diff = lim ? h - lim : null
      return [dDate(k), rHrs(h), lim ? rHrs(lim) : '—', diff == null ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`]
    }),
    columnStyles: rRight([1, 2, 3]),
  })
}

/* ---- FULL AGENCY REPORT ---- */
function rBuildFull(S, D) {
  const done = D.visits.filter((v) => v.clock_out_at)
  const T = rTot(D.visits), SS = rShiftStats(D.shifts)
  const invTotal = D.invoices.reduce((s, i) => s + rNum(i.total), 0)
  let y = rTitle(S, 'Full Agency Report', [`Period: ${dDate(D.start)} to ${dDate(D.end)}`, `Generated: ${dStamp(new Date().toISOString())}   |   All clients and all caregivers`])
  y = rH(S, 'Overview', y)
  y = rKV(S, y, [
    ['Clients served', new Set(done.map((v) => v.client_id)).size], ['Caregivers worked', new Set(done.map((v) => rKey(v.caregiver_name))).size],
    ['Shifts scheduled', SS.total], ['Shifts completed', SS.completed],
    ['Shifts missed', SS.missed], ['Cancelled by caregiver', SS.cancelled],
    ['Upcoming / in progress', SS.upcoming + SS.inprogress], ['Cancelled by office', SS.cancelledOffice],
    ['Unassigned shifts', SS.open], ['Scheduled hours', rHrs(SS.hours)],
    ['Visits completed', T.visits], ['Hours worked', rHrs(T.hours)],
    ['Billable revenue', money(T.bill)], ['Caregiver payroll', money(T.pay)],
    ['Gross margin', money(T.bill - T.pay)], ['Margin %', T.bill ? ((T.bill - T.pay) / T.bill * 100).toFixed(1) + '%' : '—'],
    ['Invoices in period', D.invoices.length], ['Total invoiced', money(invTotal)],
    ['Verified visits', T.verifiedAll], ['Awaiting verification', T.pending],
    ['Invoiced visits', T.billed], ['Still clocked in', T.open],
    ['GPS mismatches', T.mismatch], ['Mileage recorded (mi)', T.miles.toFixed(1)],
  ])

  // Clients summary
  const clientRows = [...rGroup(D.visits, (v) => v.client_id).entries()].map(([cid, list]) => ({
    cid, list, t: rTot(list), name: rName(D.cMap.get(cid)) || rNorm(list[0].client_name),
    inv: D.invoices.filter((i) => i.client_id === cid).reduce((s, i) => s + rNum(i.total), 0),
  })).sort((a, b) => a.name.localeCompare(b.name))
  y = rH(S, 'Clients summary', y)
  y = rTbl(S, {
    startY: y, head: [['Client', 'Visits', 'Hours', 'Billable', 'Caregiver pay', 'Invoiced', 'Pending']],
    body: clientRows.map((c) => [c.name, c.t.visits, rHrs(c.t.hours), money(c.t.bill), money(c.t.pay), money(c.inv), c.t.pending]),
    foot: [['Total', T.visits, rHrs(T.hours), money(T.bill), money(T.pay), money(invTotal), T.pending]],
    columnStyles: rRight([1, 2, 3, 4, 5, 6]),
  })

  // Caregiver stats
  const keyMap = new Map()
  D.caregivers.forEach((g) => keyMap.set(rKey(rName(g)), { id: g.id, name: rName(g) }))
  D.visits.forEach((v) => { const k = rKey(v.caregiver_name); if (k && !keyMap.has(k)) keyMap.set(k, { id: v.caregiver_id || null, name: rNorm(v.caregiver_name) }) })
  const cgRows = [...keyMap.entries()].map(([k, g]) => {
    const vs = D.visits.filter((v) => rKey(v.caregiver_name) === k)
    const ss = g.id ? D.shifts.filter((s) => s.caregiver_id === g.id || s.cancelled_by_caregiver_id === g.id).map((s) => (s.caregiver_id !== g.id ? { ...s, outcome: 'cancelled_caregiver' } : s)) : []
    return { name: g.name, t: rTot(vs), s: rShiftStats(ss), vs, ss }
  }).filter((r) => r.vs.length || r.s.total).sort((a, b) => a.name.localeCompare(b.name))
  y = rH(S, 'Caregiver statistics', y)
  y = rTbl(S, {
    startY: y, head: [['Caregiver', 'Shifts', 'Done', 'Missed', 'Cancelled', 'Visits', 'Hours', 'Pay', 'Miles', 'GPS flags', 'Pending']],
    body: cgRows.map((r) => [r.name, r.s.total, r.s.completed, r.s.missed, r.s.cancelled, r.t.visits, rHrs(r.t.hours), money(r.t.pay), r.t.miles.toFixed(1), r.t.mismatch, r.t.pending]),
    foot: [['Total', SS.total, SS.completed, SS.missed, SS.cancelled, T.visits, rHrs(T.hours), money(T.pay), T.miles.toFixed(1), T.mismatch, T.pending]],
    columnStyles: rRight([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  })

  // Invoice register
  if (D.invoices.length) {
    y = rH(S, 'Invoice register', y)
    y = rTbl(S, {
      startY: y, head: [['Invoice', 'Client', 'Period', 'Status', 'Total']],
      body: D.invoices.map((i) => [i.invoice_number, rName(D.cMap.get(i.client_id)) || '—', `${dDate(i.period_start)} - ${dDate(i.period_end)}`, rCap(i.status), money(i.total)]),
      foot: [['', '', '', 'Total', money(invTotal)]], columnStyles: rRight([4]),
    })
  }

  // Needs attention
  const issues = []
  D.visits.forEach((v) => {
    const base = [dStamp(v.clock_in_at), rNorm(v.client_name), rNorm(v.caregiver_name)]
    if (!v.clock_out_at) issues.push([...base, 'Still clocked in / no clock-out'])
    else if (!v.verified) issues.push([...base, 'Awaiting verification'])
    if (v.clock_out_at && v.location_ok === false) issues.push([...base, 'GPS mismatch'])
  })
  D.shifts.filter((s) => s.outcome === 'missed' || s.outcome === 'cancelled_caregiver').forEach((s) => {
    const gid = s.outcome === 'cancelled_caregiver' ? (s.cancelled_by_caregiver_id || s.caregiver_id) : s.caregiver_id
    issues.push([dStamp(s.starts_at), rName(D.cMap.get(s.client_id)) || '—', gid ? (rName(D.gMap.get(gid)) || '—') : 'Unassigned', s.outcome === 'missed' ? 'Missed shift' : 'Shift cancelled by caregiver'])
  })
  if (issues.length) {
    y = rH(S, 'Needs attention', y)
    y = rTbl(S, { startY: y, head: [['Date', 'Client', 'Caregiver', 'Issue']], body: issues })
  }

  // Per-client detail
  if (clientRows.length) {
    S.doc.addPage(); S.ensure(); y = 42
    y = rH(S, 'Client detail', y)
    clientRows.forEach((c) => {
      y = rRoom(S, y, 55)
      y = rH(S, c.name, y)
      const cgs = [...new Set(c.list.map((v) => rNorm(v.caregiver_name)))].filter(Boolean)
      S.doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60, 60, 60)
      const lines = S.doc.splitTextToSize(`${c.t.visits} visits  |  ${rHrs(c.t.hours)} hours  |  ${money(c.t.bill)} billable  |  Caregivers: ${cgs.join(', ') || '—'}`, 186)
      S.doc.text(lines, 14, y); y += lines.length * 4.4 + 2
      y = rVisitTable(S, y, c.list, 'full')
    })
  }
}

/* ---- SPECIFIC CLIENT REPORT ---- */
function rBuildClient(S, D) {
  const c = D.cl, name = rName(c)
  const done = D.visits.filter((v) => v.clock_out_at)
  const T = rTot(D.visits), SS = rShiftStats(D.shifts)
  const invTotal = D.invoices.reduce((s, i) => s + rNum(i.total), 0)
  const weeks = rWeeksIn(D.start, D.end)
  const addr = [c.address, [c.city, c.state].filter(Boolean).join(', '), c.zip].filter(Boolean).join(' ')
  const unInv = done.filter((v) => v.verified && !v.billed).reduce((s, v) => s + rLine(v.worked_hours, v.bill_rate), 0)
  let y = rTitle(S, `Client Report: ${name}`, [
    `Period: ${dDate(D.start)} to ${dDate(D.end)}`,
    `Address: ${addr || '—'}   |   Phone: ${c.phone || '—'}${c.billing_email ? `   |   Billing email: ${c.billing_email}` : ''}`,
    `Generated: ${dStamp(new Date().toISOString())}`,
  ])
  y = rH(S, 'Overview', y)
  y = rKV(S, y, [
    ['Authorized hours / week', c.authorized_hours_per_week != null ? rHrs(c.authorized_hours_per_week) : 'Not set'], ['Average hours / week', rHrs(T.hours / weeks)],
    ['Shifts scheduled', SS.total], ['Shifts completed', SS.completed],
    ['Shifts missed', SS.missed], ['Cancelled by caregiver', SS.cancelled],
    ['Upcoming / in progress', SS.upcoming + SS.inprogress], ['Cancelled by office', SS.cancelledOffice],
    ['Unassigned shifts', SS.open], ['Visits completed', T.visits],
    ['Hours worked', rHrs(T.hours)], ['Bill rate', c.bill_rate != null ? money(c.bill_rate) + '/h' : '—'],
    ['Billable amount', money(T.bill)], ['Total invoiced', money(invTotal)],
    ['Verified visits', T.verifiedAll], ['Awaiting verification', T.pending],
    ['Invoiced visits', T.billed], ['Verified, not yet invoiced', `${T.verified} visit(s), ${money(unInv)}`],
    ['GPS mismatches', T.mismatch], ['Mileage recorded (mi)', T.miles.toFixed(1)],
  ])

  const byCg = [...rGroup(done, (v) => rKey(v.caregiver_name)).entries()].map(([k, l]) => {
    const sorted = [...l].sort((a, b) => new Date(a.clock_in_at) - new Date(b.clock_in_at))
    return { name: rNorm(l[0].caregiver_name), t: rTot(l), first: sorted[0].clock_in_at, last: sorted[sorted.length - 1].clock_in_at }
  }).sort((a, b) => a.name.localeCompare(b.name))
  if (byCg.length) {
    y = rH(S, 'Caregivers who served this client', y)
    y = rTbl(S, {
      startY: y, head: [['Caregiver', 'Visits', 'Hours', 'Billable', 'First visit', 'Last visit']],
      body: byCg.map((g) => [g.name, g.t.visits, rHrs(g.t.hours), money(g.t.bill), dStamp(g.first), dStamp(g.last)]),
      columnStyles: rRight([1, 2, 3]),
    })
  }
  y = rWeekly(S, y, done, c.authorized_hours_per_week, 'Authorized', D)

  if (D.invoices.length) {
    y = rH(S, 'Invoices', y)
    y = rTbl(S, {
      startY: y, head: [['Invoice', 'Period', 'Status', 'Issued', 'Total']],
      body: D.invoices.map((i) => [i.invoice_number, `${dDate(i.period_start)} - ${dDate(i.period_end)}`, rCap(i.status), dStamp(i.created_at), money(i.total)]),
      foot: [['', '', '', 'Total', money(invTotal)]], columnStyles: rRight([4]),
    })
  }

  y = rH(S, 'Visit detail', y)
  y = rVisitTable(S, y, D.visits, 'client')
  y = rShiftIssues(S, y, D)

  const noteRows = []
  D.visits.forEach((v) => (D.notes.get(v.visit_id) || []).forEach((n) => noteRows.push([dStamp(v.clock_in_at), rNorm(v.caregiver_name), n])))
  if (noteRows.length) {
    y = rH(S, 'Visit notes', y)
    y = rTbl(S, { startY: y, head: [['Date', 'Caregiver', 'Note']], body: noteRows, columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 36 } } })
  }
}

/* ---- SPECIFIC CAREGIVER REPORT ---- */
function rBuildCaregiver(S, D) {
  const g = D.cg, name = rName(g)
  const done = D.visits.filter((v) => v.clock_out_at)
  const T = rTot(D.visits), SS = rShiftStats(D.shifts)
  const weeks = rWeeksIn(D.start, D.end)
  let y = rTitle(S, `Caregiver Report: ${name}`, [
    `Period: ${dDate(D.start)} to ${dDate(D.end)}`,
    `Hourly pay rate: ${g.hourly_rate != null ? money(g.hourly_rate) : '—'}   |   Max hours / week: ${g.max_hours_per_week != null ? rHrs(g.max_hours_per_week) : 'Not set'}`,
    `Generated: ${dStamp(new Date().toISOString())}`,
  ])
  y = rH(S, 'Overview', y)
  y = rKV(S, y, [
    ['Shifts scheduled', SS.total], ['Shifts completed', SS.completed],
    ['Shifts missed', SS.missed], ['Cancelled by caregiver', SS.cancelled],
    ['Upcoming / in progress', SS.upcoming + SS.inprogress], ['Cancelled by office', SS.cancelledOffice],
    ['Visits completed', T.visits], ['Hours worked', rHrs(T.hours)],
    ['Gross pay', money(T.pay)], ['Average hours / week', rHrs(T.hours / weeks)],
    ['Clients served', new Set(done.map((v) => v.client_id)).size], ['Mileage recorded (mi)', T.miles.toFixed(1)],
    ['GPS mismatches', T.mismatch], ['Awaiting verification', T.pending],
    ['Verified visits', T.verifiedAll], ['Still clocked in', T.open],
  ])

  const byClient = [...rGroup(done, (v) => v.client_id).entries()].map(([cid, l]) => ({
    name: rName(D.cMap.get(cid)) || rNorm(l[0].client_name), t: rTot(l),
  })).sort((a, b) => a.name.localeCompare(b.name))
  if (byClient.length) {
    y = rH(S, 'Clients served', y)
    y = rTbl(S, {
      startY: y, head: [['Client', 'Visits', 'Hours', 'Pay', 'Miles']],
      body: byClient.map((r) => [r.name, r.t.visits, rHrs(r.t.hours), money(r.t.pay), r.t.miles.toFixed(1)]),
      foot: [['Total', T.visits, rHrs(T.hours), money(T.pay), T.miles.toFixed(1)]], columnStyles: rRight([1, 2, 3, 4]),
    })
  }
  y = rWeekly(S, y, done, g.max_hours_per_week, 'Max / week', D)
  y = rH(S, 'Visit detail', y)
  y = rVisitTable(S, y, D.visits, 'caregiver')
  y = rShiftIssues(S, y, D)
}

/* ---- Entry point used by the Download report dialog ---- */
export async function generateReportPdf({ type, id, start, end }) {
  if (!start || !end || start > end) throw new Error('Choose a valid date range (start must not be after end).')
  if ((type === 'client' || type === 'caregiver') && !id) throw new Error(`Choose a ${type} first.`)
  const [logo, D] = await Promise.all([loadLogo(), rFetch({ type, id, start, end })])
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const drawn = new Set()
  const agency = { phone: AGENCY.phone, email: AGENCY.email }
  const S = {
    doc,
    ensure: () => {
      const n = doc.internal.getCurrentPageInfo().pageNumber
      if (!drawn.has(n)) { header(doc, logo, agency); drawn.add(n) }
    },
  }
  S.ensure()
  let label, tag, who = ''
  if (type === 'full') { rBuildFull(S, D); label = 'Full Agency Report'; tag = 'FullReport' }
  else if (type === 'client') { rBuildClient(S, D); who = rSlug(rName(D.cl)); label = `Client Report - ${rName(D.cl)}`; tag = 'ClientReport' }
  else { rBuildCaregiver(S, D); who = rSlug(rName(D.cg)); label = `Caregiver Report - ${rName(D.cg)}`; tag = 'CaregiverReport' }
  footer(doc, `${AGENCY.name}  |  ${label}  |  ${start} to ${end}  |  Confidential`)
  doc.setProperties({ title: label })
  doc.save(`GY-${tag}${who ? '_' + who : ''}_${start}_to_${end}_generated-${rDate(new Date())}.pdf`)
}
