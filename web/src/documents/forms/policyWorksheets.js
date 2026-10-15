// The fill-in worksheets inside the Policy & Procedure Manual, as one
// printable set: annual review log, patient emergency/disaster information,
// risk analysis, preparedness plan evaluation, business recovery checklist
// and hazard vulnerability assessment.
import { AGENCY } from '../brand.js'
import { renderItems } from '../formkit.js'

export const title = 'Policy Manual Worksheets'

const RISKS = [
  { title: 'A. Natural disasters', items: ['Flood', 'Hurricane', 'Tornado', 'Extreme heat', 'Winter storms', 'Fires – internal', 'Wildfires', 'Other – hail, high wind, etc.'] },
  { title: 'B. Technological hazards', items: ['Widespread power outages', 'Hazardous materials incidents', 'Nuclear power plants'] },
  { title: 'C. Epidemic', items: ['Epidemic / pandemic'] },
  { title: 'D. Terrorism', items: ['Foreign', 'Domestic'] },
]

const PLAN_EVAL = [
  { title: 'Initial preparation', items: ['Plan has been reviewed within the last 12 months.', 'All employees and their alternates responsible for executing work-around for a mechanized process have been identified in the Agency Business Recovery Plan (ABRP) and properly trained.', 'All employees responsible for the execution of the ABRP have received ongoing training in Disaster Recovery and Emergency Management.', 'The ABRP has been approved by the owner(s) and/or Administrator, and Governing Body.', 'The physical and logical security at the alternate site is at least as stringent as the security at the disaster location.'] },
  { title: 'Preparedness — administrative responsibilities and communication', items: ['Administrative responsibilities assigned.', 'Current list of staff with all applicable contact members in place.', 'Disaster calling tree for patient emergencies in place and up-to-date.', 'Administrative call in place and effective.', 'Backup communication plan for staff and patients sufficient.'] },
  { title: 'Patient triage', items: ['Triage list current and correct.'] },
  { title: 'Secure office building', items: ['Fire extinguishers and smoke detectors in place and working properly.', 'Exits marked accurately and clearly for emergency routes.', 'Mail safety measures maintained.', 'Essential equipment for keeping the agency open identified.', 'Knowledge of repair or replace damaged equipment demonstrated.', 'Extra supplies stored as planned.', 'Knowledge of shutdown of heating/air condition system demonstrated.', 'All aspects of physical and logical security at the alternate site conform to current regulatory security procedures.'] },
  { title: 'Information technology system', items: ['Antivirus software and firewall in place.', 'Computer data backed up daily.'] },
]

const ABRP = [
  { title: 'Level I — executive awareness / authority', items: ['ABRP has been developed.', 'ABRP has been updated within the last 6 months.'] },
  { title: 'Level II — plan development and documentation', items: ['A classification (level of risk — low, moderate, high) has been assigned to the business process/function/component that this agency supports.', 'ABRP has been documented.', 'ABRP has been maintained.'] },
  { title: 'ABRP includes the following sections', items: ['Identification', 'Incident management — responsible agency officer', 'Incident management — personnel responsible for updates', 'Response', 'Recovery', 'Restoration', 'Plan exercise', 'Plan maintenance', 'Business recovery personnel/teams and contact information', 'ABRP identifies necessary support equipment (documentation/forms, equipment, spare parts, etc.) to recover the agency and/or functions', 'ABRP has an alternative site for recovery'] },
  { title: 'Data, exercises and copies', items: ['All critical or important data required to support the agency is being backed up', 'Critical/important data is being stored in a protected location off-site', 'Agency conducts a walk-through exercise of the plan at least annually', 'The walk-through exercise has a prepared plan that includes a description, scope and objective', 'A current copy of the ABRP is maintained off-site', 'All users of the ABRP have ready access to a current copy at all times', 'There is an audit trail of the changes made to the ABRP'] },
]

const HVA_EVENTS = ['Ice / snow', 'Flooding', 'Earthquake', 'Hurricane', 'Hazardous material accident', 'Fire', 'Tornado', 'Volcano', 'Civil disturbance', 'Mass casualty event', 'Terrorist attacks', 'Pandemic / infectious disease', 'Electrical failure', 'Communications failure', 'Information system failure', 'Water failure', 'Transportation interruption', 'Environmental / altered air quality pollution']
const R3 = (h) => [{ h: `${h} (3)`, style: 'text-align:center' }, { h: 'Mod. (2)', style: 'text-align:center' }, { h: `${h === 'High' ? 'Low' : 'High'} (1)`, style: 'text-align:center' }]

