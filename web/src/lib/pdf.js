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

export async function downloadInvoicePdf(invoice) {
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
    body: items.map((i) => [dDate(i.service_date), i.description, Number(i.hours).toFixed(2), money(i.rate), money(i.amount)]),
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
