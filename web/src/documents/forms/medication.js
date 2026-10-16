// Medication Profile (page 1) and monthly Medication Administration /
// Assistance Record (page 2). The modal fills the profile, the MAR's
// medication names and times; daily initials are written by hand.
import { esc } from '../brand.js'
import { renderItems } from '../formkit.js'

export const title = 'Medication Profile & Administration Record'

const MEDS = 14
const MAR_ROWS = 10

const profile = [
  { t: 'title', text: 'Medication Profile', sub: 'Current medications — prescription, over-the-counter, vitamins and herbal supplements' },
  { t: 'row', f: [['patient_name', 'Patient name:'], ['dob', 'Date of birth:', 'w2', 'date'], ['mr', 'Record #:', 'w2']] },
  { t: 'row', f: [['med_physician', 'Physician:'], ['med_physician_phone', 'Phone / fax:', 'w3']] },
  { t: 'row', f: [['med_pharmacy', 'Pharmacy:'], ['med_pharmacy_phone', 'Phone:', 'w3']] },
  { t: 'row', f: [['med_allergies', 'Allergies (drug / food / latex):'], ['med_diagnosis', 'Diagnoses:']] },
  { t: 'table', k: 'meds', label: 'Medications', cls: 'compact',
    head: ['Medication & strength', 'Dose', 'Route', 'Frequency / times', 'Purpose', 'Prescriber', 'Start', 'Stop / changed', 'N / C'],
    widths: ['20%', '8%', '7%', '12%', '13%', '11%', '8%', '9%', '5%'],
    rows: Array.from({ length: MEDS }, () => Array(9).fill(null)), rowH: 21 },
  { t: 'p', cls: 'note', html: 'N = new medication · C = changed dose or frequency. Review the full list at start of care, at every resumption of care, whenever a medication changes, and at least every 60 days. Report possible interactions, duplications or side effects to the physician.' },
  { t: 'row', f: [['med_self', 'Medication management: (independent / needs reminders / needs assistance / nurse-administered)']] },
  { t: 'sig', f: [['med_rev_sig', 'Reviewed by (RN) — signature'], ['med_rev_date', 'Date', 'date']] },
]

// What the modal shows.
export const schema = [
  ...profile,
  { t: 'sh', text: 'Monthly administration / assistance record' },
  { t: 'row', f: [['mar_month', 'Month / year'], ['mar_caregivers', 'Caregivers assisting']] },
  { t: 'table', k: 'mar', label: 'Medications on the monthly record', head: ['Medication, dose & route', 'Time(s)'], widths: ['70%'],
    rows: Array.from({ length: MAR_ROWS }, () => [null, null]) },
]

const v = (d, k) => esc(d?.[k] ?? '')

function mar(d) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const rows = Array.from({ length: MAR_ROWS }, (_, r) =>
    `<tr><td class="mar-med">${v(d, `mar.${r}.0`)}</td><td class="mar-t">${v(d, `mar.${r}.1`)}</td>${days.map(() => '<td></td>').join('')}</tr>`).join('')
  return `<section class="page-break grp">
<div class="doc-title"><h1>Medication Administration / Assistance Record</h1><div class="sub">Initial each dose given or assisted · use a code if not given</div></div>
<div class="row"><div class="fld"><span class="lb">Patient name:</span><span class="vl">${v(d, 'patient_name')}</span></div><div class="fld w3"><span class="lb">Month / year:</span><span class="vl">${v(d, 'mar_month')}</span></div><div class="fld w3"><span class="lb">Allergies:</span><span class="vl">${v(d, 'med_allergies')}</span></div></div>
<table class="form mar"><tr><th>Medication, dose &amp; route</th><th>Time</th>${days.map((n) => `<th>${n}</th>`).join('')}</tr>${rows}</table>
<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:14pt">
<div><div class="sh2">Codes</div><p class="note" style="margin:0">R = refused · H = hospital / away · N = not available · S = self-administered with reminder only · D = discontinued · O = other (explain in notes). Circle the initials for any dose not given and record the reason, and who was notified, in the visit notes.</p></div>
<table class="form compact"><tr><th>Initials</th><th>Full name &amp; title</th><th>Initials</th><th>Full name &amp; title</th></tr>${Array.from({ length: 3 }, () => '<tr style="height:16pt"><td></td><td></td><td></td><td></td></tr>').join('')}</table>
</div>
<p class="note">In-home caregivers may assist with self-administration only within their training and scope (WAC 246-888; nurse delegation under RCW 18.79.260). Medications are administered only by licensed staff or by delegation.</p>
</section>`
}

const CSS = `<style>
table.mar { font-size: 6.6pt; table-layout: fixed; }
table.mar th, table.mar td { padding: 1.5pt 1pt; text-align: center; }
table.mar th:first-child, table.mar td.mar-med { width: 96pt; text-align: left; padding-left: 3pt; }
table.mar th:nth-child(2), table.mar td.mar-t { width: 30pt; }
table.mar tr { height: 30pt; }
table.mar tr:first-child { height: auto; }
</style>`

export const render = (data = {}) => `${CSS}${renderItems(profile, data)}${mar(data)}`
