// Caregiver Progress Notes — the visit log home care aides / home health aides
// write in after each visit. Also printed (blank) at the back of both manuals.
import { esc } from '../brand.js'

export const title = 'Caregiver Progress Notes'

export const ROWS_PER_PAGE = 8
export const PAGES = 2
const N = ROWS_PER_PAGE * PAGES

const entry = (i) => [
  { t: 'sh2', text: `Visit ${i}` },
  { t: 'row', f: [[`pn${i}_date`, 'Date', '', 'date'], [`pn${i}_in`, 'Time in'], [`pn${i}_out`, 'Time out']] },
  { t: 'lines', k: `pn${i}_note`, label: 'Care provided, observations, changes in condition, client response', n: 3 },
  { t: 'row', f: [[`pn${i}_cg`, 'Caregiver name / initials']] },
]

// What the fill-in modal shows: client details, then the visits four at a time.
export const schema = [
  { t: 'sh', text: 'Client & caregiver' },
  { t: 'row', f: [['patient_name', 'Client name'], ['mr', 'Record #'], ['pn_month', 'Month / year']] },
  { t: 'row', f: [['pn_caregiver', 'Primary caregiver'], ['pn_service', 'Service (home care aide / homemaker / home health aide)']] },
  ...Array.from({ length: N / 4 }, (_, g) => [
    { t: 'sh', text: `Visits ${g * 4 + 1}–${g * 4 + 4}` },
    ...Array.from({ length: 4 }, (_, j) => entry(g * 4 + j + 1)).flat(),
  ]).flat(),
  { t: 'sh', text: 'Supervisor review' },
  { t: 'sig', f: [['pn_rev_sig', 'Reviewed by (Supervisor / RN) — signature'], ['pn_rev_date', 'Date', 'date']] },
]

const v = (d, k) => esc(d?.[k] ?? '')
const note = (d, k) => esc(d?.[k] ?? '').replace(/\n/g, '<br>')

function page(d, p, opts) {
  const first = p * ROWS_PER_PAGE + 1
  const rows = Array.from({ length: ROWS_PER_PAGE }, (_, j) => {
    const i = first + j
    const tin = v(d, `pn${i}_in`), tout = v(d, `pn${i}_out`)
    return `<tr class="pn-row"><td class="c pn-n">${i}</td><td class="v">${v(d, `pn${i}_date`)}</td>`
      + `<td class="v">${tin || tout ? `${tin}<br>${tout ? `– ${tout}` : ''}` : ''}</td>`
      + `<td class="v pn-note">${note(d, `pn${i}_note`)}</td><td class="v">${v(d, `pn${i}_cg`)}</td></tr>`
  }).join('')
  const h = opts.tocId && p === 0
    ? `<h2 id="${opts.tocId}" class="pol" data-toc="1" style="margin:0">${opts.tocTitle || 'Caregiver Progress Notes'}</h2>`
    : '<h1>Caregiver Progress Notes</h1>'
  const head = `<div class="doc-title">${h}<div class="sub">Home care aide · homemaker · home health aide visit notes${PAGES > 1 ? ` — page ${p + 1} of ${PAGES}` : ''}</div></div>`
  const info = `<div class="row"><div class="fld"><span class="lb">Client name:</span><span class="vl">${v(d, 'patient_name')}</span></div>`
    + `<div class="fld w3"><span class="lb">Record #:</span><span class="vl">${v(d, 'mr')}</span></div>`
    + `<div class="fld w3"><span class="lb">Month / year:</span><span class="vl">${v(d, 'pn_month')}</span></div></div>`
    + `<div class="row"><div class="fld"><span class="lb">Primary caregiver:</span><span class="vl">${v(d, 'pn_caregiver')}</span></div>`
    + `<div class="fld"><span class="lb">Service:</span><span class="vl">${v(d, 'pn_service')}</span></div></div>`
  const guide = p === 0
    ? `<p class="note">Write a note at the end of every visit, in ink, before you leave the home. Describe the care you gave (per the care plan), what you observed, any change in the client's condition, mood or appetite, and how the client responded. Report falls, injuries, new pain, skin changes, refusals or anything unusual to the Supervisor right away and note who you told. Do not leave blank lines between entries; if you make an error, draw one line through it and initial it.</p>`
    : ''
  const review = p === PAGES - 1
    ? `<div class="sig"><div><div class="line">${v(d, 'pn_rev_sig')}</div><div class="cap">Reviewed by (Supervisor / RN) — signature</div></div><div class="d"><div class="line">${v(d, 'pn_rev_date')}</div><div class="cap">Date</div></div></div>`
    : ''
  return `<section class="${p || opts.breakFirst ? 'page-break ' : ''}grp pn-page">${head}${info}${guide}
<table class="form pn"><tr><th class="c" style="width:16pt">#</th><th style="width:62pt">Date</th><th style="width:58pt">Time in / out</th><th>Care provided · observations · changes in condition · client response</th><th style="width:92pt">Caregiver name &amp; initials</th></tr>${rows}</table>${review}</section>`
}

const CSS = `<style>
table.pn tr.pn-row td { height: 50pt; }
table.pn td.pn-n { color: #0b5394; font-weight: 600; text-align: center; vertical-align: middle; }
table.pn td.pn-note { background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 13.6pt, #dbe3ec 13.6pt, #dbe3ec 14.3pt); font-size: 8.6pt; line-height: 14.3pt; }
</style>`

/** opts.tocId/tocTitle: first title becomes a table-of-contents heading (manual appendix). opts.breakFirst: start on a new page. */
export function render(data = {}, opts = {}) {
  return CSS + Array.from({ length: PAGES }, (_, p) => page(data, p, opts)).join('\n')
}
