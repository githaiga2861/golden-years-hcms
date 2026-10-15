import { AGENCY, ADDRESS_LINE } from '../brand.js'

const agencyBlock = `<table class="form"><tr><th style="width:22%">Agency name</th><td>${AGENCY.legal}</td><th style="width:16%">Agency phone</th><td>${AGENCY.phone}</td></tr><tr><th>Agency address</th><td colspan="3">${ADDRESS_LINE}</td></tr></table>`

export const formsChecklistGroup = {
  t: 'group', title: 'Admission Forms Checklist', items: [
    { t: 'title', text: 'Admission Forms Checklist', sub: 'For the admitting professional — tick each form completed or left in the home' },
    { t: 'checks', k: 'fc_done', cols: 1, opts: [
      "<b>Physician's Supplemental / Telephone / Verbal Order</b> — leave in home in case of notifying MD from home; any new orders received must be faxed to MD for signature.",
      '<b>Home Health Face-to-Face Encounter</b> — fax to MD for signature. Patients must have a face-to-face encounter with the MD no more than 90 days before or 30 days after home health care services begin. MD must include a detailed description of home health service needs and diagnosis(es).',
      '<b>Home Health Change of Care Notice (HHCCN)</b> — use if there is a change in care/services. Leave one copy in the home and take one copy to the office.',
      "<b>Skilled Nurse's Note</b> — complete for any follow-up visits after admission.",
      '<b>Home Health Aide Care Plan</b> — complete if the patient is to have HHA services. Patient receives one copy and one copy goes to the office.',
      '<b>Home Health Aide Time and Activity Record / Visit Notes</b> — leave in home if the patient receives HHA services and the HHA care plan was completed.',
      '<b>Discharge Summary</b> — complete after the last visit, then fax to MD; keep a copy in the office chart with the fax confirmation sheet.',
      '<b>Post Admission Patient Satisfaction Survey</b> — put in home chart and remind the patient to complete it after the last visit.',
      '<b>Coordination of Care progress note</b> — complete and fax to MD; keep a copy in the office chart with the fax confirmation sheet.',
      '<b>60 Day Summary Report</b> — complete at the 60-day case conference and fax to MD; keep a copy in the office chart with the fax confirmation sheet.',
      "<b>Front chart stickers</b> — must be placed on the front of the patient's chart.",
    ] },
    { t: 'row', f: [['fc_admitter', "Admitting professional's name (printed):"], ['fc_admitter_title', 'Title:', 'w3']] },
    { t: 'sig', f: [['fc_admitter_sig', "Admitting professional's signature & title"], ['fc_admitter_date', 'Date', 'date']] },
  ],
}

export const physicianOrderGroup = {
  t: 'group', title: "Physician's Supplemental / Verbal / Telephone Order", items: [
    { t: 'title', text: "Physician's Supplemental Order / Verbal / Telephone Order" },
    { t: 'html', html: agencyBlock },
    { t: 'row', f: [['patient_name', "Patient's name:"], ['mr', 'Record #:', 'w2']] },
    { t: 'row', f: [['address', 'Address:'], ['city', 'City:', 'w2'], ['state', 'ST:', 'w1'], ['zip', 'ZIP:', 'w1']] },
    { t: 'row', f: [['phone', 'Home phone:'], ['cell', 'Cell phone:'], ['dob', 'DOB:', 'w2', 'date']] },
    { t: 'row', f: [['dx_primary', 'Primary diagnosis:'], ['dx_related', 'Related diagnosis:']] },
    { t: 'p', html: 'Skilled nursing: {{po_sn|Skilled nursing (Yes/No)|0.6in}} Frequency {{po_sn_freq|Skilled nursing frequency|1in}} · Other disciplines: type {{po_d1|Other discipline 1|1in}} frequency {{po_d1f|Discipline 1 frequency|0.9in}} · type {{po_d2|Other discipline 2|1in}} frequency {{po_d2f|Discipline 2 frequency|0.9in}}' },
    { t: 'row', f: [['physician_name', "Physician's name:"], ['physician_phone', 'Phone:', 'w3']] },
    { t: 'row', f: [['physician_address', 'Address:'], ['physician_fax', 'Fax:', 'w3']] },
    { t: 'box', k: 'po_order', label: "Physician's order", h: 150 },
    { t: 'row', f: [['po_taken_by', 'Signature and title of person taking order:']] },
    { t: 'row', f: [['po_date', 'Date order taken:', '', 'date'], ['po_time', 'Time order taken:', 'w3']] },
    { t: 'note', html: '<b>** Doctor, please sign this form immediately and return it. Thank you. **</b>' },
    { t: 'sig', f: [['po_md_sig', "Physician's signature"], ['po_md_date', 'Date', 'date']] },
  ],
}

