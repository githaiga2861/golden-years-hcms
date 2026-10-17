import { AGENCY, ADDRESS_LINE } from '../brand.js'

const agencyRow = `<table class="form"><tr><th style="width:20%">Agency name</th><td>${AGENCY.legal}</td><th style="width:16%">Agency phone</th><td>${AGENCY.phone}</td></tr></table>`

export const dischargeGroup = {
  t: 'group', title: 'Discharge Summary', items: [
    { t: 'title', text: 'Discharge Summary' },
    { t: 'row', f: [['physician_name', 'Physician:'], ['physician_fax', 'Fax number:', 'w3']] },
    { t: 'html', html: agencyRow },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['ds_ssn', 'Patient SSN:', 'w3']] },
    { t: 'row', f: [['soc_date', 'Admission date:', '', 'date'], ['ds_date', 'Date of discharge:', '', 'date']] },
    { t: 'row', f: [['dx_primary', 'Primary diagnosis:']] },
    { t: 'row', f: [['dx_secondary', 'Secondary diagnosis(es):']] },
    { t: 'row', f: [['ds_services', 'Services provided:']] },
    { t: 'lines', k: 'ds_met', label: 'Met goals (specify):', n: 2 },
    { t: 'lines', k: 'ds_unmet', label: 'Unmet goals (specify and why not met):', n: 2 },
    { t: 'sh', text: 'Status at Discharge' },
    { t: 'row', f: [['ds_mental', 'Mental status:'], ['ds_activity', 'Activity level:']] },
    { t: 'row', f: [['ds_support', 'Support system:'], ['ds_support_rel', 'Relationship:']] },
    { t: 'row', f: [['ds_resources', 'Community resources:']] },
    { t: 'row', f: [['ds_equipment', 'Adaptation / equipment:']] },
    { t: 'row', f: [['ds_diet', 'Diet & appetite:'], ['ds_ad', 'Advance directives:']] },
    { t: 'row', f: [['ds_reason', 'Reason for discharge:']] },
    { t: 'lines', k: 'ds_additional', label: 'Additional discharge information:', n: 2 },
    { t: 'p', cls: 'center', html: '<i>Thank you for allowing us to assist you in the care of your patient. Please call us if we may be of further assistance.</i>' },
    { t: 'sig', f: [['ds_staff_sig', 'Agency staff signature'], ['ds_staff_title', 'Title', 'date'], ['ds_staff_date', 'Date', 'date']] },
  ],
}

export const coordinationGroup = {
  t: 'group', title: 'Coordination of Care', items: [
    { t: 'title', text: 'Coordination of Care' },
    { t: 'html', html: agencyRow },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['dob', 'DOB:', 'w2', 'date']] },
    { t: 'p', html: "Contact each member of the patient's health care team and discuss the plan of care." },
    { t: 'table', k: 'cc_contacts', head: ['Contact', 'Y / N', 'Comments / concerns'], widths: ['22%', '10%'], rows: ['RN', 'OT', 'PT', 'ST', 'Social Worker', 'Dietician'].map((r) => [r, null, null]), rowH: 22 },
    { t: 'box', k: 'cc_narrative', label: 'Narrative:', h: 170 },
    { t: 'sig', f: [['cc_sig', 'Signature and title'], ['cc_date', 'Date', 'date']] },
  ],
}

const SURVEY = [
  'Were you notified that you were to receive an initial home visit in a timely manner?',
  'Did your admitting professional give you the telephone number and contact person at the agency in case you had any questions or concerns, including after-hours information?',
  'Did you participate in your plan of care?',
  'Did you receive information on your Bill of Rights, including the State Hotline number to call if you have any complaints?',
  'Did the agency admitting nurse present a professional appearance?',
  'Did the nurse wear a name tag and introduce himself/herself as a representative of the agency and explain his/her role?',
  'Did the nurse leave a folder with information about your care in your home?',
  'Do you understand the services that your doctor ordered?',
  'Did the staff tell you the date of your next visit and the frequency of visits?',
  'Did the nurse take your temperature, pulse, respirations and blood pressure?',
  'Did the nurse wash his/her hands before and after caring for you?',
  'Did the nurse teach/talk to you about your medications?',
  'Did the nurse teach/talk to you about signs and symptoms to report to the doctor?',
  'Did the nurse teach/talk to you about your diet?',
  'Did the nurse teach/talk to you about wound care (if applicable)?',
  'Did the nurse teach/talk to you about plans for discharge (if applicable)?',
  'Did you feel the nurse answered your questions appropriately?',
]

