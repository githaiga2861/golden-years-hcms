// Patient Admission Packet — every form in one printable document, fillable
// from the office app. Forms that share a field (patient name, MR #, DOB …)
// share a key, so it is typed once and printed everywhere.
import { renderItems } from './formkit.js'
import { coverPage } from './shell.js'
import { esc } from './brand.js'
import { rightsGroup, rightsEsGroup, consentGroup, consentCopyGroup } from './admission/rights.js'
import { formsChecklistGroup, physicianOrderGroup, faceToFaceGroup, hhccnGroup, hhccnCopyGroup } from './admission/orders.js'
import { aideCarePlanGroup, aideRecordGroup, aideNotesGroup, allNotesGroup } from './admission/aide.js'
import { dischargeGroup, coordinationGroup, surveyGroup, summary60Group, privacyGroup, referralGroup, directionsGroup, homeboundGroup } from './admission/other.js'
import { planOfCareGroup, complaintLogGroup } from './admission/planOfCare.js'
import { schema as assessmentSchema } from './forms/assessment.js'
import { schema as safetySchema } from './forms/homeSafety.js'
import { schema as nurseSchema } from './forms/nurseNote.js'

export const title = 'Patient Admission Packet'

export const GROUPS = [
  rightsGroup,
  rightsEsGroup,
  consentGroup,
  consentCopyGroup,
  { t: 'group', title: 'Home Care Assessment Form', items: assessmentSchema },
  { t: 'group', title: 'Home Safety Assessment', copies: ['Agency copy', 'Client copy'], items: safetySchema },
  formsChecklistGroup,
  physicianOrderGroup,
  faceToFaceGroup,
  hhccnGroup,
  hhccnCopyGroup,
  { t: 'group', title: "Skilled Nurse's Note", items: nurseSchema, dense: true },
  aideCarePlanGroup,
  aideRecordGroup,
  aideNotesGroup,
  allNotesGroup,
  dischargeGroup,
  coordinationGroup,
  surveyGroup,
  summary60Group,
  privacyGroup,
  referralGroup,
  directionsGroup,
  homeboundGroup,
  planOfCareGroup,
  complaintLogGroup,
]

// Schema used by the fill-in modal (copies are the same fields).
export const schema = GROUPS.filter((g) => !/(patient copy|\(spanish\))/i.test(g.title))

/** opts.pages: { g0: 3, … } page numbers for the table of contents. opts.only: index list to print a subset. */
export function render(data = {}, opts = {}) {
  const { logo, pages = {}, only } = opts
  const list = GROUPS.map((g, i) => ({ g, i })).filter(({ i }) => !only || only.includes(i))
  const numbered = Object.keys(pages).length > 0
  const toc = list.map(({ g, i }) => `<div class="te l2"><span class="tt">${esc(g.title)}</span>${numbered ? `<span class="dots"></span><span class="pg">${pages[`g${i}`] ?? ''}</span>` : ''}</div>`).join('')
  const cover = coverPage({ logo, kicker: 'Home Health Agency', title: 'Patient Admission Packet', subtitle: data.patient_name ? `Patient: ${data.patient_name}` : 'Washington' })
  const body = list.map(({ g, i }) => {
    const html = renderItems([g], data).replace('<section class="', `<section id="g${i}" class="`)
      .replace('<div class="doc-title">', `<div class="doc-title"><span class="pm">§g${i}§</span>`)
    return g.dense ? `<div class="dense">${html}</div>` : html
  }).join('\n')
  const tocPage = only ? '' : `<section class="toc"><h1>Contents</h1>${toc}</section>`
  return `${only ? '' : cover}${tocPage}${body}`
}
