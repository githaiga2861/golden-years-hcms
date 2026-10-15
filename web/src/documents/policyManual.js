// The complete Policy & Procedure Manual as a fillable document. The manual's
// text lives in policy/manualBody.html; {{key|Label|width}} blanks and
// <!--FORM:x--> worksheets in it are filled from the same data object.
import { fillTokens } from './formkit.js'
import { coverPage } from './shell.js'
import { WORKSHEETS, manualInsert } from './forms/policyWorksheets.js'
import POSITIONS from './policy/positions.js'
import TOC_PAGES from './policy/pages.js'

export const title = 'Home Health Policy and Procedure Manual'

export const defaults = {
  off_president: 'Rose Mbote', off_admin: 'Eric Njoroge', off_alt_admin: 'Eric Njoroge', off_docs: 'Rose Mbote',
  mg_counties: 'King & Pierce Counties', mg_hours: '9:00 am to 5:00 pm, Monday through Friday',
  abs_admin: 'Eric Njoroge', abs_alt_admin: 'Ahmed M Ahmed MD MPH', abs_docs: 'Rose Mbote',
}

const ws = (key) => {
  const w = WORKSHEETS.find((x) => x.key === key)
  return { t: 'group', title: w.title, items: w.items.filter((it) => it.t !== 'title') }
}
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(Of|And|Or)\b/g, (m) => m.toLowerCase())

// What the fill-in modal shows, in the order the blanks appear in the manual.
export const schema = [
  { t: 'group', title: 'Agency Officers & Service Area', items: [
    { t: 'sh', text: 'List of officers (Plan of Operation)' },
    { t: 'row', f: [['off_president', 'President'], ['off_admin', 'Administrator / Disaster Coordinator / Privacy Officer']] },
    { t: 'row', f: [['off_alt_admin', 'Alternate Administrator'], ['off_docs', 'Director of Clinical Services / Alternate Administrator']] },
    { t: 'sh', text: 'Service area and hours' },
    { t: 'row', f: [['mg_counties', 'Counties served'], ['mg_hours', 'Hours of operation']] },
  ] },
  ws('review'),
  { t: 'group', title: 'Absence of the Administrator', items: [
    { t: 'sh', text: 'Administrator and alternates' },
    { t: 'row', f: [['abs_admin', 'Administrator'], ['abs_alt_admin', 'Alternate Administrator']] },
    { t: 'row', f: [['abs_alt_disaster', 'Alternate Disaster Coordinator']] },
    { t: 'sig', f: [['abs_admin_sig', 'Administrator, Disaster Coordinator — signature'], ['abs_admin_date', 'Date', 'date']] },
    { t: 'sig', f: [['abs_alt_sig', 'Accepted: Alternate Administrator — signature'], ['abs_alt_date', 'Date', 'date']] },
    { t: 'sh', text: 'Director of Clinical Services and alternate' },
    { t: 'row', f: [['abs_docs', 'Director of Clinical Services'], ['abs_alt_docs', 'Alternate Director of Clinical Services']] },
    { t: 'sig', f: [['abs_docs_sig', 'Director of Clinical Services — signature'], ['abs_docs_date', 'Date', 'date']] },
    { t: 'sig', f: [['abs_alt_docs_sig', 'Accepted: Alternate DOCS — signature'], ['abs_alt_docs_date', 'Date', 'date']] },
  ] },
  { t: 'group', title: 'Job Description Acknowledgments', items: POSITIONS.flatMap((p, i) => [
    { t: 'sh', text: titleCase(p) },
    { t: 'sig', f: [[`jd${i + 1}_name`, 'Employee name (print)'], [`jd${i + 1}_sig`, 'Employee signature'], [`jd${i + 1}_date`, 'Date', 'date']] },
  ]) },
  ws('emergency'),
  ws('risk'),
  ws('planeval'),
  ws('hva'),
  ws('recovery'),
  { t: 'group', title: 'Patient Bill of Rights — Acknowledgment', items: [
    { t: 'row', f: [['patient_name', 'Patient name (last, first)'], ['mr', 'Medical record #']] },
    { t: 'sig', f: [['pr_sig_patient', 'Signature of patient'], ['pr_sig_patient_date', 'Date', 'date']] },
    { t: 'sig', f: [['pr_sig_agency', 'Nurse/therapist (agency representative) signature'], ['pr_sig_agency_date', 'Date', 'date']] },
  ] },
]

/** Full manual body (cover, contents, text) filled with `data`. */
export function renderWithBody(body, data = {}, opts = {}) {
  const { logo, pages = TOC_PAGES } = opts
  const d = { ...defaults, ...data }
  let html = body.replace(/^\s*<!--[\s\S]*?-->/, '')
  html = html.replace(/<!--FORM:(\w+)-->/g, (_, k) => manualInsert(k, d))
  html = fillTokens(html, d)
  const heads = [...html.matchAll(/<h([123]) id="(\w+)"[^>]*data-toc="(\d)"[^>]*>(.*?)<\/h\1>/g)]
  const numbered = Object.keys(pages).length > 0
  const toc = heads.map(([, , id, lvl, text]) =>
    `<div class="te l${lvl}"><span class="tt">${text}</span>${numbered ? `<span class="dots"></span><span class="pg">${pages[id] ?? ''}</span>` : ''}</div>`).join('\n')
  html = html.replace(/(<h([123]) id="(\w+)"[^>]*data-toc="\d"[^>]*>)/g, '$1<span class="pm">§$3§</span>')
  const cover = coverPage({
    logo, kicker: 'In-Home Services Agency · Home Health', title: 'Home Health Policy and Procedure Manual',
    subtitle: 'Skilled home health services · Chapter 246-335 WAC (Home Health category)',
    meta: `Revised ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
  })
  return `${cover}\n<section class="toc"><h1>Table of Contents</h1>${toc}</section>\n${html}`
}

/** Browser: loads the manual text on demand (it's large), then renders. */
export async function render(data = {}, opts = {}) {
  const body = (await import('./policy/manualBody.html?raw')).default
  return renderWithBody(body, data, opts)
}