export const surveyGroup = {
  t: 'group', title: 'Post Admission Patient Satisfaction Survey', items: [
    { t: 'title', text: 'Post Admission Patient Satisfaction Survey' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['sv_date', 'Date:', 'w2', 'date']] },
    { t: 'p', html: 'We are privileged to participate in your care. We are interested in rendering quality care to our patients and would appreciate your input by answering the following questions. Your evaluation will allow us to be more responsive to future patient/family needs. Feel free to use the back of the form to expand on anything.' },
    { t: 'ynTable', k: 'sv', opts: ['Yes', 'No', 'N/A'], numLabel: '#', descLabel: 'Question', sections: [{ items: SURVEY }] },
    { t: 'lines', k: 'sv_comments', label: 'Comments:', n: 2 },
    { t: 'p', cls: 'center', html: '<i>Thank you for taking the time to complete the survey.</i>' },
  ],
}

const DISC = ['Nursing', 'Home Health Aide', 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Social Worker']
export const summary60Group = {
  t: 'group', title: '60 Day Summary Report', items: [
    { t: 'title', text: '60 Day Summary Report' },
    { t: 'html', html: agencyRow },
    { t: 'row', f: [['s60_date', 'Date:', 'w2', 'date']] },
    { t: 'checks', k: 's60_disciplines', label: 'Disciplines present', opts: ['RN', 'LPN', 'PT', 'OT', 'ST', 'SW', 'HHA', 'Other: {{s60_disc_other|Other discipline|0.8in}}'] },
    { t: 'sh2', text: 'Patient data' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['mr', 'MR #:', 'w3']] },
    { t: 'row', f: [['soc_date', 'Start of care date:', '', 'date'], ['s60_cert', 'Cert dates:']] },
    { t: 'row', f: [['s60_dx', 'Diagnosis for current home care services:']] },
    { t: 'yn', k: 's60_homebound', label: 'Homebound:' },
    { t: 'sh2', text: 'Services provided / to be provided' },
    { t: 'table', k: 's60_services', head: ['Discipline', 'Visit freq.', 'Problems needing intervention / plans', 'Goals met/set? (Y N P NA)', 'Disp.*'], widths: ['17%', '9%', '', '14%', '8%'], rows: DISC.map((d) => [{ s: `<b>${d}</b>` }, null, null, null, null]), rowH: 52 },
    { t: 'note', html: 'Goals — Y = Yes, N = No, P = Partial, NA = Not applicable · *Disposition — D = Discharged, S = Still open' },
    { t: 'sh2', text: 'Recommendations' },
    { t: 'row', f: [['s60_dc_reason', 'Discharge reason:'], ['s60_dc_status', 'Status at discharge:']] },
    { t: 'row', f: [['s60_dc_superv', 'DC under supervision of:']] },
    { t: 'yn', k: 's60_continued', label: 'Needs continued care:' },
    { t: 'sig', f: [['s60_sig', 'Signature'], ['s60_sig_date', 'Date', 'date']] },
    { t: 'note', html: '<b>Fax to MD when completed.</b>' },
  ],
}

