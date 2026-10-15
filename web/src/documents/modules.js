import * as admission from './admission.js'
import * as assessment from './forms/assessment.js'
import * as safety from './forms/homeSafety.js'
import * as nurse from './forms/nurseNote.js'
import * as management from './forms/management.js'
import * as policy from './policyManual.js'
import { WORKSHEETS, worksheetModule } from './forms/policyWorksheets.js'

// doc key → { schema, render(data, opts) (may be async), defaults? }
export const MODULES = {
  admission, assessment, safety, nurse, management, policy,
  ...Object.fromEntries(WORKSHEETS.map((w) => [`ws_${w.key}`, worksheetModule(w.key)])),
}
