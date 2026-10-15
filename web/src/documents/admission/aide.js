// Home Health Aide care plan, time & activity record, and visit-note logs.
// The original task grid had broken numbering (items restarted mid-list);
// tasks are numbered 1–53 in one sequence here.
const DAYS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']

const LEFT = [
  ['Personal care tasks', ['Total bed bath', 'Assist bed bath', 'Assist shower', 'Assist tub', 'Sponge bath', 'Shampoo', 'Conditioner', 'Comb/brush hair', 'Brush teeth', 'Clean dentures', 'Apply lotion to skin', 'Dress', 'Shave: ☐ safety razor ☐ electric', 'Nail care: ☐ clean ☐ file', 'Medications: ☐ remind ☐ assist with self-administered meds', 'Apply: {{x}}', 'Remove: {{x}}']],
  ['Toilet / elimination tasks', ['Urinal', 'Bedpan', 'Commode', 'Toilet', 'Incontinence brief', 'Incontinence care', 'Empty urinary bag', '☐ Empty ostomy bag ☐ Rinse ostomy bag']],
  ['Special instructions', ['Vital signs: ☐ Temp ☐ Pulse ☐ Resp. ☐ B/P', 'Weigh', 'Other: {{x}}']],
]
const RIGHT = [
  ['Nutrition tasks', ['Prepare meal: ☐ B ☐ L ☐ D ☐ Snack', 'Total feed', 'Assist with feeding', 'Restrict fluids — amount for 24 hours: {{x}}']],
  ['Mobility tasks', ['Bedrest; turn q {{x}} hr.', 'Assist to transfer', 'Assist to ambulate', 'Wheelchair', 'Walker', 'Cane', 'Crutches', '☐ Exercise ☐ Range of motion']],
  ['Precautions', ['Infection control: hand washing; standard precautions', 'Choking', 'Bleeding', 'Oxygen safety', 'Fall prevention']],
  ['Support service tasks', ['Clean patient areas', 'Change bed linens', 'Make patient bed', 'Patient laundry', 'Shopping for: {{x}}', 'Errands to: {{x}}', 'Transportation to: {{x}}', 'Other: {{x}}']],
]

// Flatten to rows of [kind, label, number]
function flatten(groups, start) {
  let n = start
  const rows = []
  groups.forEach(([title, items]) => {
    rows.push(['h', title])
    items.forEach((it) => rows.push(['t', it, n++]))
  })
  return rows
}

// Builds the two-column task grid. `mode` 'plan' → checkbox per day;
// 'record' → small text cell per day (√ R S O).
export function taskGrid(k, mode) {
  const L = flatten(LEFT, 1)
  const R = flatten(RIGHT, 29)
  const n = Math.max(L.length, R.length)
  const dayCell = mode === 'plan' ? '[]' : null
  const half = (r, side, rowIdx) => {
    if (!r) return [{ s: '', span: 8 }]
    if (r[0] === 'h') return [{ h: r[1], style: 'background:#0b5394;color:#fff' }, ...DAYS.map((d) => ({ h: d, style: 'background:#0b5394;color:#fff;text-align:center;width:16pt' }))]
    const label = r[1].replace(/\{\{x\}\}/g, () => `{{${k}_${side}${rowIdx}|Task ${r[2]} detail|0.7in}}`)
    return [{ s: `<b style="color:#0b5394">${r[2]}.</b> ${label}` }, ...DAYS.map(() => dayCell)]
  }
  const rows = Array.from({ length: n }, (_, i) => [...half(L[i], 'l', i), ...half(R[i], 'r', i)])
  return { t: 'table', k, cls: `tasks ${mode}`, rows }
}

export const AIDE_HEADER = (title) => [
  { t: 'title', text: title },
  { t: 'row', f: [['patient_name', 'Patient name:'], ['dob', 'DOB:', 'w2', 'date'], ['mr', 'MR #:', 'w2'], ['soc_date', 'SOC date:', 'w2', 'date']] },
]

