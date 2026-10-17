import { AGENCY, ADDRESS_LINE } from '../brand.js'
import { renderItems } from '../formkit.js'

// Description of how the agency provides management and supervision of
// services throughout all requested service areas — WAC 246-335-515(6).
// Wording follows the agency's own Policy & Procedure Manual (Management and
// Supervision; Supervision of Personnel, Volunteers and Contractors; Performance
// Evaluation; Quality Improvement Program; Supervision of Home Health Services).
export const title = 'Management and Supervision of Services'

const B = (h) => ({ t: 'list', items: h })

const F = (n) => `<sup class="fn">${n}</sup>`

export const COUNTIES = ['King County', 'Pierce County']

// Narrative statement for the surveyor — how the agency has managed and
// supervised services throughout all of its service areas (counties).
const statement = [
  { t: 'title', text: 'Management and Supervision of Services', sub: 'Statement of how the agency has provided management and supervision of services throughout all of its service areas' },
  { t: 'p', html: `${AGENCY.legal} (“Golden Years”) has provided management, leadership and ongoing supervision of services in every county it is licensed to serve, so that each patient receives safe, consistent, high-quality and person-centered care wherever they live.${F(1)} All services are directed from the agency office at ${ADDRESS_LINE}, and the same policies, forms, staffing standards and supervisory practices apply in every service area.` },
  { t: 'table', k: 'mg_areas', label: 'Service areas', head: ['Service area', 'Supervising clinician / manager responsible', 'Notes'], widths: ['24%', '42%'], rows: COUNTIES.map((c) => [{ s: `<b>${c}</b>` }, null, null]), rowH: 17 },
  { t: 'sh', text: 'Leadership and accountability' },
  { t: 'p', html: 'The Administrator, {{mg_admin_name|Administrator — name|1.7in}}, has held full authority for day-to-day operations, finances, contracts, staffing and compliance across all service areas, with a designated alternate available in the Administrator’s absence. The Director of Clinical Services, {{mg_docs_name|Director of Clinical Services — name|1.7in}}, a registered nurse licensed in Washington, has directed and supervised all patient care and has been available, directly or through the on-call nurse, whenever care is being provided.' },
  { t: 'sh', text: 'Supervision in every service area' },
  { t: 'list', items: [
    'Supervisory home visits have been scheduled and completed in each county on the required cycle — at least monthly for acute care and at least every six months for maintenance or aide-only care — by a licensed nurse or therapist, and documented in the patient record.' + F(2),
    'The office and the on-call nurse have been reachable 24 hours a day, 7 days a week, so caregivers in every county have had immediate access to clinical guidance after hours, on weekends and on holidays.',
    'Scheduling, electronic visit verification, visit notes and caregiver messaging run through the agency’s care management system, giving supervisors a real-time view of visits, missed or late visits and alerts from every service area.',
    'Back-up caregivers have been assigned when a scheduled caregiver was unavailable, so that visits continued without interruption in each county.',
  ] },
  { t: 'sh', text: 'Qualified and competent staff' },
  { t: 'p', html: `Golden Years has maintained qualified personnel through background checks, credential and license verification, orientation to agency policies and to each patient’s plan of care, competency checks before independent care, ongoing training, and written performance evaluations at least annually.${F(3)} Contracted services have been monitored against their written agreements and evaluated at least once a year.` },
  { t: 'sh', text: 'Care planning, coordination and documentation' },
  { t: 'p', html: `Each patient has received an in-home assessment and a written plan of care developed with the patient or representative and the authorizing practitioner, reviewed as the patient’s condition changed.${F(4)} Nurses have communicated changes in condition to physicians promptly, and visit documentation has been reviewed for accuracy, completeness and timeliness.${F(5)}` },
  { t: 'sh', text: 'Patient rights, safety and infection prevention' },
  { t: 'p', html: `Patients have been informed of their rights and responsibilities at admission, and concerns and complaints have been investigated and resolved promptly.${F(6)} Supervisors have overseen infection prevention and control practices, home safety assessments and incident reporting, and the agency’s emergency preparedness plan has covered patients and staff in every service area.${F(7)}` },
  { t: 'sh', text: 'Quality improvement' },
  { t: 'p', html: `One Quality Improvement Program has been applied across all service areas. Indicators such as timeliness of start of care, missed visits, incidents, complaints, patient satisfaction and record-review findings have been tracked and compared across counties, and the results have been used to strengthen policies, training and supervision.${F(8)}` },
  { t: 'p', cls: 'callout', html: 'Through these established management practices, ongoing supervision, open communication and continuous quality improvement, Golden Years has maintained an effective and accountable service delivery system that supports the health, safety, dignity and independence of every individual it serves — and remains committed to the highest standards of professionalism, regulatory compliance and excellence in patient care throughout all of its service areas.' },
  { t: 'sig', f: [['mg_sig_admin', 'Administrator signature'], ['mg_sig_admin_date', 'Date', 'date']] },
  { t: 'sig', f: [['mg_sig_docs', 'Director of Clinical Services signature'], ['mg_sig_docs_date', 'Date', 'date']] },
  { t: 'html', html: `<div class="fnotes"><div class="fnotes-h">Notes</div><ol>
<li>WAC 246-335-515(6) — plan of operation: management and supervision of services throughout all service areas.</li>
<li>WAC 246-335-545 — supervision of home health services.</li>
<li>WAC 246-335-525 and 246-335-530 — personnel, contractor and volunteer policies and records, including WAC 246-335-525(16)–(17) performance evaluations.</li>
<li>WAC 246-335-540 — home health plan of care.</li>
<li>WAC 246-335-550 — patient records.</li>
<li>WAC 246-335-535 — home health patient’s bill of rights.</li>
<li>WAC 246-335-525 and the agency’s Emergency Preparedness Disaster Plan (Plan of Operation, WAC 246-335-515).</li>
<li>WAC 246-335-555 — quality improvement program.</li>
</ol></div>` },
]