export const schema = [
  { t: 'group', title: 'Review of Policy Manuals', newPage: false, items: [
    { t: 'title', text: 'Review of Policy Manuals', sub: 'All policy manuals are reviewed on a yearly basis.' },
    { t: 'table', k: 'rv', head: ['Reviewed by', 'Title', 'Date', 'Signature'], rows: Array.from({ length: 10 }, () => [null, null, null, null]), rowH: 22 },
  ] },
  { t: 'group', title: 'Emergency/Disaster Information — Home Health Patients', items: [
    { t: 'title', text: 'Emergency/Disaster Information', sub: 'Home health patients — keep this plan where it can easily be located' },
    { t: 'p', html: `This information is provided to you as a quick reference in case any emergency occurs. Keep this document where it can easily be found and tell people close to you (relative, neighbor, etc.) where it is. <b>${AGENCY.legal}</b> has a nurse on call 24 hours a day at <b>${AGENCY.phone}</b>; after office hours and on weekends an answering service will reach the nurse. <b>In a serious medical emergency, call 911</b> — the agency is not an emergency service.` },
    { t: 'row', f: [['patient_name', 'Name:'], ['ed_date', 'Date:', 'w2', 'date']] },
    { t: 'row', f: [['allergies', 'Allergies:'], ['ed_edp', 'EDP classification:', 'w3']] },
    { t: 'sh2', text: 'In case of medical emergency dial 911 — the dispatcher will need to know' },
    { t: 'row', f: [['ed_caller', 'Your name:'], ['phone', 'Your telephone number:', 'w3']] },
    { t: 'row', f: [['address', 'Your address:']] },
    { t: 'cols', cols: [[{ t: 'box', k: 'ed_meds', label: 'List of my current medications', h: 90 }], [{ t: 'box', k: 'ed_dme', label: 'List of my supplies / DME', h: 90 }]] },
    { t: 'sh2', text: 'Emergency contact — in case of emergency please notify' },
    { t: 'row', f: [['emergency_name', 'Name:'], ['emergency_phone', 'Phone:', 'w3']] },
    { t: 'row', f: [['ed_contact_rel', 'Relationship:']] },
    { t: 'p', html: '<b>Disaster plan code:</b> Level 1 – 1: must be seen and/or evacuated ASAP.' },
    { t: 'checks', k: 'ed_plan', label: 'My emergency plan — I will:', cols: 2, opts: ['Stay home', 'Stay with family or friend: {{ed_stay_with|Family/friend name and phone|1.6in}}', 'Evacuate to a shelter: {{ed_shelter|Shelter name and address|1.6in}}', 'Shelter type — Standard', 'Shelter type — Special Needs Registry', 'Shelter type — MMF', 'Evacuate to hospital'] },
    { t: 'box', k: 'ed_continuity', label: 'Describe how services will continue in the event of an emergency:', h: 50 },
    { t: 'table', k: 'ed_providers', head: ['', 'Physician', 'Pharmacy'], widths: ['22%'], rows: [['Name', null, null], ['Telephone number', null, null], ['Address', null, null]] },
  ] },
  { t: 'group', title: 'Analysis of Risk Assessment for Potential Disasters', items: [
    { t: 'title', text: 'Analysis of Risk Assessment for Potential Disasters' },
    { t: 'ynTable', k: 'risk', opts: ['None', 'Low', 'Moderate', 'High'], numLabel: '#', descLabel: 'Potential disaster — risk level', sections: RISKS },
    { t: 'sig', f: [['risk_by', 'Completed by'], ['risk_date', 'Date', 'date']] },
  ] },
  { t: 'group', title: 'Agency Emergency Preparedness Plan Evaluation', items: [
    { t: 'title', text: 'Agency Emergency Preparedness Plan Evaluation' },
    { t: 'ynTable', k: 'pe', opts: ['Yes', 'No', 'N/A'], numLabel: '#', descLabel: 'Emergency preparedness plan tasks evaluated', sections: PLAN_EVAL },
    { t: 'lines', k: 'pe_notes', label: 'Findings / corrective action:', n: 3 },
    { t: 'sig', f: [['pe_by', 'Evaluated by'], ['pe_date', 'Date', 'date']] },
  ] },
  { t: 'group', title: 'Checklist for Agency Business Recovery Plan', items: [
    { t: 'title', text: 'Checklist for Agency Business Recovery Plan', sub: 'Continuity of operations' },
    { t: 'ynTable', k: 'abrp', opts: ['Yes', 'No', 'N/A'], numLabel: '#', descLabel: 'Agency Business Recovery Plan (ABRP)', sections: ABRP },
    { t: 'sig', f: [['abrp_by', 'Reviewed by'], ['abrp_date', 'Date', 'date']] },
  ] },
  { t: 'group', title: 'Hazard Vulnerability Assessment', items: [
    { t: 'title', text: 'Hazard Vulnerability Assessment', sub: 'Tick one box in each group. Score = probability × vulnerability × preparedness (highest possible 27).' },
    { t: 'html', html: `<div class="row"><div class="fld"><span class="lb">Agency:</span><span class="vl">${AGENCY.legal}</span></div></div>` },
    { t: 'row', f: [['hva_date', 'Date:', 'w2', 'date']] },
    { t: 'table', k: 'hva', cls: 'hva',
      head: [{ h: 'Event', rows: 2 }, { h: 'Probability', span: 3, style: 'text-align:center' }, { h: 'Vulnerability / disruption', span: 3, style: 'text-align:center' }, { h: 'Preparedness', span: 3, style: 'text-align:center' }, { h: 'Score', rows: 2, style: 'text-align:center' }],
      head2: [...R3('High'), ...R3('High'), { h: 'Low (3)', style: 'text-align:center' }, { h: 'Mod. (2)', style: 'text-align:center' }, { h: 'High (1)', style: 'text-align:center' }],
      rows: HVA_EVENTS.map((e) => [e, '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', null]) },
    { t: 'sig', f: [['hva_by', 'Completed by'], ['hva_title', 'Title', 'date']] },
  ] },
]

export const render = (data = {}) => renderItems(schema, data)