const carePlanItems = [
  ...AIDE_HEADER('Home Health Aide Care Plan'),
  { t: 'checks', k: 'sex', opts: ['Male', 'Female'], single: true, label: 'Sex' },
  { t: 'row', f: [['address', 'Patient address:'], ['phone', 'Patient phone number:', 'w3']] },
  { t: 'row', f: [['lives_with', 'Lives with:'], ['lives_with_rel', 'Relationship to patient:', 'w3']] },
  { t: 'yn', k: 'advance_directive', label: 'Advance directive:' },
  { t: 'row', f: [['emergency_contact', 'Emergency contact (name, relationship, phone):'], ['evac_plan', 'Evacuation plan:', 'w3']] },
  { t: 'checks', k: 'priority_level', label: 'Priority level', opts: ['I', 'II', 'III', 'IV'], single: true },
  { t: 'row', f: [['diagnosis', 'Diagnosis:']] },
  { t: 'row', f: [['allergies', 'Allergies:'], ['diet', 'Diet (specify):']] },
  { t: 'checks', k: 'devices', label: 'Assistive devices', cols: 4, opts: ['Hearing aids — R', 'Hearing aids — L', 'Glasses', 'Dentures', 'Cane', 'Walker', 'Wheelchair', 'Crutches', 'Hospital bed', 'Side rails', 'Gait belt', 'Slide board', 'Hoyer lift', 'Shower chair', 'Bedside commode', '3-in-1', 'Ostomy equipment', 'Prosthetic device', 'Splint', 'Cast', 'Brace', 'TED hose', 'Other: {{devices_other|Other device|0.8in}}'] },
  { t: 'checks', k: 'psychosocial', label: 'Psychosocial', opts: ['Alert', 'Oriented', 'Confused', 'Forgetful', 'Wanders'] },
  { t: 'checks', k: 'functional', label: 'Functional limitations', cols: 3, opts: ['Hard of hearing', 'Legally blind', 'Non-verbal communication', 'Amputee (site): {{amputee_site|Amputee site|0.8in}}', 'Paralyzed (site): {{paralyzed_site|Paralyzed site|0.8in}}', 'Incontinence — bladder', 'Incontinence — bowel', 'Other: {{functional_other|Other limitation|0.8in}}'] },
  { t: 'row', f: [['language', 'Primary language:', 'w3']] },
  { t: 'row', f: [['hha_discipline', 'Discipline to be provided:'], ['hha_duration', 'Duration of services:']] },
  { t: 'row', f: [['hha_frequency', 'Frequency of visits:']] },
  { t: 'row', f: [['hha_requests', 'Special requests from patient or family:']] },
  { t: 'row', f: [['hha_supervisor', 'Supervisor name and number:']] },
  { t: 'row', f: [['hha_superv_freq', 'Frequency of supervisory visits:']] },
  { t: 'checks', k: 'hha_goals', label: 'Goals for care', cols: 1, opts: ['Patient personal care/ADLs will be provided at an optimum level of personal hygiene.', 'Patient will receive assistance with personal care/ADLs to maintain an optimum level of personal hygiene.', 'Patient will become independent in personal care/ADLs within {{hha_goal_weeks|Weeks/months to independence|0.7in}} wk/mo.', 'Patient will be maintained in the home setting.', 'Patient will have home cleanliness maintained.', 'Other: {{hha_goal_other|Other goal|2.5in}}'] },
  { t: 'row', f: [['hha_rehab', 'Rehabilitation potential:']] },
  { t: 'yn', k: 'hha_bath_choice', label: 'The admission assessment has defined that the patient is cognizant and functionally able to determine what kind of bath he/she wants:' },
  { t: 'sh2', text: 'Tasks — days to be performed' },
  taskGrid('hha_plan', 'plan'),
  { t: 'lines', k: 'hha_report', label: 'Report the following changes to the supervisor (list):', n: 2 },
  { t: 'yn', k: 'hha_pt_participated', label: 'The patient or legal representative participated in development of the care plan:' },
  { t: 'row', f: [['hha_pt_participated_why', 'Explain why if no:']] },
  { t: 'yn', k: 'hha_discussed', label: 'The care plan was discussed with the discipline(s) that will be providing care:' },
  { t: 'row', f: [['hha_discussed_why', 'Explain why if no:']] },
  { t: 'sig', f: [['hha_completed_by', 'Care plan completed by (signature/title)'], ['hha_completed_date', 'Date', 'date']] },
  { t: 'sig', f: [['hha_reviewed_1', 'Care plan reviewed by (signature/title)'], ['hha_reviewed_1_date', 'Date', 'date']] },
  { t: 'sig', f: [['hha_reviewed_2', 'Care plan reviewed by (signature/title)'], ['hha_reviewed_2_date', 'Date', 'date']] },
]

export const aideCarePlanGroup = { t: 'group', title: 'Home Health Aide Care Plan', copies: ['Agency copy', 'Patient copy'], items: carePlanItems }

export const aideRecordGroup = {
  t: 'group', title: 'Home Health Aide Time and Activity Record', items: [
    { t: 'title', text: 'Home Health Aide Time and Activity Record' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['mr', 'MR #:', 'w3']] },
    { t: 'row', f: [['tar_hha', 'HHA signature:'], ['tar_hha_title', 'Title:', 'w3']] },
    { t: 'table', k: 'tar_times', head: ['', ...['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'].map((d) => `${d} / date`)], rows: [['Date', null, null, null, null, null, null, null], ['Time in', null, null, null, null, null, null, null], ['Time out', null, null, null, null, null, null, null], ['Patient initials', null, null, null, null, null, null, null]] },
    { t: 'note', html: 'My initials above certify that I received service on the date(s) and times as listed and the services documented below were provided to me.' },
    taskGrid('tar_tasks', 'record'),
    { t: 'note', html: '<b>Key:</b> √ = task completed · R = refused · S = performed by self · O = reported to supervisor' },
    { t: 'sig', f: [['tar_pt_sig', 'Patient signature'], ['tar_pt_date', 'Date', 'date']] },
  ],
}

const logRows = (n) => Array.from({ length: n }, () => [null, null, null])
export const aideNotesGroup = {
  t: 'group', title: 'Additional Comments — Visit Notes', items: [
    { t: 'title', text: 'Additional Comments from Home Health Aide Visit Notes' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['mr', 'MR #:', 'w3']] },
    { t: 'table', k: 'hha_comments', head: ['Date', 'Comments', 'Staff signature'], widths: ['14%', '', '24%'], rows: logRows(16), rowH: 24 },
  ],
}
export const allNotesGroup = {
  t: 'group', title: 'Additional Comments — All Disciplines', items: [
    { t: 'title', text: 'Additional Comments from All Disciplines Visit Notes' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['mr', 'MR #:', 'w3']] },
    { t: 'table', k: 'all_comments', head: ['Date', 'Comments', 'Staff signature'], widths: ['14%', '', '24%'], rows: logRows(16), rowH: 24 },
  ],
}