export const privacyGroup = {
  t: 'group', title: 'Notice of Privacy Rights', items: [
    { t: 'title', text: 'Notice of Privacy Rights' },
    { t: 'p', cls: 'center', html: `Name of organization: <b>${AGENCY.legal}</b>` },
    { t: 'p', html: '<b>THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</b>' },
    { t: 'list', ordered: true, items: [
      "Below is a description, including at least one (1) example, of the types of uses and disclosures that the above organization is permitted to make for each of the following purposes: treatment, payment and health care operations.<br>Disclosures to other health care providers, including, for example, to patients' attending physicians. Submission of claims and supporting documentation including, for example, to organizations responsible to pay for services provided by the organization. Disclosures to conduct the operations of the organization, including, for example, sharing information with supervisors of staff members who provide care to patients.",
      "Below is a description of each of the other purposes for which the organization is permitted or required to use or disclose protected health information without an individual's written consent or authorization.<br>To patients, incident to another permitted use or disclosure, by agreement, to the Secretary of the U.S. Department of Health and Human Services, as required by law, for public health activities, information about victims of abuse, neglect or domestic violence, health oversight activities, for judicial and administrative proceedings, for law enforcement proceedings, about decedents, for cadaveric organ, eye or tissue donation, for research purposes, to avert a serious threat to health or safety, for specific government functions, to business associates of the organization, to personal representatives, de-identified information, to workforce members who are victims of crimes, to workers' compensation programs, for involvement in the individual's care and for notification purposes, with the individual present, for limited uses and disclosures when the individual is not present, and for disaster relief purposes.",
      "Other uses and disclosures, such as disclosure of psychotherapy notes, use of protected health information for marketing activities and the sale of protected health information, will be made only with the individual's written authorization and the individual may revoke such authorization.",
      'The organization may contact the individual to schedule visits and for other coordination of care activities.',
      'The individual has the right to request further restrictions on certain uses and disclosures of protected health information, but the organization is not required to agree to any requested restriction(s), except disclosures must be restricted to health plans if the disclosure is for the purpose of carrying out payment or health care operations and is not otherwise required by law and the protected health information pertains solely to a health care item or service for which the individual or person other than the health plan on behalf of the individual has paid the organization in full.',
      'The individual has the right to receive confidential communications of protected health information, the right to inspect and copy protected health information, the right to amend protected health information, the right to receive an accounting of disclosures of protected health information and the right to obtain a paper copy of this Notice from the organization upon request.',
      'The organization is required by law to maintain the privacy of protected health information and to provide individuals with notice of its legal duties and privacy practices with respect to protected health information and to notify affected individuals following a breach of unsecured protected health information.',
      'The organization is required to abide by the terms of this Notice currently in effect.',
      'The organization reserves the right to change the terms of its Notice and to make the new notice provisions effective for all protected health information that it maintains. Individuals may obtain a revised copy of this Notice upon request.',
      `Individuals may complain to the organization and to the Secretary of the U.S. Department of Health and Human Services if they believe their privacy rights have been violated. Complaints should be directed to {{privacy_officer|Privacy officer|1.4in}} at the organization at the following telephone number: ${AGENCY.phone}. Individuals will not be retaliated against for filing a complaint.`,
      `For further information, individuals should contact {{privacy_officer|Privacy officer|1.4in}} at the organization at the following telephone number: ${AGENCY.phone}.`,
      'This Notice is in effect as of {{privacy_effective|Notice effective date|1.3in}}.',
      'My signature below is an acknowledgement that I have received a copy of this notice.',
    ] },
    { t: 'sig', f: [['np_sig', 'Patient'], ['np_date', 'Date', 'date']] },
    { t: 'lines', k: 'np_good_faith', label: "Documentation of good faith efforts to obtain the patient's signature if unable to obtain:", n: 2 },
  ],
}

export const referralGroup = {
  t: 'group', title: 'Physician Referral Orders (skilled)', items: [
    { t: 'title', text: 'Physician Referral Orders (skilled)' },
    { t: 'html', html: `<table class="form"><tr><th style="width:20%">Agency name</th><td>${AGENCY.legal}</td><th style="width:16%">Agency phone</th><td>${AGENCY.phone}</td></tr><tr><th>Agency address</th><td colspan="3">${ADDRESS_LINE}</td></tr></table>` },
    { t: 'row', f: [['patient_name', "Patient's name:"], ['mr', 'Record #:', 'w2']] },
    { t: 'row', f: [['address', 'Address:'], ['city', 'City:', 'w2'], ['state', 'ST:', 'w1'], ['zip', 'ZIP:', 'w1']] },
    { t: 'row', f: [['phone', 'Home phone:'], ['cell', 'Cell phone:'], ['dob', 'DOB:', 'w2', 'date']] },
    { t: 'sh', text: 'Telephone / additional or change of orders on your patient' },
    { t: 'row', f: [['ro_date', 'Date:', '', 'date'], ['ro_time', 'Time:', 'w3']] },
    { t: 'lines', k: 'ro_problem', label: 'Patient problem / diagnosis:', n: 2 },
    { t: 'sh2', text: 'Intervention / order' },
    { t: 'checks', k: 'ro_order', cols: 1, single: true, opts: [
      '<b>Admit</b> patient to {{ro_admit_to|Admit to (agency)|1.4in}} for home health care services from {{ro_admit_from|Admit from (date)|0.9in}} through {{ro_admit_thru|Admit through (date)|0.9in}}. SN to assess, evaluate, and instruct patient on disease process, knowledge deficit of medication, safety and diet. Frequency: {{ro_admit_freq|Admission frequency|2in}}',
      '<b>Recertify</b> patient to {{ro_recert_to|Recertify to (agency)|1.4in}} for health care services for a period of 60 days, from {{ro_recert_from|Recert from (date)|0.9in}} through {{ro_recert_thru|Recert through (date)|0.9in}}. SN to monitor, re-evaluate &amp; manage patient\'s medical regimen. Frequency: {{ro_recert_freq|Recert frequency|2in}}',
      '<b>Discharge</b> patient from home health services (reason below).',
    ] },
    { t: 'checks', k: 'ro_dc_reason', label: 'Discharge reason', cols: 2, opts: ['Patient / physician request', 'Patient moved to healthcare facility', 'Patient moved from service area', 'Patient is non-compliant', 'All goals have been met', 'Patient opted for HMO'] },
    { t: 'p', html: '<b>Goals:</b> To meet the patient\'s medical needs.' },
    { t: 'yn', k: 'ro_informed', label: 'Patient informed:' },
    { t: 'sig', f: [['ro_nurse_sig', "Nurse's signature"], ['ro_nurse_date', 'Date', 'date'], ['ro_nurse_time', 'Time', 'date']] },
    { t: 'sig', f: [['ro_md_sig', "Physician's signature"], ['ro_md_date', 'Date', 'date'], ['ro_md_time', 'Time', 'date']] },
    { t: 'note', html: '<b>** Doctor, please sign this form immediately and return it. Thank you. **</b>' },
  ],
}

