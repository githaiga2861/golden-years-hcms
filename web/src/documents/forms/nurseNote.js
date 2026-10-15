import { AGENCY } from '../brand.js'
import { renderItems } from '../formkit.js'

export const title = "Skilled Nurse's Note"

const C = (k, label, opts, cols = 2) => ({ t: 'checks', k, label, opts, cols })

// Body-system panels laid out three across, like the original form.
const sys = (cols) => ({ t: 'cols', cols })

export const schema = [
  { t: 'title', text: "Skilled Nurse's Note" },
  { t: 'row', f: [['patient_name', 'Patient:'], ['sn_date', 'Date:', 'w2', 'date'], ['sn_time_in', 'Time Arrived:', 'w2'], ['sn_time_out', 'Time Left:', 'w2']] },
  sys([
    [C('sn_visit_type', 'Visit Type', ['Admission', 'Post Hospital', 'Supervisory', 'Scheduled Visit', 'Unscheduled Visit (explain): {{sn_unsched|Unscheduled visit reason|1in}}'], 2)],
    [C('sn_supplies', 'Supplies Used', ['Probe Cover', 'Gloves', 'Alcohol Pads', 'Glucose Strips', 'Lancets', 'Syringes', "4x4's", 'NS', 'Kerlix', 'Other: {{sn_supplies_other|Other supplies|0.9in}}'], 3)],
  ]),
  { t: 'row', f: [['sn_purpose', 'Purpose of Visit:']] },
  { t: 'sh', text: 'Clinical Findings' },
  { t: 'table', k: 'sn_vitals', head: ['T', 'AP', 'RP', 'Resp', 'Weight — actual', 'Weight — pt/cg states', 'BP lying R / L', 'BP sitting R / L', 'BP standing R / L'], rows: [[null, null, null, null, null, null, null, null, null]], rowH: 20 },
  sys([
    [{ t: 'sh2', text: 'Neurological' }, C('sn_orient', 'Orientation', ['Alert', 'Oriented', 'Disoriented', 'Confused', 'Forgetful', 'No verbal response', 'No response to pain', 'Sedated but arouses', 'Aphasic', 'Dysphasic', 'Other: {{sn_orient_other|Orientation – other|0.8in}}']),
      C('sn_pupils', 'Pupils', ['ERL', 'Legally blind', 'Tremors']),
      C('sn_grip', 'Grip', ['Strong', 'Weak', 'Weak arm R', 'Weak arm L', 'Weak leg R', 'Weak leg L', 'Pain: {{sn_grip_pain|Grip – pain|0.8in}}'])],
    [{ t: 'sh2', text: 'Gastrointestinal' }, C('sn_abdomen', 'Abdomen', ['Soft', 'Firm', 'Distended', 'Tender', 'Bowel sounds present (4 quadrants)', 'Constipation', 'Diarrhea', 'Ostomy', 'Rectal bleeding', 'Incontinent of bowel', 'Pain', 'Nausea / vomiting', 'Black tarry stool']),
      { t: 'row', f: [['sn_last_bm', 'Date last BM:']] }, { t: 'row', f: [['sn_gi_other', 'Other:']] }],
    [{ t: 'sh2', text: 'Integumentary' }, C('sn_skin', 'Skin', ['Warm', 'Cool', 'Dry', 'Moist', 'Pink', 'Pale', 'Cyanotic', 'Mucous membranes pink', 'Mouth ulcer', 'Elastic turgor <3 sec', 'Poor turgor >2 sec', 'Rash', 'Itching', 'Bruises', 'Incision', 'Pain']),
      { t: 'row', f: [['sn_skin_race', 'Normal for race:']] }, { t: 'row', f: [['sn_skin_other', 'Other:']] }],
  ]),
  sys([
    [{ t: 'sh2', text: 'Cardiovascular' }, C('sn_pulse', 'Pulse / circulation', ['Apical / radial', 'Regular', 'Irregular', 'PP present']),
      C('sn_edema', 'Edema', ['Pitting +1', 'Pitting +2', 'Pitting +3', 'Non-pitting', 'Chest pain']),
      C('sn_periph', 'Peripheral', ['Sensation', 'Paresthesia', 'Tenderness', 'Capillary refill', 'Cyanosis', 'Pink']),
      C('sn_av', 'AV shunt', ['Bruit', 'Thrill']), { t: 'row', f: [['sn_cv_other', 'Other:']] }],
    [{ t: 'sh2', text: 'Respiratory' }, C('sn_breathing', 'Breathing', ['Unlabored', 'Labored', 'Clear', 'Wheezing', 'Rhonchi', 'Rales', 'Secretion / amt.', 'SOB', 'DOE']),
      C('sn_cough', 'Cough', ['Productive', 'Non-productive', 'Moist', 'Dry', 'Pain']),
      { t: 'row', f: [['sn_cough_color', 'Color of:'], ['sn_o2', 'O2:', 'w1']] }, { t: 'row', f: [['sn_resp_other', 'Other:']] }],
    [{ t: 'sh2', text: 'Musculoskeletal' }, C('sn_musc', '', ['No difficulty', 'Weakness', 'Pain', 'Stiffness']), C('sn_gait', 'Gait', ['Steady', 'Unsteady', 'Contractures', 'Amputation']), { t: 'row', f: [['sn_musc_other', 'Other:']] },
      { t: 'sh2', text: 'Genitourinary' }, C('sn_gu', '', ['No difficulty', 'Dysuria', 'Pain', 'Hematuria', 'Odor', 'Incontinent']),
      { t: 'row', f: [['sn_gu_color', 'Color:'], ['sn_gu_clarity', 'Clarity:']] }, { t: 'row', f: [['sn_gu_nocturia', 'Nocturia:'], ['sn_foley', 'Foley (size):']] }, { t: 'row', f: [['sn_foley_changed', 'Last changed:']] }],
  ]),
  sys([
    [{ t: 'sh2', text: 'Psychosocial' }, C('sn_psych', '', ['Cooperative', 'Uncooperative', 'Grieving', 'Demanding', 'Anxious', 'Withdrawn', 'Sad', 'Other: {{sn_psych_other|Psychosocial – other|0.8in}}'])],
    [{ t: 'sh2', text: 'Nutrition' }, C('sn_nutrition', '', ['Weight gain', 'Weight loss']), { t: 'row', f: [['sn_diet', 'Diet type:']] }, C('sn_appetite', 'Appetite', ['Fair', 'Poor', 'Normal'], 3)],
    [{ t: 'sh2', text: 'Blood Sugar' }, C('sn_bs', '', ['WNL', 'Right finger', 'Left finger', 'Performed by SN', 'Performed by patient/caregiver', 'S/S hyperglycemia']), { t: 'row', f: [['sn_bs_result', 'Results:']] }],
  ]),
  { t: 'sh', text: 'Interventions' },
  C('sn_interventions', '', ['Foley insert / irrig', 'Wound dsg change', 'Decubitus care', 'Venipuncture', 'Dig. exam & removal', 'Enema', 'Bowel/bladder regimen', 'C/P instruction', 'Injection', 'Diabetic care', 'Prep / adm. insulin', 'Teaching', 'Ostomy / ileo-conduit', 'Tube feeding', 'Inhalation RX', 'Trach care', 'Activity restrictions', 'Diet / fluid intake', "Medication AVSE's", 'Safety', 'Pain control', 'Universal precautions', 'Assessment DX process', 'Sharps disposal per protocol', 'Soiled dressing disposal per protocol', 'Orders received', 'No orders received', 'Tolerated procedure well', 'SQ', 'IM', 'Aseptic technique', 'Sterile technique'], 4),
  { t: 'row', f: [['sn_rn_notified', 'RN / Supervisor notified of:'], ['sn_md_notified', 'MD notified of:']] },
  sys([
    [{ t: 'sh2', text: 'Response to Teaching' }, C('sn_resp_teach', '', ['Verbalizes understanding', 'Cannot verbalize understanding', 'Returns demonstration correctly', 'Returns demonstration incorrectly', 'Needs further supervision', 'Needs further instruction'], 1), { t: 'yn', k: 'sn_teach_guide', label: 'Teaching guide:' }],
    [{ t: 'sh2', text: 'Supervisory Visit' }, C('sn_superv', '', ['HHA', 'LPN/LVN', 'Pt satisfied with care', 'Present', 'Instruction given', 'Following care plan', 'Care plan updated'], 1)],
    [{ t: 'sh2', text: 'Activity Level' }, C('sn_activity', '', ['Independent', 'Dependent'], 2), C('sn_inject', 'Unable to self-inject due to', ['Poor grip', 'Hand tremors', 'Arthritic hands', 'Phobia of needles']), C('sn_homebound', 'Homebound due to', ['Shortness of breath', 'Dyspnea on exertion', 'Poor endurance', 'Req. asst. of 1–2 others to leave home'], 1)],
  ]),
  { t: 'lines', k: 'sn_new_meds', label: 'New Meds / Treatment', n: 3 },
  { t: 'cols', cols: [[{ t: 'yn', k: 'sn_med_profile', label: 'Update patient med. profile:' }, { t: 'yn', k: 'sn_meds_reviewed', label: 'Meds reviewed:' }, { t: 'yn', k: 'sn_caregiver', label: 'Available caregiver:' }, { t: 'yn', k: 'sn_dc_aware', label: 'Patient aware of DC plans:' }],
    [{ t: 'row', f: [['sn_next_visit', 'Next visit planned:']] }, { t: 'yn', k: 'sn_visits_trend', label: 'Are visits:', opts: ['Inc', 'Decr', 'Same'] }, { t: 'yn', k: 'sn_pt_notified', label: 'Patient notified:' }, { t: 'row', f: [['sn_next_md', 'Next MD visit:']] }]] },
  { t: 'lines', k: 'sn_progress', label: 'Pt response / progress toward goals', n: 2 },
  { t: 'sh', text: 'Pain Assessment' },
  { t: 'html', html: `<table class="form" style="text-align:center"><tr>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<th style="text-align:center;width:9%">${n}</th>`).join('')}</tr><tr><td colspan="2" class="small">No pain</td><td colspan="3" class="small">Mild</td><td colspan="3" class="small">Moderate</td><td colspan="3" class="small">Severe / worst possible</td></tr></table>` },
  { t: 'table', k: 'sn_pain', head: ['Pain assessment', 'Site 1', 'Site 2', 'Site 3'], widths: ['34%'], rows: [['Location', null, null, null], ['Onset', null, null, null], ['Present level (0–10)', null, null, null], ['Worst pain gets (0–10)', null, null, null], ['Best pain gets (0–10)', null, null, null], ['Pain description (aching, radiating, throbbing, etc.)', null, null, null]] },
  { t: 'lines', k: 'sn_pain_other', label: 'Other pertinent factors', n: 2 },
  { t: 'sh', text: 'Phlebotomy' },
  { t: 'p', html: 'Labs {{sn_labs|Labs ordered|3.5in}}' },
  { t: 'p', html: 'Venipuncture {{sn_vp_attempts|# of attempts|0.6in}} (# of attempts) to {{sn_vp_site|Venipuncture site|1.2in}} (site) with {{sn_needle|Needle gauge|0.6in}} ga. needle / vacutainer using universal precautions. Applied pressure {{sn_pressure|Minutes pressure applied|0.5in}} minutes.' },
  { t: 'cols', cols: [[{ t: 'yn', k: 'sn_cooler', label: 'Transport in cooler:' }], [C('sn_delivered', 'Delivered to', ['Hospital', 'MD', 'Lab: {{sn_lab_name|Lab name|1in}}'], 3)]] },
  { t: 'lines', k: 'sn_phleb_comments', label: 'Comments (sharps disposal)', n: 2 },
  { t: 'sh', text: 'Skin Assessment' },
  { t: 'table', k: 'sn_wounds', head: ['', 'Location', 'Appearance', 'Size L × W × D (cm)', 'Tunneling', 'Stage (I–IV)', 'Status (improved / worse / no change / healed)', 'Comments'], rows: [[{ s: '<b>Wound #1</b>' }, null, null, null, null, null, null, null], [{ s: '<b>Wound #2</b>' }, null, null, null, null, null, null, null]], rowH: 34 },
  { t: 'sh', text: 'IV Nursing' },
  { t: 'p', html: 'Patient / family willing / able to administer therapy: {{sn_iv_willing|Willing/able (Yes/No + explain)|3.2in}}' },
  sys([
    [C('sn_iv_type', 'Service type / location', ['Peripheral', 'Start', 'Restart', 'DC', 'N/A', 'Midline', 'CVC', 'PICC', 'Groshong', 'Port', 'Subclavian'], 3)],
    [C('sn_iv_dressing', 'IV dressing', ['Change — Yes', 'Change — No', 'Intact — Yes', 'Intact — No'])],
    [{ t: 'lines', k: 'sn_iv_meds', label: 'IV medications', n: 3 }],
  ]),
  { t: 'p', html: 'Line access: central / peripheral with {{sn_iv_ga|Line gauge|0.6in}} ga. {{sn_iv_in|Needle length (in.)|0.6in}} in. needle · {{sn_iv_cc|Syringe CC|0.6in}} CC syringe(s) · Irrigated {{sn_iv_irrig|Irrigated ml N/S|0.6in}} ml N/S pre &amp; post draw · Flushed {{sn_iv_flush|Flushed ml N/S|0.6in}} ml N/S, heparin {{sn_iv_heparin|Heparin u/cc|0.6in}} u/cc' },
  sys([
    [C('sn_iv_site', 'Site assessment', ['Sutures', 'Redness', 'Edema', 'Leaking', 'Bleeding', 'Heat', 'Pain', 'Skin breakdown', 'Cath fully inserted', 'Infiltration', 'Universal precautions used', 'Sharps disposal'])],
    [C('sn_iv_teach', 'Teaching', ['Bathing care', 'Univ. pre. / BioMed disposal', 'Safety / infection control', 'Energy prep / 24 hr avail', 'Self administration', 'Schedule / dose', 'Action / SE', 'S/S to report', 'Contraindication', 'Cath maintenance', 'Medication change', 'Discharge plan'])],
    [C('sn_iv_resp', 'Response to IV teaching', ['Verbalizes understanding', 'Cannot verbalize understanding', 'Correct return demonstration', 'Incorrect return demonstration', 'Needs further supervision', 'Needs further instruction'], 1), { t: 'row', f: [['sn_pump', 'Pump / setting:']] }],
  ]),
  { t: 'lines', k: 'sn_iv_response', label: 'Response to IV therapy', n: 2 },
  { t: 'table', k: 'sn_footer', rows: [[{ s: `<b>Agency:</b> ${AGENCY.legal}`, span: 2 }, { s: '<b>Time in:</b> {{sn_time_in|Time in|0.8in}}' }, { s: '<b>Time out:</b> {{sn_time_out|Time out|0.8in}}' }], [{ s: '<b>Patient (last, first, middle):</b> {{patient_name|Patient name|2.2in}}', span: 2 }, { s: '<b>Date:</b> {{sn_date|Visit date|1in}}', span: 2 }]] },
  { t: 'sig', f: [['sn_nurse_sig', 'Nurse signature'], ['sn_nurse_title', 'Title', 'date']] },
]

export const render = (data = {}) => `<div class="dense">${renderItems(schema, data)}</div>`
