// The documents listed on the Documentation page. `file` is the ready-made
// PDF in web/public/documents/ (built by documents-src/build.mjs).
// `module` renders the document (blank or filled) from web/src/documents/.
export const DOCUMENTS = [
  { key: 'admission', title: 'Patient Admission Packet', short: 'Patient Admission Packet', module: 'admission', file: 'patient-admission-packet.pdf', fillable: true,
    blurb: 'Patient rights (English & Spanish), consent, assessments, physician orders, nursing and aide care plans, discharge and every other admission form.' },
  { key: 'policy', title: 'Policy and Procedure Manual', short: 'Policy & Procedure Manual', file: 'policy-and-procedure-manual.pdf',
    blurb: 'The complete WAC 246-335 policy and procedure manual with job descriptions, emergency plans, checklists and the patient bill of rights.' },
  { key: 'assessment', title: 'Home Care Assessment Form', short: 'Home Care Assessment', module: 'forms/assessment', file: 'home-care-assessment-form.pdf',
    blurb: 'Client information, physical and mental health, social environment, ADLs and IADLs.' },
  { key: 'safety', title: 'Home Safety Assessment', short: 'Home Safety Assessment', module: 'forms/homeSafety', file: 'home-safety-assessment.pdf',
    blurb: 'Environment, fire/electrical, bathroom and medication safety checklist with attestation.' },
  { key: 'nurse', title: "Skilled Nurse's Note", short: "Skilled Nurse's Note", module: 'forms/nurseNote', file: 'skilled-nurse-note.pdf',
    blurb: 'Visit note: vitals, body-system assessment, interventions, pain, phlebotomy, wounds and IV nursing.' },
  { key: 'management', title: 'Management and Supervision of Services', short: 'Management & Supervision Plan', module: 'forms/management', file: 'management-and-supervision-plan.pdf',
    blurb: 'How the agency manages and supervises services throughout all requested service areas (WAC 246-335-515(6)).' },
]
