import { AGENCY, ADDRESS_LINE } from '../brand.js'
import { renderItems } from '../formkit.js'

const area = (k, name, desc) => ({ t: 'lines', k, label: `<b>${name}:</b> <span style="font-weight:400">${desc}</span>`, n: 2 })

export const title = 'Home Care Assessment Form'

export const schema = [
  { t: 'title', text: 'Home Care Assessment Form' },
  { t: 'sh', text: 'Client Information' },
  { t: 'row', f: [['patient_name', 'Client Name:'], ['dob', 'Date of Birth:', 'w3', 'date']] },
  { t: 'row', f: [['address', 'Address:'], ['phone', 'Phone Number:', 'w3']] },
  { t: 'row', f: [['emergency_name', 'Emergency Contact Name:'], ['emergency_phone', 'Emergency Contact Phone:', 'w3']] },
  { t: 'sh', text: 'Home Care Agency' },
  { t: 'html', html: `<div class="row"><div class="fld"><span class="lb">Agency Name:</span><span class="vl">${AGENCY.legal}</span></div><div class="fld w3"><span class="lb">Phone Number:</span><span class="vl">${AGENCY.phone}</span></div></div><div class="row"><div class="fld"><span class="lb">Address:</span><span class="vl">${ADDRESS_LINE}</span></div></div>` },
  { t: 'row', f: [['supervisor_name', 'Supervisor of direct care services:'], ['assessment_date', 'Date of Assessment:', 'w3', 'date']] },
  { t: 'checks', k: 'assessment_reason', label: 'Reason for Assessment', opts: ['Initial Assessment (New Client)', 'Reassessment (Existing Client)'], single: true },
  { t: 'sh', text: 'Assessment Areas' },
  { t: 'sh2', text: '1. Physical Health' },
  area('a_diagnoses', 'Current diagnoses', 'List any current medical conditions or diagnoses.'),
  area('a_limitations', 'Functional limitations', "Describe any physical limitations that affect the client's daily activities."),
  area('a_mobility', 'Mobility', "Assess the client's ability to move around safely and independently (e.g., walking, transferring)."),
  area('a_pain', 'Pain management', "Evaluate the client's pain level and current pain management strategies."),
  area('a_medications', 'Medications', "Review the client's current medications and any potential side effects. (Note: This assessment focuses on non-medical services and does not include medication management.)"),
  { t: 'sh2', text: '2. Mental Health' },
  area('a_cognitive', 'Cognitive functioning', "Assess the client's memory, orientation, and ability to follow directions."),
  area('a_mood', 'Mood and emotional state', "Evaluate the client's emotional well-being and identify any signs of depression, anxiety, or confusion."),
  area('a_safety', 'Safety concerns', 'Identify any potential risks related to cognitive decline or mental health.'),
  { t: 'sh2', text: '3. Social Environment' },
  area('a_living', 'Living situation', 'Describe who lives in the home with the client and their ability to assist with care.'),
  area('a_support', 'Social support network', "Identify the client's support system, including family, friends, and community resources."),
  area('a_isolation', 'Social isolation', "Assess the client's risk for social isolation and loneliness."),
  { t: 'sh2', text: '4. Activities of Daily Living (ADLs)' },
  area('a_bathing', 'Bathing', "Evaluate the client's ability to bathe independently and the level of assistance required (e.g., supervision, physical assistance)."),
  area('a_dressing', 'Dressing', "Assess the client's ability to dress independently and the level of assistance required."),
  area('a_eating', 'Eating', "Evaluate the client's ability to eat independently and the level of assistance required."),
  area('a_toileting', 'Toileting', "Evaluate the client's ability to use the toilet independently and the level of assistance required."),
  area('a_transferring', 'Transferring', "Assess the client's ability to move from one position to another (e.g., bed to chair) and the level of assistance required."),
  area('a_continence', 'Continence', "Assess the client's ability to control bladder and bowel function."),
  { t: 'sh2', text: '5. Instrumental Activities of Daily Living (IADLs)' },
  area('a_housekeeping', 'Housekeeping', "Evaluate the client's ability to perform tasks such as cleaning, laundry, and waste disposal."),
  area('a_meals', 'Meal preparation', "Assess the client's ability to plan, prepare, and cook meals."),
  area('a_med_mgmt', 'Medication management', "This assessment does not include medication administration. It focuses on the client's ability to manage their medication schedule and refills. (Non-medical service)"),
  area('a_transport', 'Transportation', "Evaluate the client's ability to get around independently or with assistance."),
  area('a_shopping', 'Shopping', "Assess the client's ability to shop for groceries and other necessities."),
  { t: 'sig', f: [['sig_supervisor', 'Supervisor of direct care services signature'], ['sig_supervisor_date', 'Date', 'date']] },
  { t: 'sig', f: [['sig_client', "Client's signature"], ['sig_client_date', 'Date', 'date']] },
]

export const render = (data = {}) => renderItems(schema, data)
