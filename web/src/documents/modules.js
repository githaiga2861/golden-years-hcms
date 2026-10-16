import * as admission from './admission.js'
import * as assessment from './forms/assessment.js'
import * as safety from './forms/homeSafety.js'
import * as nurse from './forms/nurseNote.js'
import * as management from './forms/management.js'
import * as policy from './policyManual.js'
import * as homecare from './homeCareManual.js'
import * as progress from './forms/progressNotes.js'
import * as medication from './forms/medication.js'
import * as physician from './forms/physicianComm.js'
import { WORKSHEETS, worksheetModule } from './forms/policyWorksheets.js'

// doc key → { schema, render(data, opts) (may be async), defaults? }
export const MODULES = {
  admission, assessment, safety, nurse, progress, medication, physician, management, policy, homecare,
  ...Object.fromEntries(WORKSHEETS.map((w) => [`ws_${w.key}`, worksheetModule(w.key)])),
}