export const faceToFaceGroup = {
  t: 'group', title: 'Home Health Face-to-Face Encounter', items: [
    { t: 'title', text: 'Home Health Face-to-Face Encounter' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['dob', 'DOB:', 'w2', 'date']] },
    { t: 'sh', text: 'Part I — To be filled out by agency' },
    { t: 'row', f: [['soc_date', 'Start of care date:', '', 'date'], ['ff_conducted_by', 'Face-to-face encounter conducted by:']] },
    { t: 'row', f: [['ff_institution', 'Institutional provider:'], ['ff_cert_md', 'Certifying physician name:']] },
    { t: 'sh', text: 'Part II — To be filled out by the physician who carried out the face-to-face encounter' },
    { t: 'p', html: 'I certify that this patient is under my care and that I, or a nurse practitioner / clinical nurse specialist / certified nurse-midwife or physician\'s assistant working in collaboration with me, had a face-to-face encounter that meets the physician face-to-face encounter requirements with this patient on {{ff_date|Encounter date|1.2in}}.' },
    { t: 'lines', k: 'ff_condition', label: 'The encounter with the patient was in whole, or part, for the following medical condition, which is the primary reason for home health care (list medical condition):', n: 3 },
    { t: 'checks', k: 'ff_services', label: 'I certify that, based on my findings, the following services are medically necessary home health services (check all that apply):', opts: ['Nursing', 'Therapy'] },
    { t: 'sig', f: [['ff_md_sig', 'Physician signature'], ['ff_md_date', 'Date', 'date']] },
    { t: 'row', f: [['ff_md_print', 'Printed name:']] },
  ],
}

const hhccnItems = (copy) => [
  { t: 'title', text: 'Home Health Change of Care Notice (HHCCN)' },
  { t: 'html', html: `<table class="form"><tr><th style="width:22%">Home health agency</th><td>${AGENCY.legal}</td><th style="width:18%">Patient name</th><td>{{patient_name|Patient name|1.6in}}</td></tr><tr><th>Address</th><td>${ADDRESS_LINE}</td><th>Patient identification</th><td>{{mr|Medical record #|1.2in}}</td></tr><tr><th>Phone</th><td>${AGENCY.phone}</td><td colspan="2"></td></tr></table>` },
  { t: 'p', html: '<b>Your home health care is going to change.</b> Starting on {{hc_start|Change effective date|1.2in}}, your home health agency will change the following items and/or services for the reasons listed below.' },
  { t: 'table', k: 'hc_items', head: ['Items / services', 'Reason for change'], rows: [[null, null], [null, null], [null, null]], rowH: 20 },
  { t: 'p', html: '<b>Read the information next to the checkbox below.</b> Your home health agency is giving you this information because:' },
  { t: 'checks', k: 'hc_reason', cols: 1, single: true, opts: [
    "<b>Your doctor's orders for your home care have changed.</b><br>The home health agency must follow physician orders to give you care. The home health agency can't give you home care without a physician's order. If you don't agree with this change, discuss it with your home health agency or the doctor who orders your home care.",
    '<b>Your home health agency has decided to stop giving you the home care listed above.</b><br>You can look for care from a different home health agency if you have a valid order for home care and still think you need home care. If you need help finding a different home health agency to give you this care, contact the doctor who ordered your home care.',
  ] },
  { t: 'p', html: '<b>If you have questions about these changes, you can contact your home health agency and/or the doctor who orders your home care.</b>' },
  { t: 'lines', k: 'hc_additional', label: 'Additional information:', n: 2 },
  { t: 'p', html: '<b>Please sign and date below</b> to show that you received and understand this notice. Return this signed notice to your home health agency in person or by mailing it to them at the address listed at the top of this notice.' },
  copy ? { t: 'note', html: '<b>Patient copy — no signature needed.</b>' } : { t: 'sig', f: [['hc_sig', 'Signature of the patient or of the authorized representative*'], ['hc_sig_date', 'Date', 'date']] },
  { t: 'note', html: '*If a representative signs for the beneficiary, write "(rep)" or "(representative)" next to the signature. If the representative\'s signature is not clearly legible, the representative\'s name must be printed.' },
]

export const hhccnGroup = { t: 'group', title: 'Home Health Change of Care Notice', items: hhccnItems(false) }
export const hhccnCopyGroup = { t: 'group', title: 'HHCCN (patient copy)', copies: ['Patient copy'], items: hhccnItems(true) }