export const directionsGroup = {
  t: 'group', title: "Directions to Patient's Home (skilled)", items: [
    { t: 'title', text: "Directions to Patient's Home from Office (skilled)" },
    { t: 'html', html: `<p><b>Agency:</b> ${AGENCY.legal} · <b>Office:</b> ${ADDRESS_LINE}</p>` },
    { t: 'row', f: [['patient_name', "Patient's name:"], ['phone', "Patient's phone:", 'w3']] },
    { t: 'lines', k: 'dir_directions', label: 'Directions (see attached map):', n: 9 },
    { t: 'checks', k: 'dir_door', label: 'Which door to use', opts: ['Front', 'Side', 'Back'], single: true },
    { t: 'yn', k: 'dir_pets', label: 'Pets at home?' },
    { t: 'lines', k: 'dir_comments', label: 'Special comments (area, precautions, etc.):', n: 4 },
    { t: 'row', f: [['dir_completed_by', 'Person completing this form:']] },
  ],
}

export const homeboundGroup = {
  t: 'group', title: 'Homebound Determination Questionnaire (skilled)', items: [
    { t: 'title', text: 'Homebound Determination Questionnaire (skilled)' },
    { t: 'row', f: [['patient_name', 'Patient name:'], ['mr', 'MR #:', 'w3']] },
    { t: 'p', html: 'The Agency must assess and address the following homebound criteria to determine if the patient is homebound:' },
    { t: 'ynTable', k: 'hb', opts: ['Yes', 'No', 'N/A'], numLabel: '#', descLabel: 'Question', sections: [{ items: [
      'Does the patient exhibit a normal inability to leave home?',
      'Does the patient exhibit a considerable and taxing effort to leave home?',
      'If absences do occur, are the absences infrequent or of relatively short duration?',
      'If absences do occur, are the absences attributable to the need to receive health care treatment or to receive therapeutic, psychosocial, or medical treatment in an adult day care center?',
      'Does the patient require use of an assistive device? If so, list: {{hb_device|Assistive device|1.6in}}',
    ] }] },
    { t: 'p', html: "<b>Ask the patient the following questions at the start of care and as needed. Document the patient's responses.</b>" },
    { t: 'lines', k: 'hb_q1', label: '1. How do you obtain your medicine, food, and medical care?', n: 1 },
    { t: 'lines', k: 'hb_q2', label: '2. How often and for how long do you leave home for non-medical purposes?', n: 1 },
    { t: 'lines', k: 'hb_q3', label: '3. For what non-medical reasons do you leave home?', n: 1 },
    { t: 'lines', k: 'hb_q4', label: '4. If you go to an adult day-care center, what therapeutic, psychosocial, or medical treatment services are provided at the adult day-care center?', n: 1 },
    { t: 'p', html: '<i>Based on the patient responses, <u>this patient has been determined to be homebound</u>. The patient has been given an explanation and by signing this form understands the definition of homebound and agrees to comply with the homebound requirement. The patient understands and agrees that once his/her condition changes and he/she is able to leave the home more often for longer periods of time for non-medical purposes or begins to drive, he/she will contact the Agency immediately. Failure to comply with homebound requirements may result in patient liability for payment of services as allowed by the law.</i>' },
    { t: 'sig', f: [['hb_pt_sig', "Patient's signature"], ['hb_pt_date', 'Date', 'date']] },
    { t: 'sig', f: [['hb_rep_sig', 'Agency representative'], ['hb_rep_date', 'Date', 'date']] },
    { t: 'note', html: '<b>If the patient does not meet homebound criteria, call the Agency office immediately for further instructions.</b>' },
  ],
}
