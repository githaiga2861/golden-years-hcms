import { WORKSHEETS } from './forms/policyWorksheets.js'

// The documents on the Documentation page. `file` is the ready-made PDF in
// web/public/documents/ (built by documents-src/build.mjs); MODULES (modules.js)
// renders each one blank or filled. `section`: main | patient | agency.
export const DOCUMENTS = [
  { key: 'policy', section: 'main', title: 'Policy and Procedure Manual', short: 'Policy & Procedure Manual', file: 'policy-and-procedure-manual.pdf', client: true, fillLabel: 'Fill full form',
    blurb: 'The complete WAC 246-335 policy and procedure manual — job descriptions, emergency plans, checklists and the patient bill of rights. Filling it completes every blank in the manual, including its worksheets.' },
  { key: 'admission', section: 'patient', title: 'Patient Admission Packet', short: 'Patient Admission Packet', file: 'patient-admission-packet.pdf', client: true,
    blurb: 'Patient rights (English & Spanish), consent, assessments, physician orders, nursing and aide care plans, discharge and every other admission form.' },
  { key: 'assessment', section: 'patient', title: 'Home Care Assessment Form', short: 'Home Care Assessment', file: 'home-care-assessment-form.pdf', client: true,
    blurb: 'Client information, physical and mental health, social environment, ADLs and IADLs.' },
  { key: 'safety', section: 'patient', title: 'Home Safety Assessment', short: 'Home Safety Assessment', file: 'home-safety-assessment.pdf', client: true,
    blurb: 'Environment, fire/electrical, bathroom and medication safety checklist with attestation.' },
  { key: 'nurse', section: 'patient', title: "Skilled Nurse's Note", short: "Skilled Nurse's Note", file: 'skilled-nurse-note.pdf', client: true,
    blurb: 'Visit note: vitals, body-system assessment, interventions, pain, phlebotomy, wounds and IV nursing.' },
  { key: 'management', section: 'agency', title: 'Management and Supervision of Services', short: 'Management & Supervision Plan', file: 'management-and-supervision-plan.pdf', client: false,
    blurb: 'How the agency manages and supervises services throughout all requested service areas — WAC 246-335-515(6).' },
  ...WORKSHEETS.map((w) => ({
    key: `ws_${w.key}`, section: w.client ? 'patient' : 'agency', fromManual: true, title: w.title, short: w.title,
    file: w.pdf, client: w.client, blurb: w.blurb,
  })),
]

export const docByKey = (k) => DOCUMENTS.find((d) => d.key === k)
