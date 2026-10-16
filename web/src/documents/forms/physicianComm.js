// Nurse → physician communication (SBAR), laid out to print, scan or fax to
// the physician, with a response section for the physician to sign and return.
import { AGENCY } from '../brand.js'
import { renderItems } from '../formkit.js'

export const title = 'Physician Communication (SBAR)'

export const schema = [
  { t: 'title', text: 'Physician Communication', sub: 'Nurse-to-physician report (SBAR) — please review, respond and fax back' },
  { t: 'html', html: `<table class="form fax-strip"><tr>
<td><b>To (physician):</b> {{pc_to|Physician name|1.8in}}</td><td><b>Fax:</b> {{pc_to_fax|Physician fax|1.1in}}</td><td><b>Phone:</b> {{pc_to_phone|Physician phone|1.1in}}</td></tr><tr>
<td><b>From (nurse):</b> {{pc_from|Nurse name & credentials|1.8in}}</td><td><b>Return fax:</b> {{pc_return_fax|Agency return fax|1.1in}}</td><td><b>Phone:</b> ${AGENCY.phone}</td></tr><tr>
<td><b>Date / time sent:</b> {{pc_sent|Date and time sent|1.6in}}</td><td colspan="2"><b>Pages (incl. this one):</b> {{pc_pages|Number of pages|0.5in}}</td></tr></table>` },
  { t: 'yn', k: 'pc_urgency', label: '<b>Response needed:</b>', opts: ['Routine (72 hrs)', 'Within 24 hours', 'Urgent — call the nurse', 'FYI — no response needed'] },
  { t: 'row', f: [['patient_name', 'Patient:'], ['dob', 'DOB:', 'w2', 'date'], ['mr', 'Record #:', 'w2'], ['pc_diagnosis', 'Diagnosis:']] },
  { t: 'cols', cols: [
    [{ t: 'sh', text: 'S — Situation' }, { t: 'box', k: 'pc_situation', label: 'What is happening now — reason for this communication', h: 46 }],
    [{ t: 'sh', text: 'B — Background' }, { t: 'box', k: 'pc_background', label: 'Relevant history, medications / treatments, recent changes', h: 46 }],
  ] },
  { t: 'sh', text: 'A — Assessment' },
  { t: 'table', k: 'pc_vitals', head: ['BP', 'Pulse', 'Resp', 'Temp', 'O₂ sat', 'Weight', 'Blood sugar', 'Pain (0–10)'], rows: [[null, null, null, null, null, null, null, null]], rowH: 16 },
  { t: 'box', k: 'pc_assessment', label: 'Nursing findings and what the nurse thinks the problem is', h: 30 },
  { t: 'sh', text: 'R — Request' },
  { t: 'checks', k: 'pc_request', label: '', opts: ['Review and advise', 'New or changed order', 'Medication change / refill', 'Lab order', 'Therapy / MSW referral', 'Change in visit frequency', 'Office / urgent care / ER visit', 'Signature on enclosed orders'], cols: 4 },
  { t: 'p', html: '<b>Details:</b> {{pc_request_detail|Details of the request|6.3in}}' },
  { t: 'sig', f: [['pc_nurse_sig', 'Nurse signature'], ['pc_nurse_date', 'Date / time', 'date']] },
  { t: 'html', html: '<div class="md-resp">' },
  { t: 'sh', text: 'Physician response' },
  { t: 'checks', k: 'pc_md', label: '', opts: ['Orders as written below', 'No new orders', 'Will see patient', 'Please call me'], cols: 4 },
  { t: 'lines', k: 'pc_md_orders', label: 'Orders / comments', n: 4 },
  { t: 'sig', f: [['pc_md_sig', 'Physician signature'], ['pc_md_name', 'Printed name'], ['pc_md_date', 'Date / time', 'date']] },
  { t: 'html', html: '</div>' },
  { t: 'p', cls: 'note', html: `<b>Confidential:</b> this fax contains protected health information for the named recipient only. If you received it in error, please notify ${AGENCY.legal} at ${AGENCY.phone} and destroy all copies. Signed orders become part of the patient's clinical record.` },
]

const CSS = `<style>
table.fax-strip td { border-color: #d9c57f; background: #fffdf6; padding: 4pt 6pt; }
.md-resp { border: 1.2pt solid #0b5394; border-radius: 4pt; padding: 2pt 8pt 4pt; margin-top: 8pt; break-inside: avoid; }
.md-resp .form-section > .sh { margin-top: 4pt; }
.pc { zoom: .93; }
.pc .form-section > .sh { margin: 5pt 0 3pt; }
.pc .doc-title { margin-bottom: 2pt; } .pc .doc-title h1 { margin-bottom: 3pt; padding-bottom: 3pt; font-size: 15pt; } .pc .doc-title .sub { margin: 0 0 2pt; }
.pc > p.note { font-size: 7pt; margin: 4pt 0 0; line-height: 1.25; }
.md-resp { margin-top: 5pt !important; padding-top: 0 !important; }
.pc .sig { margin: 8pt 0 2pt; }
.md-resp .sig { margin: 12pt 0 2pt; }
.pc .cbs { margin-bottom: 0; }
</style>`

export const render = (data = {}) => `${CSS}<div class="dense pc">${renderItems(schema, data)}</div>`
