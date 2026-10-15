import { renderItems } from '../formkit.js'

export const title = 'Home Safety Assessment'

export const SAFETY_SECTIONS = [
  { title: 'Environment', items: ['Safe and adequate food and water supplies', 'Stove and means for refrigeration present', 'Adequate heat and ventilation', 'Free from infestation', 'Pathways free of obstacles such as loose rugs, furniture, etc.', 'Clean area exists in which to store medical supplies', 'Is cautious with heating pads', 'Has a working smoke detector', 'If uses oxygen, appropriate signs posted'] },
  { title: 'Fire / Electrical', items: ['Fire exits available; warning devices installed', 'No overuse of extension cords / adequate electrical outlets available', 'Turns off oven and stove burners', 'Emergency telephone numbers posted by phone', 'Turns pot handles to back of stove', 'Uses space heaters cautiously', 'Does not smoke in bed', 'Oxygen precautions used'] },
  { title: 'Bathroom Safety', items: ['No throw rugs', 'Safety bars present and in good condition', 'Lighting is adequate', 'Shower chair is sturdy and in good working condition'] },
  { title: 'Medication Use', items: ['Keeps all medications in original bottle or med box', 'Has a medication schedule', 'Home safety instructions given'] },
]

export const schema = [
  { t: 'title', text: 'Home Safety Assessment' },
  { t: 'row', f: [['patient_name', 'Client Name:'], ['mr', 'Record #:', 'w3']] },
  { t: 'row', f: [['address', 'Address:'], ['lives_with', 'Client Lives With:', 'w3']] },
  { t: 'row', f: [['hs_completed_by', 'Evaluation Completed By (print):'], ['hs_date', 'Date:', 'w2', 'date']] },
  { t: 'ynTable', k: 'hs', sections: SAFETY_SECTIONS, numLabel: 'Item No.', descLabel: 'Description', label: 'Home safety checklist' },
  { t: 'lines', k: 'hs_recommendations', label: 'Recommendations:', n: 3 },
  { t: 'p', html: 'As of the date of this evaluation, I attest that this home is a safe environment for services/care.' },
  { t: 'sig', f: [['hs_sig_rep', 'Agency Representative Signature'], ['hs_sig_date', 'Date', 'date']] },
]

export const render = (data = {}) => renderItems(schema, data)