export const schema = [
  ...statement,
  { t: 'br' },
  { t: 'title', text: 'Management and Supervision — Supporting Detail', sub: 'Procedures behind the statement · WAC 246-335-515(6)' },
  { t: 'html', html: `<table class="form"><tr><th style="width:28%">Agency</th><td>${AGENCY.legal}</td></tr><tr><th>Office address</th><td>${ADDRESS_LINE}</td></tr><tr><th>Telephone / email</th><td>${AGENCY.phone} · ${AGENCY.email}</td></tr><tr><th>License category</th><td>In-Home Services Agency — Home Health</td></tr><tr><th>Service areas</th><td>{{mg_counties|Counties served|3in}}</td></tr><tr><th>Hours of operation</th><td>{{mg_hours|Hours of operation|3in}}</td></tr></table>` },
  { t: 'sh', text: '1. Management structure' },
  { t: 'p', html: 'The Governing Body appoints a full-time Administrator who has full authority for the management of agency operations. The Administrator designates in writing an alternate to act in the Administrator\'s absence. The Director of Clinical Services (DOCS), a registered nurse licensed in Washington, directs and supervises all home health services and must be available during all hours that patient care is being provided. All services in every service area are directed from the agency office at the address above.' },
  { t: 'table', k: 'mg_people', head: ['Role', 'Name', 'Credentials', 'Telephone'], widths: ['30%'], rows: [
    ['Administrator', null, null, null], ['Alternate Administrator', null, null, null], ['Director of Clinical Services', null, null, null], ['Alternate Director of Clinical Services', null, null, null],
  ], rowH: 18 },
  { t: 'p', html: 'The Administrator provides management and supervision of services throughout all approved service areas, including: overseeing the day-to-day operation and fiscal affairs of the agency; arranging for necessary services; keeping contracts current; serving as liaison between the licensee, personnel and contractors; ensuring personnel and contractors are currently credentialed by the State of Washington and comply with agency policies and procedures; implementing the quality improvement process; managing record keeping; ensuring supplies and equipment are available and in working order; ensuring the accuracy of public information materials; and ensuring current written policies and procedures are accessible to personnel and contractors during hours of operation.' },
  { t: 'sh', text: '2. Initial assessment and plan of care — WAC 246-335-515(6)(a)' },
  B([
    'Referrals are accepted at the agency office from any service area. A registered nurse (or therapist for therapy-only cases) completes the initial in-home assessment, and home health services are generally initiated within seven calendar days of receiving and accepting a valid referral.',
    'The assessment covers medical history, current health status, functional abilities, home safety, and the patient\'s and family\'s goals, using the agency\'s Home Care Assessment and Home Safety Assessment forms.',
    'A written plan of care is developed with input from the patient and/or representative and the authorizing practitioner, in accordance with WAC 246-335-540, and is reviewed and updated as the patient\'s condition changes.',
    'The same assessment tools, forms and timelines are used in every service area so that care is consistent wherever the patient lives.',
  ]),
  { t: 'sh', text: '3. Supervision of personnel and volunteers; monitoring of contractors — WAC 246-335-515(6)(b) and 246-335-545' },
  B([
    '<b>Qualified supervisors.</b> A qualified health care professional supervises all personnel and volunteers who provide direct care, according to the services provided (RN, LPN under RN direction, PT, OT, ST or other qualified professional).',
    '<b>Competency.</b> Supervisors ensure each staff member receives orientation and training on agency policies and on each patient\'s plan of care, demonstrates competency before providing independent care, and takes part in ongoing training.',
    '<b>Supervision methods.</b> Regular in-person or virtual meetings to discuss patient care; on-site visits to observe care delivery; review of visit documentation; and availability for consultation throughout service hours, including the on-call nurse after hours.',
    '<b>Acute care.</b> Supervision of home health aide services occurs at least once a month through on-site visits, with or without the aide present, by a licensed nurse or therapist.',
    '<b>Maintenance care / home health aide services only.</b> Supervision of home health aide services occurs at least every six months through on-site visits.',
    '<b>Documentation.</b> Each supervisory visit records the date, whether the aide was present, the supervisor\'s name and title, findings on compliance with the plan of care, and patient satisfaction.',
    '<b>Contractors.</b> Written contracts describe the services, qualifications and reporting requirements. The agency monitors contracted services through documentation review, patient feedback and site visits, and acts on any deficiencies.',
  ]),
  { t: 'sh', text: '4. Performance evaluations — WAC 246-335-515(6)(c) and 246-335-525(16)(17)' },
  B([
    'Personnel and volunteers receive a written performance evaluation at least annually, and more often for new staff, after a change in duties, or when concerns are identified.',
    'Evaluations cover adherence to agency policies and procedures, quality of care and documentation, competency in assigned tasks, communication, and the ability to meet job expectations.',
    'Services provided by contractors are evaluated at least annually against the contract terms, patient outcomes and agency standards; corrective action plans are put in place when needed.',
    'Evaluations are signed by the employee and supervisor and kept in the personnel or contractor file.',
  ]),
  { t: 'sh', text: '5. Quality improvement across service areas — WAC 246-335-515(6)(d) and 246-335-555' },
  B([
    'One Quality Improvement Program is applied consistently across all approved service areas, with key performance indicators and data collection methods adapted to the needs of each area.',
    'Indicators include timeliness of start of care, patient satisfaction, complaints, incidents, missed visits and record review findings, compared across service areas to identify where improvement is needed.',
    'Complaints are received, investigated and resolved, and the patient is notified of the resolution within 30 days. Findings are used to update policies, training and supervision.',
    'Staff from all service areas take part in quality improvement activities and receive the results.',
  ]),
  { t: 'sh', text: '6. Communication and coverage in every service area' },
  B([
    `The agency office (${AGENCY.phone}) and the on-call nurse are reachable 24 hours a day; an after-hours answering service reaches the nurse on call.`,
    'Scheduling, visit verification and caregiver messaging run through the agency\'s care management system, so supervisors see visits, notes and alerts from every service area in real time.',
    'Back-up staff are assigned when a scheduled caregiver is unavailable, following the Back-Up Care Policy.',
  ]),
  { t: 'sh2', text: 'Additional notes' },
  { t: 'lines', k: 'mg_notes', n: 3 },
]

export const defaults = { mg_admin_name: 'Eric Njoroge', mg_docs_name: 'Rose Mbote', 'mg_people.0.1': 'Eric Njoroge', 'mg_people.2.1': 'Rose Mbote', mg_counties: 'King and Pierce Counties, Washington', mg_hours: '9:00 am – 5:00 pm, Monday – Friday; on-call nurse 24 hours a day' }

export const render = (data = {}) => renderItems(schema, { ...defaults, ...data })
